import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Store } from 'lucide-react';
import { formatDate } from '@/lib/utils-crm';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const emptyDealer = {
    firm_name: '', contact_name: '', phone: '', email: '', gstin: '', address: '', city: '', state: '', pincode: '',
    crop_types: '', status: 'active', team_id: '', assigned_rep_id: '', create_login: false,
};

export default function Dealers() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyDealer);
    const [reps, setReps] = useState([]);
    const [teams, setTeams] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const canEdit = ['owner', 'admin', 'manager', 'sales_rep'].includes(user?.role);

    const load = async () => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (statusFilter) params.set('status', statusFilter);
        const { data } = await api.get(`/dealers?${params.toString()}`);
        setItems(data);
    };
    const loadAux = async () => {
        try {
            if (['owner', 'admin', 'manager'].includes(user?.role)) {
                const [{ data: u }, { data: t }] = await Promise.all([api.get('/users'), api.get('/teams')]);
                setReps(u.filter((x) => x.role === 'sales_rep'));
                setTeams(t);
            }
        } catch { /* noop */ }
    };
    useEffect(() => { load(); }, [q, statusFilter]);
    useEffect(() => { loadAux(); /* eslint-disable-next-line */ }, [user?.role]);

    const save = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                crop_types: form.crop_types ? form.crop_types.split(',').map((s) => s.trim()).filter(Boolean) : [],
                assigned_rep_id: form.assigned_rep_id || null,
                team_id: form.team_id || null,
                email: form.email || null,
            };
            await api.post('/dealers', payload);
            toast.success('Dealer onboarded');
            setOpen(false);
            setForm(emptyDealer);
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to save'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6" data-testid="dealers-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Dealers</h1>
                    <p className="text-sm text-muted-foreground">Onboard, manage and review dealers in your territory.</p>
                </div>
                {canEdit && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="dealer-create-button"><Plus className="h-4 w-4 mr-2" /> Onboard dealer</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Onboard new dealer</DialogTitle></DialogHeader>
                            <form className="space-y-4" onSubmit={save}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Firm name" required><Input data-testid="dealer-firm-name-input" value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} required /></Field>
                                    <Field label="Contact name" required><Input data-testid="dealer-contact-name-input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required /></Field>
                                    <Field label="Phone" required><Input data-testid="dealer-phone-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
                                    <Field label="Email"><Input data-testid="dealer-email-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                                    <Field label="GSTIN"><Input data-testid="dealer-gstin-input" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></Field>
                                    <Field label="City"><Input data-testid="dealer-city-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
                                    <Field label="State"><Input data-testid="dealer-state-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
                                    <Field label="Pincode"><Input data-testid="dealer-pincode-input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
                                </div>
                                <Field label="Address"><Textarea data-testid="dealer-address-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                                <Field label="Crop types (comma separated)"><Input data-testid="dealer-crops-input" value={form.crop_types} onChange={(e) => setForm({ ...form, crop_types: e.target.value })} placeholder="Grapes, Sugarcane, Cotton" /></Field>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Field label="Status">
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                            <SelectTrigger data-testid="dealer-status-select"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="prospect">Prospect</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    {['owner', 'admin', 'manager'].includes(user?.role) && (
                                        <>
                                            <Field label="Assign to rep">
                                                <Select value={form.assigned_rep_id} onValueChange={(v) => setForm({ ...form, assigned_rep_id: v })}>
                                                    <SelectTrigger data-testid="dealer-rep-select"><SelectValue placeholder="Select rep" /></SelectTrigger>
                                                    <SelectContent>
                                                        {reps.map((r) => <SelectItem key={r.user_id} value={r.user_id}>{r.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field label="Team">
                                                <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                                                    <SelectTrigger data-testid="dealer-team-select"><SelectValue placeholder="Select team" /></SelectTrigger>
                                                    <SelectContent>
                                                        {teams.map((t) => <SelectItem key={t.team_id} value={t.team_id}>{t.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                        </>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={form.create_login} onCheckedChange={(v) => setForm({ ...form, create_login: !!v })} data-testid="dealer-create-login-checkbox" />
                                    Also create a dealer login (default password: <span className="font-mono">Passw0rd!</span>). Requires email.
                                </label>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} data-testid="dealer-save-button">{submitting ? 'Saving…' : 'Save dealer'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by firm, contact, phone or city" className="pl-9 h-10 rounded-xl" data-testid="dealers-search-input" />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 rounded-xl" data-testid="dealers-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.length === 0 && <div className="text-sm text-muted-foreground col-span-full py-10 text-center" data-testid="dealers-empty">No dealers match your filters. <br /> Start by adding your first dealer.</div>}
                    {items.map((d) => (
                        <Link to={`/dealers/${d.dealer_id}`} key={d.dealer_id} className="rounded-2xl border bg-card p-4 hover:border-primary transition-colors" data-testid={`dealers-row-${d.dealer_id}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4 text-primary" />
                                        <h3 className="font-medium truncate">{d.firm_name}</h3>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{d.contact_name} · {d.phone}</div>
                                    <div className="text-xs text-muted-foreground truncate">{d.city}{d.state ? `, ${d.state}` : ''}</div>
                                </div>
                                <Badge variant={d.status === 'active' ? 'default' : d.status === 'prospect' ? 'secondary' : 'outline'} className="font-normal capitalize">{d.status}</Badge>
                            </div>
                            {d.crop_types?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {d.crop_types.slice(0, 3).map((c) => <span key={c} className="text-[11px] rounded-full bg-secondary px-2 py-0.5">{c}</span>)}
                                </div>
                            )}
                            <div className="mt-2 text-[11px] text-muted-foreground">Added {formatDate(d.created_at)}</div>
                        </Link>
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
