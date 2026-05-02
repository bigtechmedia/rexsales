import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS, formatDate } from '@/lib/utils-crm';

const emptyUser = { email: '', name: '', role: 'sales_rep', password: 'Passw0rd!', phone: '', area: '', team_ids: [] };

export default function Users() {
    const { user } = useAuth();
    const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.role);
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyUser);
    const [editingId, setEditingId] = useState(null);

    const load = async () => { const { data } = await api.get('/users'); setItems(data); };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await api.patch(`/users/${editingId}`, payload);
                toast.success('User updated');
            } else {
                await api.post('/users', form);
                toast.success('User created');
            }
            setOpen(false);
            setForm(emptyUser);
            setEditingId(null);
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    const startEdit = (u) => {
        setEditingId(u.user_id);
        setForm({ email: u.email, name: u.name, role: u.role, password: '', phone: u.phone || '', area: u.area || '', team_ids: u.team_ids || [] });
        setOpen(true);
    };
    const startCreate = () => { setEditingId(null); setForm(emptyUser); setOpen(true); };

    const del = async (uid) => {
        if (!window.confirm('Delete user?')) return;
        await api.delete(`/users/${uid}`);
        toast.success('Deleted');
        load();
    };

    return (
        <div className="space-y-6" data-testid="users-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Users</h1>
                    <p className="text-sm text-muted-foreground">Create and manage users across all roles.</p>
                </div>
                {isOwnerOrAdmin && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={startCreate} data-testid="user-create-button"><Plus className="h-4 w-4 mr-2" /> New user</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{editingId ? 'Edit user' : 'Create user'}</DialogTitle></DialogHeader>
                            <form className="space-y-3" onSubmit={save}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="user-name-input" /></Field>
                                    <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editingId} data-testid="user-email-input" /></Field>
                                    <Field label="Role">
                                        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                                            <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="owner">Owner</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="sales_rep">Sales Rep</SelectItem>
                                                <SelectItem value="dealer">Dealer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label={editingId ? 'New password (blank to keep)' : 'Password'}><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" /></Field>
                                    <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="user-phone-input" /></Field>
                                    <Field label="Area"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} data-testid="user-area-input" /></Field>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" data-testid="user-save-button">{editingId ? 'Save changes' : 'Create user'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="divide-y">
                    {items.map((u) => (
                        <div key={u.user_id} className="py-3 flex items-center gap-3 flex-wrap" data-testid={`user-row-${u.user_id}`}>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{u.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{u.email} · {u.area || '—'}</div>
                                <div className="text-[11px] text-muted-foreground">Joined {formatDate(u.created_at)}</div>
                            </div>
                            <Badge variant="outline" className="font-normal">{ROLE_LABELS[u.role]}</Badge>
                            {isOwnerOrAdmin && (
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(u)} data-testid={`user-edit-${u.user_id}`}>Edit</Button>
                                    <Button variant="ghost" size="icon" onClick={() => del(u.user_id)} data-testid={`user-delete-${u.user_id}`}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            )}
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
