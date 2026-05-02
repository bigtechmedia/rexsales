export const ROLE_LABELS = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    sales_rep: 'Sales Rep',
    dealer: 'Dealer',
};

export const REPORT_TYPES = [
    { value: 'sales_requirement', label: 'Sales Requirement', icon: 'ClipboardList' },
    { value: 'sales_enquiry', label: 'Sales Enquiry', icon: 'MessageSquare' },
    { value: 'product_enquiry', label: 'Product Enquiry', icon: 'Package' },
    { value: 'field_report', label: 'Field Report', icon: 'MapPin' },
    { value: 'farm_visit', label: 'Farm Visit', icon: 'Sprout' },
    { value: 'dealer_visit', label: 'Dealer Visit', icon: 'Store' },
    { value: 'area_status', label: 'Area Status', icon: 'Compass' },
];

export const REQUEST_TYPES = [
    { value: 'expense', label: 'Expense' },
    { value: 'leave', label: 'Leave' },
    { value: 'travel', label: 'Travel' },
];

export function formatCurrency(n) {
    if (n === null || n === undefined) return '—';
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    } catch {
        return `₹${n}`;
    }
}

export function formatDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return iso;
    }
}

export function formatDay(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
        return iso;
    }
}

export function relativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function initials(name) {
    if (!name) return '?';
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}
