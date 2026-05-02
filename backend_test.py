"""Comprehensive backend API testing for Rex Botanix CRM."""
import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://agro-report-hub.preview.emergentagent.com/api"

class CRMTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tokens = {}
        self.created_ids = {}
        
    def log(self, msg, level="INFO"):
        print(f"[{level}] {msg}")
    
    def test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test."""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                self.log(f"❌ Unknown method {method}", "ERROR")
                return False, {}
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} (Status: {response.status_code})")
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    self.log(f"   Response: {response.text[:200]}", "ERROR")
                except:
                    pass
            
            try:
                return success, response.json() if response.text else {}
            except:
                return success, {}
        
        except Exception as e:
            self.log(f"❌ FAILED - {name} - Exception: {str(e)}", "ERROR")
            return False, {}
    
    def test_auth(self):
        """Test authentication for all 5 roles."""
        self.log("\n=== TESTING AUTHENTICATION ===", "INFO")
        
        test_users = [
            ('owner@rexbotanix.com', 'owner'),
            ('admin@rexbotanix.com', 'admin'),
            ('manager@rexbotanix.com', 'manager'),
            ('rep@rexbotanix.com', 'sales_rep'),
            ('dealer@rexbotanix.com', 'dealer'),
        ]
        
        for email, expected_role in test_users:
            success, resp = self.test(
                f"Login as {expected_role}",
                "POST",
                "auth/login",
                200,
                data={"email": email, "password": "Passw0rd!"}
            )
            if success and 'session_token' in resp and 'user' in resp:
                self.tokens[expected_role] = resp['session_token']
                if resp['user'].get('role') == expected_role:
                    self.log(f"   ✓ Role verified: {expected_role}")
                else:
                    self.log(f"   ✗ Role mismatch: expected {expected_role}, got {resp['user'].get('role')}", "ERROR")
            else:
                self.log(f"   ✗ Login failed for {expected_role}", "ERROR")
        
        # Test /me endpoint
        if 'admin' in self.tokens:
            success, resp = self.test(
                "GET /auth/me",
                "GET",
                "auth/me",
                200,
                token=self.tokens['admin']
            )
            if success and resp.get('email') == 'admin@rexbotanix.com':
                self.log("   ✓ /auth/me returns correct user")
        
        # Test logout
        if 'sales_rep' in self.tokens:
            success, _ = self.test(
                "POST /auth/logout",
                "POST",
                "auth/logout",
                200,
                token=self.tokens['sales_rep']
            )
            # Re-login for further tests
            success, resp = self.test(
                "Re-login as sales_rep",
                "POST",
                "auth/login",
                200,
                data={"email": "rep@rexbotanix.com", "password": "Passw0rd!"}
            )
            if success:
                self.tokens['sales_rep'] = resp['session_token']
    
    def test_dealers(self):
        """Test dealer CRUD and RBAC."""
        self.log("\n=== TESTING DEALERS ===", "INFO")
        
        # List dealers as admin
        success, dealers = self.test(
            "List dealers (admin)",
            "GET",
            "dealers",
            200,
            token=self.tokens.get('admin')
        )
        if success:
            self.log(f"   ✓ Found {len(dealers)} dealers")
        
        # Create dealer as sales_rep
        dealer_data = {
            "firm_name": "Test Agro Store",
            "contact_name": "Test Contact",
            "phone": "+91 98000 99999",
            "email": "testdealer@example.com",
            "city": "Mumbai",
            "state": "Maharashtra",
            "status": "active",
            "crop_types": ["Cotton", "Wheat"],
            "create_login": False
        }
        success, resp = self.test(
            "Create dealer (sales_rep)",
            "POST",
            "dealers",
            200,
            data=dealer_data,
            token=self.tokens.get('sales_rep')
        )
        if success and 'dealer_id' in resp:
            self.created_ids['dealer'] = resp['dealer_id']
            self.log(f"   ✓ Created dealer: {resp['dealer_id']}")
        
        # Get dealer by ID
        if 'dealer' in self.created_ids:
            success, _ = self.test(
                "Get dealer by ID",
                "GET",
                f"dealers/{self.created_ids['dealer']}",
                200,
                token=self.tokens.get('sales_rep')
            )
        
        # Update dealer
        if 'dealer' in self.created_ids:
            update_data = {**dealer_data, "status": "inactive"}
            success, _ = self.test(
                "Update dealer",
                "PATCH",
                f"dealers/{self.created_ids['dealer']}",
                200,
                data=update_data,
                token=self.tokens.get('admin')
            )
        
        # Test RBAC: dealer role should only see their own
        success, dealer_list = self.test(
            "List dealers (dealer role)",
            "GET",
            "dealers",
            200,
            token=self.tokens.get('dealer')
        )
        if success:
            self.log(f"   ✓ Dealer sees {len(dealer_list)} dealer(s)")
        
        # Delete dealer (admin only)
        if 'dealer' in self.created_ids:
            success, _ = self.test(
                "Delete dealer (admin)",
                "DELETE",
                f"dealers/{self.created_ids['dealer']}",
                200,
                token=self.tokens.get('admin')
            )
    
    def test_products(self):
        """Test product CRUD (admin-only create/update/delete)."""
        self.log("\n=== TESTING PRODUCTS ===", "INFO")
        
        # List products (all roles)
        success, products = self.test(
            "List products (sales_rep)",
            "GET",
            "products",
            200,
            token=self.tokens.get('sales_rep')
        )
        if success:
            self.log(f"   ✓ Found {len(products)} products")
        
        # Create product (admin only)
        product_data = {
            "name": "Test Fertilizer XYZ",
            "sku": "TEST-XYZ-001",
            "category": "Test Category",
            "unit": "Bag",
            "pack_size": "50kg",
            "mrp": 1500.0
        }
        success, resp = self.test(
            "Create product (admin)",
            "POST",
            "products",
            200,
            data=product_data,
            token=self.tokens.get('admin')
        )
        if success and 'product_id' in resp:
            self.created_ids['product'] = resp['product_id']
            self.log(f"   ✓ Created product: {resp['product_id']}")
        
        # Try create as sales_rep (should fail)
        success, _ = self.test(
            "Create product (sales_rep - should fail)",
            "POST",
            "products",
            403,
            data=product_data,
            token=self.tokens.get('sales_rep')
        )
        
        # Update product
        if 'product' in self.created_ids:
            update_data = {**product_data, "mrp": 1600.0}
            success, _ = self.test(
                "Update product (admin)",
                "PATCH",
                f"products/{self.created_ids['product']}",
                200,
                data=update_data,
                token=self.tokens.get('admin')
            )
        
        # Delete product
        if 'product' in self.created_ids:
            success, _ = self.test(
                "Delete product (admin)",
                "DELETE",
                f"products/{self.created_ids['product']}",
                200,
                token=self.tokens.get('admin')
            )
    
    def test_teams(self):
        """Test team CRUD (admin-only)."""
        self.log("\n=== TESTING TEAMS ===", "INFO")
        
        # List teams
        success, teams = self.test(
            "List teams (admin)",
            "GET",
            "teams",
            200,
            token=self.tokens.get('admin')
        )
        if success:
            self.log(f"   ✓ Found {len(teams)} team(s)")
        
        # Create team
        team_data = {
            "name": "Test Sales Team",
            "description": "Test team for automation",
            "manager_id": None,
            "member_ids": []
        }
        success, resp = self.test(
            "Create team (admin)",
            "POST",
            "teams",
            200,
            data=team_data,
            token=self.tokens.get('admin')
        )
        if success and 'team_id' in resp:
            self.created_ids['team'] = resp['team_id']
            self.log(f"   ✓ Created team: {resp['team_id']}")
        
        # Add members to team
        if 'team' in self.created_ids:
            # Get a user ID first
            success, users = self.test(
                "List users to get member ID",
                "GET",
                "users",
                200,
                token=self.tokens.get('admin')
            )
            if success and len(users) > 0:
                member_id = users[0].get('user_id')
                success, _ = self.test(
                    "Add member to team",
                    "POST",
                    f"teams/{self.created_ids['team']}/members",
                    200,
                    data={"member_ids": [member_id]},
                    token=self.tokens.get('admin')
                )
        
        # Delete team
        if 'team' in self.created_ids:
            success, _ = self.test(
                "Delete team (admin)",
                "DELETE",
                f"teams/{self.created_ids['team']}",
                200,
                token=self.tokens.get('admin')
            )
    
    def test_reports(self):
        """Test report creation with all 7 types and attachments."""
        self.log("\n=== TESTING REPORTS ===", "INFO")
        
        report_types = [
            'sales_requirement',
            'sales_enquiry',
            'product_enquiry',
            'field_report',
            'farm_visit',
            'dealer_visit',
            'area_status'
        ]
        
        # Create a report for each type
        for report_type in report_types:
            report_data = {
                "type": report_type,
                "title": f"Test {report_type.replace('_', ' ').title()}",
                "summary": f"Test summary for {report_type}",
                "location": "Test Location",
                "notes": "Test notes",
                "attachments": [
                    {
                        "filename": "test.jpg",
                        "mime": "image/jpeg",
                        "data_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
                        "size": 1024
                    }
                ]
            }
            success, resp = self.test(
                f"Create {report_type} report",
                "POST",
                "reports",
                200,
                data=report_data,
                token=self.tokens.get('sales_rep')
            )
            if success and 'report_id' in resp:
                if report_type == 'farm_visit':
                    self.created_ids['report'] = resp['report_id']
                self.log(f"   ✓ Created {report_type}: {resp['report_id']}")
        
        # List reports
        success, reports = self.test(
            "List reports (sales_rep)",
            "GET",
            "reports",
            200,
            token=self.tokens.get('sales_rep')
        )
        if success:
            self.log(f"   ✓ Found {len(reports)} report(s)")
        
        # List with type filter
        success, filtered = self.test(
            "List reports with type filter",
            "GET",
            "reports",
            200,
            params={"type": "farm_visit"},
            token=self.tokens.get('sales_rep')
        )
        if success:
            self.log(f"   ✓ Filtered reports: {len(filtered)}")
        
        # Get report by ID
        if 'report' in self.created_ids:
            success, report = self.test(
                "Get report by ID",
                "GET",
                f"reports/{self.created_ids['report']}",
                200,
                token=self.tokens.get('sales_rep')
            )
            if success and 'attachments' in report:
                self.log(f"   ✓ Report has {len(report['attachments'])} attachment(s)")
        
        # Test RBAC: admin sees all
        success, admin_reports = self.test(
            "List reports (admin - sees all)",
            "GET",
            "reports",
            200,
            token=self.tokens.get('admin')
        )
        if success:
            self.log(f"   ✓ Admin sees {len(admin_reports)} report(s)")
        
        # Delete report
        if 'report' in self.created_ids:
            success, _ = self.test(
                "Delete report",
                "DELETE",
                f"reports/{self.created_ids['report']}",
                200,
                token=self.tokens.get('sales_rep')
            )
    
    def test_requests(self):
        """Test request creation and approval flow."""
        self.log("\n=== TESTING REQUESTS & APPROVALS ===", "INFO")
        
        # Create expense request
        expense_data = {
            "type": "expense",
            "title": "Test Expense Claim",
            "description": "Travel and food expenses",
            "amount": 2500.0,
            "attachments": []
        }
        success, resp = self.test(
            "Create expense request",
            "POST",
            "requests",
            200,
            data=expense_data,
            token=self.tokens.get('sales_rep')
        )
        if success and 'request_id' in resp:
            self.created_ids['expense_request'] = resp['request_id']
            self.log(f"   ✓ Created expense request: {resp['request_id']}")
        
        # Create leave request
        leave_data = {
            "type": "leave",
            "title": "Test Leave Request",
            "description": "Personal leave",
            "start_date": "2025-09-01",
            "end_date": "2025-09-03",
            "attachments": []
        }
        success, resp = self.test(
            "Create leave request",
            "POST",
            "requests",
            200,
            data=leave_data,
            token=self.tokens.get('sales_rep')
        )
        if success and 'request_id' in resp:
            self.created_ids['leave_request'] = resp['request_id']
            self.log(f"   ✓ Created leave request: {resp['request_id']}")
        
        # Create travel request
        travel_data = {
            "type": "travel",
            "title": "Test Travel Request",
            "description": "Client visit",
            "destination": "Nashik",
            "mode": "Car",
            "start_date": "2025-09-10",
            "attachments": []
        }
        success, resp = self.test(
            "Create travel request",
            "POST",
            "requests",
            200,
            data=travel_data,
            token=self.tokens.get('sales_rep')
        )
        if success and 'request_id' in resp:
            self.created_ids['travel_request'] = resp['request_id']
            self.log(f"   ✓ Created travel request: {resp['request_id']}")
        
        # List requests
        success, requests = self.test(
            "List requests (sales_rep)",
            "GET",
            "requests",
            200,
            token=self.tokens.get('sales_rep')
        )
        if success:
            self.log(f"   ✓ Found {len(requests)} request(s)")
        
        # Approve request (as admin)
        if 'expense_request' in self.created_ids:
            success, resp = self.test(
                "Approve expense request (admin)",
                "POST",
                f"requests/{self.created_ids['expense_request']}/action",
                200,
                data={"action": "approve", "note": "Approved for testing"},
                token=self.tokens.get('admin')
            )
            if success and resp.get('status') == 'approved':
                self.log("   ✓ Request approved successfully")
        
        # Reject request (as manager)
        if 'leave_request' in self.created_ids:
            success, resp = self.test(
                "Reject leave request (manager)",
                "POST",
                f"requests/{self.created_ids['leave_request']}/action",
                200,
                data={"action": "reject", "note": "Not approved for testing"},
                token=self.tokens.get('manager')
            )
            if success and resp.get('status') == 'rejected':
                self.log("   ✓ Request rejected successfully")
    
    def test_messaging(self):
        """Test messaging threads and messages with polling."""
        self.log("\n=== TESTING MESSAGING ===", "INFO")
        
        # Get user IDs for participants
        success, users = self.test(
            "List users for messaging",
            "GET",
            "users",
            200,
            token=self.tokens.get('admin')
        )
        
        participant_ids = []
        if success and len(users) >= 2:
            participant_ids = [users[0]['user_id'], users[1]['user_id']]
        
        # Create thread
        if len(participant_ids) >= 2:
            thread_data = {
                "name": "Test Thread",
                "participant_ids": participant_ids,
                "topic": "Testing messaging"
            }
            success, resp = self.test(
                "Create messaging thread",
                "POST",
                "messaging/threads",
                200,
                data=thread_data,
                token=self.tokens.get('admin')
            )
            if success and 'thread_id' in resp:
                self.created_ids['thread'] = resp['thread_id']
                self.log(f"   ✓ Created thread: {resp['thread_id']}")
        
        # List threads
        success, threads = self.test(
            "List messaging threads",
            "GET",
            "messaging/threads",
            200,
            token=self.tokens.get('admin')
        )
        if success:
            self.log(f"   ✓ Found {len(threads)} thread(s)")
        
        # Send message
        if 'thread' in self.created_ids:
            message_data = {
                "thread_id": self.created_ids['thread'],
                "text": "Test message content",
                "attachments": []
            }
            success, resp = self.test(
                "Send message",
                "POST",
                "messaging/messages",
                200,
                data=message_data,
                token=self.tokens.get('admin')
            )
            if success and 'message_id' in resp:
                self.log(f"   ✓ Sent message: {resp['message_id']}")
        
        # List messages (polling support)
        if 'thread' in self.created_ids:
            success, messages = self.test(
                "List messages in thread",
                "GET",
                f"messaging/threads/{self.created_ids['thread']}/messages",
                200,
                token=self.tokens.get('admin')
            )
            if success:
                self.log(f"   ✓ Found {len(messages)} message(s)")
            
            # Test polling with ?after parameter
            if len(messages) > 0:
                last_msg_time = messages[-1].get('created_at', '')
                success, new_msgs = self.test(
                    "Poll for new messages",
                    "GET",
                    f"messaging/threads/{self.created_ids['thread']}/messages",
                    200,
                    params={"after": last_msg_time},
                    token=self.tokens.get('admin')
                )
                if success:
                    self.log(f"   ✓ Polling returned {len(new_msgs)} new message(s)")
    
    def test_notifications(self):
        """Test notifications list/read/mark-all-read."""
        self.log("\n=== TESTING NOTIFICATIONS ===", "INFO")
        
        # List notifications
        success, notifs = self.test(
            "List notifications",
            "GET",
            "notifications",
            200,
            token=self.tokens.get('sales_rep')
        )
        if success:
            self.log(f"   ✓ Found {len(notifs)} notification(s)")
            unread = [n for n in notifs if not n.get('read')]
            self.log(f"   ✓ Unread: {len(unread)}")
        
        # Mark notification as read
        if success and len(notifs) > 0:
            notif_id = notifs[0].get('notification_id')
            if notif_id:
                success, _ = self.test(
                    "Mark notification as read",
                    "POST",
                    f"notifications/{notif_id}/read",
                    200,
                    token=self.tokens.get('sales_rep')
                )
        
        # Mark all as read
        success, _ = self.test(
            "Mark all notifications as read",
            "POST",
            "notifications/read-all",
            200,
            token=self.tokens.get('sales_rep')
        )
    
    def test_dashboard(self):
        """Test dashboard summary with role-based KPIs."""
        self.log("\n=== TESTING DASHBOARD ===", "INFO")
        
        # Test dashboard for each role
        roles = ['owner', 'admin', 'manager', 'sales_rep', 'dealer']
        for role in roles:
            if role in self.tokens:
                success, summary = self.test(
                    f"Dashboard summary ({role})",
                    "GET",
                    "dashboard/summary",
                    200,
                    token=self.tokens[role]
                )
                if success:
                    kpis = summary.get('kpis', {})
                    self.log(f"   ✓ {role} dashboard: {len(kpis)} KPIs")
                    if role in ('owner', 'admin'):
                        if 'top_reps' in summary:
                            self.log(f"   ✓ Top reps data present")
                        if 'team_breakdown' in summary:
                            self.log(f"   ✓ Team breakdown present")
    
    def test_users(self):
        """Test user CRUD (admin/owner only)."""
        self.log("\n=== TESTING USERS ===", "INFO")
        
        # List users
        success, users = self.test(
            "List users (admin)",
            "GET",
            "users",
            200,
            token=self.tokens.get('admin')
        )
        if success:
            self.log(f"   ✓ Found {len(users)} user(s)")
        
        # Create user
        user_data = {
            "email": "testuser@rexbotanix.com",
            "name": "Test User",
            "role": "sales_rep",
            "password": "TestPass123!",
            "phone": "+91 98000 88888",
            "area": "Test Area"
        }
        success, resp = self.test(
            "Create user (admin)",
            "POST",
            "users",
            200,
            data=user_data,
            token=self.tokens.get('admin')
        )
        if success and 'user_id' in resp:
            self.created_ids['user'] = resp['user_id']
            self.log(f"   ✓ Created user: {resp['user_id']}")
        
        # Update user
        if 'user' in self.created_ids:
            update_data = {
                "name": "Updated Test User",
                "area": "Updated Area"
            }
            success, _ = self.test(
                "Update user (admin)",
                "PATCH",
                f"users/{self.created_ids['user']}",
                200,
                data=update_data,
                token=self.tokens.get('admin')
            )
        
        # Delete user
        if 'user' in self.created_ids:
            success, _ = self.test(
                "Delete user (admin)",
                "DELETE",
                f"users/{self.created_ids['user']}",
                200,
                token=self.tokens.get('admin')
            )
        
        # Test RBAC: sales_rep cannot access users
        success, _ = self.test(
            "List users (sales_rep - should fail)",
            "GET",
            "users",
            403,
            token=self.tokens.get('sales_rep')
        )
    
    def run_all_tests(self):
        """Run all test suites."""
        self.log("\n" + "="*60)
        self.log("REX BOTANIX CRM - BACKEND API TESTING")
        self.log("="*60)
        
        try:
            self.test_auth()
            self.test_dealers()
            self.test_products()
            self.test_teams()
            self.test_reports()
            self.test_requests()
            self.test_messaging()
            self.test_notifications()
            self.test_dashboard()
            self.test_users()
        except Exception as e:
            self.log(f"Test suite error: {str(e)}", "ERROR")
        
        self.log("\n" + "="*60)
        self.log(f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        self.log("="*60)
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = CRMTester()
    sys.exit(tester.run_all_tests())
