import React, { useEffect, useMemo, useState } from 'react';
import api, { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { REPORT_TYPES, formatCurrency, formatDate } from '@/lib/utils-crm';
import { Plus, Search, Download, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

function isOverdue(r) {
    if (!r?.due_at) return false;
    if (r.resolved) return false;
    try { return new Date(r.due_at).getTime() < Date.now(); } catch { return false; }
}

export default function Reports() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [type, setType] = useState('');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [overdueOnly, setOverdueOnly] = useState(false);

    const canExport = ['owner', 'admin', 'manager', 'sales_rep'].includes(user?.role);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            if (overdueOnly) params.set('overdue', 'true');
            const { data } = await api.get(`/reports?${params.toString()}`);
            setItems(data);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [type, overdueOnly]);

    const filtered = useMemo(() => {
        if (!q) return items;
        const needle = q.toLowerCase();
        return items.filter((r) =>
            (r.title || '').toLowerCase().includes(needle) ||
            (r.author_name || '').toLowerCase().includes(needle) ||
            (r.summary || '').toLowerCase().includes(needle)
        );
    }, [items, q]);

    const download = async (fmt) => {
        try {
            const url = `${API_BASE}/exports/reports.${fmt}${type ? `?type=${type}` : ''}`;
            const token = localStorage.getItem('rbx_session_token');
            const res = await fetch(url, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error(`Export failed (${res.status})`);
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const fname = `rex_botanix_reports.${fmt}`;
            link.download = fname;
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success(`Exported ${fmt.toUpperCase()}`);
        } catch (e) { toast.error(e.message || 'Export failed'); }
    };

    const resolve = async (id) => {
        try {
            await api.post(`/reports/${id}/resolve`, { resolved: true });
            toast.success('Marked resolved');
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    return (
        <div className="space-y-6" data-testid="reports-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground">Field reports, visits, enquiries and sales requirements.</p>
                </div>
                <div className="flex items-center gap-2">
                    {canExport && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" data-testid="reports-export-trigger"><Download className="h-4 w-4 mr-2" /> Export <ChevronDown className="h-3 w-3 ml-1" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => download('csv')} data-testid="reports-export-csv">Export as CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => download('pdf')} data-testid="reports-export-pdf">Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {['owner', 'admin', 'manager', 'sales_rep', 'dealer'].includes(user?.role) && (
                        <Link to="/reports/new"><Button data-testid="reports-new-button"><Plus className="h-4 w-4 mr-2" /> New report</Button></Link>
                    )}
                </div>
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, author or summary" className="pl-9 h-10 rounded-xl" data-testid="reports-search-input" />
                    </div>
                    <Select value={type} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-52 rounded-xl" data-testid="reports-type-filter"><SelectValue placeholder="All report types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All report types</SelectItem>
                            {REPORT_TYPES.map((rt) => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant={overdueOnly ? 'default' : 'outline'} onClick={() => setOverdueOnly((v) => !v)} data-testid="reports-overdue-toggle">
                        <AlertTriangle className="h-4 w-4 mr-2" /> {overdueOnly ? 'Showing overdue' : 'Overdue only'}
                    </Button>
                </div>

                <div className="mt-4 divide-y">
                    {loading && <div className="text-sm text-muted-foreground py-6">Loading…</div>}
                    {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center" data-testid="reports-empty">No reports match your filters.</div>}
                    {filtered.map((r) => (
                        <div key={r.report_id} className="py-3 hover:bg-muted/40 rounded-xl px-2" data-testid={`reports-row-${r.report_id}`}>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="outline" className="font-normal">{REPORT_TYPES.find((x) => x.value === r.type)?.label || r.type}</Badge>
                                {isOverdue(r) && <Badge variant="outline" className="font-normal bg-destructive/10 text-destructive border-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>}
                                {r.resolved && <Badge variant="outline" className="font-normal bg-primary/10 text-primary border-primary"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</Badge>}
                                <Link to={`/reports/${r.report_id}`} className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{r.title}</div>
                                    {r.summary && <div className="text-xs text-muted-foreground line-clamp-1">{r.summary}</div>}
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        By {r.author_name} · {formatDate(r.created_at)}
                                        {r.due_at && <span> · Due {formatDate(r.due_at)}</span>}
                                    </div>
                                </Link>
                                {r.amount != null && <div className="text-sm tabular-nums">{formatCurrency(r.amount)}</div>}
                                {!r.resolved && ['owner', 'admin', 'manager', 'sales_rep'].includes(user?.role) && (r.next_action || r.due_at) && (
                                    <Button variant="ghost" size="sm" onClick={() => resolve(r.report_id)} data-testid={`reports-resolve-${r.report_id}`}>
                                        <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
