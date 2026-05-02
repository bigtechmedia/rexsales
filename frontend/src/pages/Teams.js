import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Teams() {
    const { user } = useAuth();
    const isAdmin = ['owner', 'admin'].includes(user?.role);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', manager_id: '', member_ids: [] });

    const load = async () => {
        const [{ data: ts }, { data: us }] = await Promise.all([api.get('/teams'), api.get('/users').catch(() => ({ data: [] }))]);
        setTeams(ts);
        setUsers(us);
    };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teams', form);
            toast.success('Team created');
            setOpen(false);
            setForm({ name: '', description: '', manager_id: '', member_ids: [] });
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    const addMembers = async (team_id, member_ids) => {
        try {
            await api.post(`/teams/${team_id}/members`, { member_ids });
            toast.success('Members added');
            load();
        } catch { toast.error('Failed'); }
    };
    const removeMember = async (team_id, user_id) => {
        try {
            await api.delete(`/teams/${team_id}/members/${user_id}`);
            toast.success('Removed');
            load();
        } catch { toast.error('Failed'); }
    };
    const deleteTeam = async (team_id) => {
        if (!window.confirm('Delete team?')) return;
        await api.delete(`/teams/${team_id}`);
        toast.success('Team deleted');
        load();
    };

    const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.user_id, u])), [users]);

    return (
        <div className="space-y-6" data-testid="teams-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Teams</h1>
                    <p className="text-sm text-muted-foreground">Group reps under managers. A user can belong to multiple teams.</p>
                </div>
                {isAdmin && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="team-create-button"><Plus className="h-4 w-4 mr-2" /> New team</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
                            <form className="space-y-3" onSubmit={save}>
                                <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="team-name-input" /></Field>
                                <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="team-description-input" /></Field>
                                <Field label="Manager">
                                    <Select value={form.manager_id} onValueChange={(v) => setForm({ ...form, manager_id: v })}>
                                        <SelectTrigger data-testid="team-manager-select"><SelectValue placeholder="Select manager" /></SelectTrigger>
                                        <SelectContent>
                                            {users.filter((u) => ['manager', 'admin', 'owner'].includes(u.role)).map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <div>
                                    <Label className="text-xs">Members</Label>
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border bg-card p-2 space-y-1">
                                        {users.filter((u) => ['sales_rep', 'manager'].includes(u.role)).map((u) => (
                                            <label key={u.user_id} className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={form.member_ids.includes(u.user_id)}
                                                    onCheckedChange={(v) => setForm((f) => ({
                                                        ...f,
                                                        member_ids: v ? [...f.member_ids, u.user_id] : f.member_ids.filter((x) => x !== u.user_id),
                                                    }))}
                                                    data-testid={`team-member-${u.user_id}`}
                                                />
                                                <span>{u.name} · <span className="text-muted-foreground capitalize">{u.role.replace('_', ' ')}</span></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" data-testid="team-save-button">Create team</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.length === 0 && <div className="text-sm text-muted-foreground col-span-full py-10 text-center" data-testid="teams-empty">No teams yet.</div>}
                {teams.map((t) => (
                    <Card key={t.team_id} className="rounded-2xl p-4 md:p-5 space-y-3" data-testid={`team-card-${t.team_id}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h3 className="font-medium">{t.name}</h3></div>
                                {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                                <div className="text-xs text-muted-foreground">Manager: {userMap[t.manager_id]?.name || '—'}</div>
                            </div>
                            {isAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => deleteTeam(t.team_id)} data-testid={`team-delete-${t.team_id}`}><Trash2 className="h-4 w-4" /></Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(t.member_ids || []).map((mid) => (
                                <Badge key={mid} variant="secondary" className="font-normal pr-1">
                                    {userMap[mid]?.name || mid}
                                    {isAdmin && (
                                        <button onClick={() => removeMember(t.team_id, mid)} className="ml-1 text-muted-foreground hover:text-destructive" data-testid={`team-remove-${t.team_id}-${mid}`}>×</button>
                                    )}
                                </Badge>
                            ))}
                        </div>
                        {isAdmin && (
                            <AddMembersControl team={t} users={users.filter((u) => !t.member_ids?.includes(u.user_id) && ['sales_rep', 'manager'].includes(u.role))} onAdd={addMembers} />
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

function AddMembersControl({ team, users, onAdd }) {
    const [value, setValue] = useState('');
    return (
        <div className="flex items-center gap-2">
            <Select value={value} onValueChange={setValue}>
                <SelectTrigger className="flex-1" data-testid={`team-add-select-${team.team_id}`}><SelectValue placeholder="Add member" /></SelectTrigger>
                <SelectContent>
                    {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { if (value) { onAdd(team.team_id, [value]); setValue(''); } }} data-testid={`team-add-button-${team.team_id}`}>Add</Button>
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
