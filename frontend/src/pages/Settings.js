import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/utils-crm';

export default function Settings() {
    const { user } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const change = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/users/me/password', { current_password: current, new_password: next });
            toast.success('Password updated');
            setCurrent(''); setNext('');
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6 max-w-2xl" data-testid="settings-page">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your profile and account security.</p>
            </div>
            <Card className="rounded-2xl p-4 md:p-6 space-y-3">
                <h3 className="font-display font-semibold">Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <Info label="Name" value={user?.name} />
                    <Info label="Email" value={user?.email} />
                    <Info label="Role" value={ROLE_LABELS[user?.role]} />
                    <Info label="Area" value={user?.area || '—'} />
                </div>
            </Card>
            <Card className="rounded-2xl p-4 md:p-6">
                <h3 className="font-display font-semibold">Change password</h3>
                <form className="mt-3 space-y-3 max-w-md" onSubmit={change}>
                    <Field label="Current password"><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required data-testid="settings-current-password" /></Field>
                    <Field label="New password"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required data-testid="settings-new-password" /></Field>
                    <Button type="submit" disabled={submitting} data-testid="settings-save-password">{submitting ? 'Saving…' : 'Update password'}</Button>
                </form>
            </Card>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div>{value || '—'}</div>
        </div>
    );
}
function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
        </div>
    );
}
