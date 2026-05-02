import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

const empty = {
    name: '', code: '', region: '', state: '', description: '',
    districts: '', team_id: '', manager_id: '', rep_ids: [],
    center: { lat: '', lng: '' },
};

export default function Territories() {
    const { user } = useAuth();
    const canEdit = ['owner', 'admin'].includes(user?.role);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(empty);
    const [editingId, setEditingId] = useState(null);

    const load = async () => {
        const [{ data: ts }, { data: us }, { data: tm }] = await Promise.all([
            api.get('/territories'),
            api.get('/users').catch(() => ({ data: [] })),
            api.get('/teams').catch(() => ({ data: [] })),
        ]);
        setItems(ts);
        setUsers(us);
        setTeams(tm);
    };
    useEffect(() => { load(); }, []);

    const startCreate = () => { setEditingId(null); setForm(empty); setOpen(true); };
    const startEdit = (t) => {
        setEditingId(t.territory_id);
        setForm({
            name: t.name || '', code: t.code || '', region: t.region || '', state: t.state || '',
            description: t.description || '', districts: (t.districts || []).join(', '),
            team_id: t.team_id || '', manager_id: t.manager_id || '', rep_ids: t.rep_ids || [],
            center: t.center || { lat: '', lng: '' },
        });
        setOpen(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                districts: form.districts ? form.districts.split(',').map((x) => x.trim()).filter(Boolean) : [],
                center: form.center?.lat && form.center?.lng ? { lat: Number(form.center.lat), lng: Number(form.center.lng) } : null,
                team_id: form.team_id || null,
                manager_id: form.manager_id || null,
            };
            if (editingId) {
                await api.patch(`/territories/${editingId}`, payload);
                toast.success('Territory updated');
            } else {
                await api.post('/territories', payload);
                toast.success('Territory created');
            }
            setOpen(false); setForm(empty); setEditingId(null);
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    const del = async (tid) => {
        if (!window.confirm('Delete territory?')) return;
        try { await api.delete(`/territories/${tid}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
    };

    const toggleRep = (id) => setForm((f) => ({ ...f, rep_ids: f.rep_ids.includes(id) ? f.rep_ids.filter((x) => x !== id) : [...f.rep_ids, id] }));

    return (
        <div className="space-y-6" data-testid="territories-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Territories</h1>
                    <p className="text-sm text-muted-foreground">Regions, districts, coverage teams and geo centers.</p>
                </div>
                {canEdit && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={startCreate} data-testid="territory-create-button"><Plus className="h-4 w-4 mr-2" /> New territory</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>{editingId ? 'Edit territory' : 'Create territory'}</DialogTitle></DialogHeader>
                            <form className="space-y-3" onSubmit={save}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="territory-name-input" /></Field>
                                    <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MH-PUN" data-testid="territory-code-input" /></Field>
                                    <Field label="Region"><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="West / North" data-testid="territory-region-input" /></Field>
                                    <Field label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} data-testid="territory-state-input" /></Field>
                                </div>
                                <Field label="Districts (comma separated)"><Input value={form.districts} onChange={(e) => setForm({ ...form, districts: e.target.value })} placeholder="Pune, Pimpri-Chinchwad" data-testid="territory-districts-input" /></Field>
                                <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="territory-description-input" /></Field>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Latitude (center)"><Input type="number" step="0.0001" value={form.center.lat} onChange={(e) => setForm({ ...form, center: { ...form.center, lat: e.target.value } })} data-testid="territory-lat-input" /></Field>
                                    <Field label="Longitude (center)"><Input type="number" step="0.0001" value={form.center.lng} onChange={(e) => setForm({ ...form, center: { ...form.center, lng: e.target.value } })} data-testid="territory-lng-input" /></Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Team">
                                        <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                                            <SelectTrigger data-testid="territory-team-select"><SelectValue placeholder="Select team" /></SelectTrigger>
                                            <SelectContent>
                                                {teams.map((t) => <SelectItem key={t.team_id} value={t.team_id}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Manager">
                                        <Select value={form.manager_id} onValueChange={(v) => setForm({ ...form, manager_id: v })}>
                                            <SelectTrigger data-testid="territory-manager-select"><SelectValue placeholder="Select manager" /></SelectTrigger>
                                            <SelectContent>
                                                {users.filter((u) => ['manager', 'admin', 'owner'].includes(u.role)).map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                                <div>
                                    <Label className="text-xs">Reps covering this territory</Label>
                                    <div className="mt-1 max-h-36 overflow-y-auto rounded-xl border bg-card p-2 space-y-1">
                                        {users.filter((u) => u.role === 'sales_rep').map((u) => (
                                            <label key={u.user_id} className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={form.rep_ids.includes(u.user_id)} onChange={() => toggleRep(u.user_id)} data-testid={`territory-rep-${u.user_id}`} />
                                                <span>{u.name} · <span className="text-muted-foreground">{u.area || '—'}</span></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" data-testid="territory-save-button">{editingId ? 'Save changes' : 'Create territory'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.length === 0 && <div className="text-sm text-muted-foreground col-span-full py-10 text-center" data-testid="territories-empty">No territories yet.</div>}
                {items.map((t) => (
                    <Card key={t.territory_id} className="rounded-2xl p-4 space-y-2" data-testid={`territory-card-${t.territory_id}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <h3 className="font-medium truncate">{t.name}</h3>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">{t.code || '—'}</div>
                                <div className="text-xs text-muted-foreground">{t.region}{t.state ? ` · ${t.state}` : ''}</div>
                            </div>
                            {canEdit && (
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(t)} data-testid={`territory-edit-${t.territory_id}`}>Edit</Button>
                                    <Button variant="ghost" size="icon" onClick={() => del(t.territory_id)} data-testid={`territory-delete-${t.territory_id}`}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                        {t.districts?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {t.districts.map((d) => <Badge key={d} variant="outline" className="font-normal">{d}</Badge>)}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {(t.rep_ids || []).length} rep(s)
                        </div>
                        {t.center?.lat && (
                            <div className="text-[11px] text-muted-foreground font-mono">{Number(t.center.lat).toFixed(4)}, {Number(t.center.lng).toFixed(4)}</div>
                        )}
                        {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                    </Card>
                ))}
            </div>
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
