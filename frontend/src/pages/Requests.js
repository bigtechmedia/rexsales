import React, { useEffect, useState } from 'react';
import api, { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import { REQUEST_TYPES, formatCurrency, formatDate } from '@/lib/utils-crm';
import { Plus, Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const emptyReq = {
    type: 'expense', title: '', description: '', amount: '', start_date: '', end_date: '', destination: '', mode: '', attachments: [],
};

export default function Requests() {
    const { user } = useAuth();
    const canExport = ['owner', 'admin', 'manager'].includes(user?.role);
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyReq);
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        const { data } = await api.get('/requests?scope=mine');
        setItems(data);
    };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form, amount: form.amount ? Number(form.amount) : null };
            await api.post('/requests', payload);
            toast.success('Request submitted');
            setOpen(false);
            setForm(emptyReq);
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to submit'); }
        finally { setSubmitting(false); }
    };

    const download = async () => {
        try {
            const url = `${API_BASE}/exports/requests.csv`;
            const token = localStorage.getItem('rbx_session_token');
            const res = await fetch(url, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error(`Export failed (${res.status})`);
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'rex_botanix_requests.csv';
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success('Exported CSV');
        } catch (e) { toast.error(e.message || 'Export failed'); }
    };

    return (
        <div className="space-y-6" data-testid="requests-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">My requests</h1>
                    <p className="text-sm text-muted-foreground">Expense, leave and travel requests — track status and notes from approvers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {canExport && (
                        <Button variant="outline" onClick={download} data-testid="requests-export-csv"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                    )}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="request-create-button"><Plus className="h-4 w-4 mr-2" /> New request</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>Submit a new request</DialogTitle></DialogHeader>
                            <form className="space-y-4" onSubmit={save}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Type">
                                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                            <SelectTrigger data-testid="request-type-select"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {REQUEST_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="request-title-input" /></Field>
                                </div>
                                <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="request-description-input" /></Field>
                                {form.type === 'expense' && (
                                    <Field label="Amount (INR)"><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="request-amount-input" /></Field>
                                )}
                                {(form.type === 'leave' || form.type === 'travel') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} data-testid="request-start-date-input" /></Field>
                                        <Field label="End date"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} data-testid="request-end-date-input" /></Field>
                                    </div>
                                )}
                                {form.type === 'travel' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} data-testid="request-destination-input" /></Field>
                                        <Field label="Mode"><Input value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} placeholder="Train / Bus / Cab" data-testid="request-mode-input" /></Field>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-xs mb-2 inline-block">Attachments (bills, tickets)</Label>
                                    <AttachmentGrid editable attachments={form.attachments} onChange={(a) => setForm({ ...form, attachments: a })} testIdPrefix="request-attachment" />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} data-testid="request-submit-button">{submitting ? 'Submitting…' : 'Submit'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="divide-y">
                    {items.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center" data-testid="requests-empty">No requests yet.</div>}
                    {items.map((r) => (
                        <div key={r.request_id} className="py-3 flex items-center gap-3 flex-wrap" data-testid={`requests-row-${r.request_id}`}>
                            <Badge variant="outline" className="font-normal capitalize">{r.type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{r.title}</div>
                                {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                                <div className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
                            </div>
                            {r.amount != null && <div className="text-sm tabular-nums">{formatCurrency(r.amount)}</div>}
                            <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'outline'} className="font-normal capitalize">{r.status}</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
            {children}
        </div>
    );
}
