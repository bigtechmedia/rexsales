"""Backend API tests for Rex Botanix CRM Phase 3 enhancements."""
import requests
import sys
from datetime import datetime, timezone, timedelta
import time

BASE_URL = "https://agro-report-hub.preview.emergentagent.com/api"
PASSWORD = "Passw0rd!"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class TestRunner:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.tokens = {}
        self.test_data = {}

    def log(self, msg, color=Colors.BLUE):
        print(f"{color}{msg}{Colors.END}")

    def login(self, email):
        """Login and store token."""
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": PASSWORD}, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                self.tokens[email] = data.get('session_token')
                self.log(f"✓ Logged in as {email}", Colors.GREEN)
                return True
            else:
                self.log(f"✗ Login failed for {email}: {resp.status_code}", Colors.RED)
                return False
        except Exception as e:
            self.log(f"✗ Login error for {email}: {e}", Colors.RED)
            return False

    def test(self, name, method, endpoint, expected_status, token=None, json_data=None, params=None, check_response=None):
        """Run a single test."""
        self.tests_run += 1
        url = f"{BASE_URL}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                resp = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                resp = requests.post(url, headers=headers, json=json_data, timeout=15)
            elif method == 'PATCH':
                resp = requests.patch(url, headers=headers, json=json_data, timeout=15)
            elif method == 'DELETE':
                resp = requests.delete(url, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = resp.status_code == expected_status
            if success:
                # Additional response checks
                if check_response and resp.status_code < 400:
                    try:
                        data = resp.json()
                        if not check_response(data):
                            success = False
                            self.log(f"  ✗ {name} - Response check failed", Colors.RED)
                            self.tests_failed += 1
                            return False, None
                    except:
                        pass

                self.tests_passed += 1
                self.log(f"  ✓ {name} - {resp.status_code}", Colors.GREEN)
                return True, resp.json() if resp.status_code < 400 and resp.text else None
            else:
                self.tests_failed += 1
                self.log(f"  ✗ {name} - Expected {expected_status}, got {resp.status_code}", Colors.RED)
                if resp.text:
                    self.log(f"    Response: {resp.text[:200]}", Colors.YELLOW)
                return False, None

        except Exception as e:
            self.tests_failed += 1
            self.log(f"  ✗ {name} - Error: {e}", Colors.RED)
            return False, None

    def run_all_tests(self):
        """Execute all Phase 3 tests."""
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("REX BOTANIX CRM - PHASE 3 BACKEND TESTS", Colors.BLUE)
        self.log("="*80 + "\n", Colors.BLUE)

        # Login all users
        self.log(">>> Logging in test users...", Colors.BLUE)
        for email in ['owner@rexbotanix.com', 'admin@rexbotanix.com', 'manager@rexbotanix.com', 
                      'rep@rexbotanix.com', 'dealer@rexbotanix.com']:
            if not self.login(email):
                self.log(f"CRITICAL: Cannot login {email}, aborting tests", Colors.RED)
                return False

        # Test 1: Granular Permissions
        self.log("\n>>> TEST GROUP 1: Granular Permissions", Colors.BLUE)
        
        # Sales rep cannot create product
        self.test(
            "Sales rep CANNOT create product (403)",
            "POST", "/products",
            403,
            token=self.tokens['rep@rexbotanix.com'],
            json_data={"name": "Test Product", "sku": "TEST-001", "category": "Test"}
        )

        # Manager cannot create user
        self.test(
            "Manager CANNOT create user (403)",
            "POST", "/users",
            403,
            token=self.tokens['manager@rexbotanix.com'],
            json_data={"email": "test@test.com", "name": "Test User", "role": "sales_rep"}
        )

        # Manager cannot create product
        self.test(
            "Manager CANNOT create product (403)",
            "POST", "/products",
            403,
            token=self.tokens['manager@rexbotanix.com'],
            json_data={"name": "Test Product", "sku": "TEST-002", "category": "Test"}
        )

        # Manager cannot create territory
        self.test(
            "Manager CANNOT create territory (403)",
            "POST", "/territories",
            403,
            token=self.tokens['manager@rexbotanix.com'],
            json_data={"name": "Test Territory", "code": "TEST"}
        )

        # Admin CAN create user
        success, user_data = self.test(
            "Admin CAN create user (201)",
            "POST", "/users",
            201,
            token=self.tokens['admin@rexbotanix.com'],
            json_data={"email": f"testuser_{int(time.time())}@test.com", "name": "Test User", "role": "sales_rep", "password": "Test123!"}
        )
        if success and user_data:
            self.test_data['created_user_id'] = user_data.get('user_id')

        # Admin CAN create product
        success, product_data = self.test(
            "Admin CAN create product (201)",
            "POST", "/products",
            201,
            token=self.tokens['admin@rexbotanix.com'],
            json_data={"name": f"Test Product {int(time.time())}", "sku": f"TEST-{int(time.time())}", "category": "Test"}
        )
        if success and product_data:
            self.test_data['created_product_id'] = product_data.get('product_id')

        # Admin CAN create territory
        success, territory_data = self.test(
            "Admin CAN create territory (201)",
            "POST", "/territories",
            201,
            token=self.tokens['admin@rexbotanix.com'],
            json_data={
                "name": f"Test Territory {int(time.time())}",
                "code": f"TEST-{int(time.time())}",
                "region": "Test",
                "state": "Test State",
                "districts": ["Test District"]
            }
        )
        if success and territory_data:
            self.test_data['created_territory_id'] = territory_data.get('territory_id')

        # Owner has god mode - can create anything
        self.test(
            "Owner CAN create product (god mode)",
            "POST", "/products",
            201,
            token=self.tokens['owner@rexbotanix.com'],
            json_data={"name": f"Owner Product {int(time.time())}", "sku": f"OWN-{int(time.time())}", "category": "Test"}
        )

        # Dealer cannot create farm_visit
        self.test(
            "Dealer CANNOT create farm_visit (403)",
            "POST", "/reports",
            403,
            token=self.tokens['dealer@rexbotanix.com'],
            json_data={"type": "farm_visit", "title": "Test Farm Visit"}
        )

        # Dealer CAN create product_enquiry
        success, enquiry_data = self.test(
            "Dealer CAN create product_enquiry (201)",
            "POST", "/reports",
            201,
            token=self.tokens['dealer@rexbotanix.com'],
            json_data={"type": "product_enquiry", "title": "Test Product Enquiry", "summary": "Need info on NPK"}
        )
        if success and enquiry_data:
            self.test_data['dealer_enquiry_id'] = enquiry_data.get('report_id')

        # Test 2: Territories API
        self.log("\n>>> TEST GROUP 2: Territories API", Colors.BLUE)

        # All roles can GET territories
        for role, email in [('owner', 'owner@rexbotanix.com'), ('admin', 'admin@rexbotanix.com'),
                            ('manager', 'manager@rexbotanix.com'), ('rep', 'rep@rexbotanix.com'),
                            ('dealer', 'dealer@rexbotanix.com')]:
            success, territories = self.test(
                f"{role.capitalize()} can GET territories",
                "GET", "/territories",
                200,
                token=self.tokens[email],
                check_response=lambda d: isinstance(d, list) and len(d) >= 2
            )
            if success and territories and role == 'owner':
                self.log(f"    Found {len(territories)} territories (expected >= 2)", Colors.GREEN)

        # Only owner/admin can POST territory (already tested above)
        # Test PATCH territory
        if 'created_territory_id' in self.test_data:
            self.test(
                "Admin CAN update territory (200)",
                "PATCH", f"/territories/{self.test_data['created_territory_id']}",
                200,
                token=self.tokens['admin@rexbotanix.com'],
                json_data={"name": "Updated Territory", "code": "UPD", "region": "Updated"}
            )

        # Test 3: Reports with new fields (territory_id, geo, due_at)
        self.log("\n>>> TEST GROUP 3: Reports with Territory, Geo, and SLA fields", Colors.BLUE)

        # Create report with territory_id and geo
        now = datetime.now(timezone.utc)
        past_due = (now - timedelta(hours=2)).isoformat()
        future_due = (now + timedelta(days=3)).isoformat()

        success, report_with_geo = self.test(
            "Create report with territory_id and geo",
            "POST", "/reports",
            201,
            token=self.tokens['rep@rexbotanix.com'],
            json_data={
                "type": "farm_visit",
                "title": "Test Farm Visit with Geo",
                "summary": "Testing geo-tagging",
                "territory_id": self.test_data.get('created_territory_id', 'tty_test'),
                "geo": {
                    "lat": 18.5204,
                    "lng": 73.8567,
                    "accuracy_m": 10.5,
                    "captured_at": now.isoformat()
                },
                "farmer_name": "Test Farmer",
                "crop": "Grapes"
            }
        )
        if success and report_with_geo:
            self.test_data['report_with_geo_id'] = report_with_geo.get('report_id')

        # Create overdue report (due_at in the past)
        success, overdue_report = self.test(
            "Create report with past due_at (overdue)",
            "POST", "/reports",
            201,
            token=self.tokens['rep@rexbotanix.com'],
            json_data={
                "type": "sales_enquiry",
                "title": "Overdue Sales Enquiry",
                "summary": "This should be overdue",
                "due_at": past_due
            }
        )
        if success and overdue_report:
            self.test_data['overdue_report_id'] = overdue_report.get('report_id')

        # Create upcoming report (due in 3 days)
        success, upcoming_report = self.test(
            "Create report with future due_at (upcoming)",
            "POST", "/reports",
            201,
            token=self.tokens['rep@rexbotanix.com'],
            json_data={
                "type": "field_report",
                "title": "Upcoming Field Report",
                "summary": "Due in 3 days",
                "due_at": future_due
            }
        )
        if success and upcoming_report:
            self.test_data['upcoming_report_id'] = upcoming_report.get('report_id')

        # Test GET reports with overdue filter
        success, overdue_list = self.test(
            "GET reports with ?overdue=true filter",
            "GET", "/reports",
            200,
            token=self.tokens['rep@rexbotanix.com'],
            params={"overdue": "true"},
            check_response=lambda d: isinstance(d, list)
        )
        if success and overdue_list:
            self.log(f"    Found {len(overdue_list)} overdue report(s)", Colors.GREEN)

        # Test 4: SLA Endpoints
        self.log("\n>>> TEST GROUP 4: SLA Endpoints", Colors.BLUE)

        # GET /sla/overdue
        success, sla_overdue = self.test(
            "GET /sla/overdue",
            "GET", "/sla/overdue",
            200,
            token=self.tokens['rep@rexbotanix.com'],
            check_response=lambda d: isinstance(d, list)
        )
        if success and sla_overdue:
            self.log(f"    Found {len(sla_overdue)} overdue report(s) in SLA endpoint", Colors.GREEN)

        # GET /sla/upcoming?days=7
        success, sla_upcoming = self.test(
            "GET /sla/upcoming?days=7",
            "GET", "/sla/upcoming",
            200,
            token=self.tokens['rep@rexbotanix.com'],
            params={"days": 7},
            check_response=lambda d: isinstance(d, list)
        )
        if success and sla_upcoming:
            self.log(f"    Found {len(sla_upcoming)} upcoming report(s) due in 7 days", Colors.GREEN)

        # POST /sla/sweep (admin can trigger)
        success, sweep_result = self.test(
            "POST /sla/sweep (trigger overdue notifications)",
            "POST", "/sla/sweep",
            200,
            token=self.tokens['admin@rexbotanix.com'],
            check_response=lambda d: 'notified' in d
        )
        if success and sweep_result:
            self.log(f"    Notified {sweep_result.get('notified', 0)} recipient(s)", Colors.GREEN)

        # POST /reports/{id}/resolve
        if 'overdue_report_id' in self.test_data:
            success, resolved = self.test(
                "POST /reports/{id}/resolve - mark report resolved",
                "POST", f"/reports/{self.test_data['overdue_report_id']}/resolve",
                200,
                token=self.tokens['rep@rexbotanix.com'],
                json_data={"resolved": True, "note": "Issue resolved"}
            )
            if success and resolved:
                # Verify it's no longer in overdue list
                success2, overdue_after = self.test(
                    "Verify resolved report not in /sla/overdue",
                    "GET", "/sla/overdue",
                    200,
                    token=self.tokens['rep@rexbotanix.com'],
                    check_response=lambda d: self.test_data['overdue_report_id'] not in [r.get('report_id') for r in d]
                )

        # Test 5: Audit Log
        self.log("\n>>> TEST GROUP 5: Audit Log", Colors.BLUE)

        # Owner can access audit log
        success, audit_entries = self.test(
            "Owner CAN access /audit",
            "GET", "/audit",
            200,
            token=self.tokens['owner@rexbotanix.com'],
            check_response=lambda d: isinstance(d, list) and len(d) > 0
        )
        if success and audit_entries:
            self.log(f"    Found {len(audit_entries)} audit entries", Colors.GREEN)
            # Check for expected fields
            if audit_entries:
                entry = audit_entries[0]
                has_fields = all(k in entry for k in ['audit_id', 'actor_name', 'action', 'entity_type', 'created_at'])
                if has_fields:
                    self.log(f"    ✓ Audit entries have required fields", Colors.GREEN)
                else:
                    self.log(f"    ✗ Audit entries missing required fields", Colors.RED)

        # Admin can access audit log
        self.test(
            "Admin CAN access /audit",
            "GET", "/audit",
            200,
            token=self.tokens['admin@rexbotanix.com'],
            check_response=lambda d: isinstance(d, list)
        )

        # Manager CANNOT access audit log
        self.test(
            "Manager CANNOT access /audit (403)",
            "GET", "/audit",
            403,
            token=self.tokens['manager@rexbotanix.com']
        )

        # Test audit filters
        self.test(
            "GET /audit with entity_type filter",
            "GET", "/audit",
            200,
            token=self.tokens['owner@rexbotanix.com'],
            params={"entity_type": "report"},
            check_response=lambda d: isinstance(d, list)
        )

        self.test(
            "GET /audit with action filter",
            "GET", "/audit",
            200,
            token=self.tokens['admin@rexbotanix.com'],
            params={"action": "create"},
            check_response=lambda d: isinstance(d, list)
        )

        # Test 6: Export Endpoints
        self.log("\n>>> TEST GROUP 6: Export Endpoints (CSV/PDF)", Colors.BLUE)

        # Reports CSV export
        success, _ = self.test(
            "GET /exports/reports.csv (owner)",
            "GET", "/exports/reports.csv",
            200,
            token=self.tokens['owner@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/reports.csv (admin)",
            "GET", "/exports/reports.csv",
            200,
            token=self.tokens['admin@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/reports.csv (manager)",
            "GET", "/exports/reports.csv",
            200,
            token=self.tokens['manager@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/reports.csv (sales_rep)",
            "GET", "/exports/reports.csv",
            200,
            token=self.tokens['rep@rexbotanix.com']
        )

        # Reports PDF export
        success, _ = self.test(
            "GET /exports/reports.pdf (admin)",
            "GET", "/exports/reports.pdf",
            200,
            token=self.tokens['admin@rexbotanix.com']
        )

        # Requests CSV export
        success, _ = self.test(
            "GET /exports/requests.csv (owner)",
            "GET", "/exports/requests.csv",
            200,
            token=self.tokens['owner@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/requests.csv (admin)",
            "GET", "/exports/requests.csv",
            200,
            token=self.tokens['admin@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/requests.csv (manager)",
            "GET", "/exports/requests.csv",
            200,
            token=self.tokens['manager@rexbotanix.com']
        )

        # Dashboard PDF export
        success, _ = self.test(
            "GET /exports/dashboard.pdf (owner)",
            "GET", "/exports/dashboard.pdf",
            200,
            token=self.tokens['owner@rexbotanix.com']
        )

        success, _ = self.test(
            "GET /exports/dashboard.pdf (admin)",
            "GET", "/exports/dashboard.pdf",
            200,
            token=self.tokens['admin@rexbotanix.com']
        )

        # Dealer CANNOT export dashboard
        self.test(
            "Dealer CANNOT access /exports/dashboard.pdf (403)",
            "GET", "/exports/dashboard.pdf",
            403,
            token=self.tokens['dealer@rexbotanix.com']
        )

        # Sales rep CANNOT export dashboard
        self.test(
            "Sales rep CANNOT access /exports/dashboard.pdf (403)",
            "GET", "/exports/dashboard.pdf",
            403,
            token=self.tokens['rep@rexbotanix.com']
        )

        return True

    def print_summary(self):
        """Print test summary."""
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("TEST SUMMARY", Colors.BLUE)
        self.log("="*80, Colors.BLUE)
        self.log(f"Total tests run: {self.tests_run}", Colors.BLUE)
        self.log(f"Passed: {self.tests_passed}", Colors.GREEN)
        self.log(f"Failed: {self.tests_failed}", Colors.RED)
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success rate: {success_rate:.1f}%", Colors.GREEN if success_rate >= 90 else Colors.YELLOW)
        self.log("="*80 + "\n", Colors.BLUE)

        return self.tests_failed == 0


if __name__ == "__main__":
    runner = TestRunner()
    try:
        runner.run_all_tests()
        runner.print_summary()
        sys.exit(0 if runner.tests_failed == 0 else 1)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        runner.print_summary()
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFATAL ERROR: {e}")
        runner.print_summary()
        sys.exit(1)
