import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils-crm';

const ACTIONS = ['', 'create', 'update', 'delete', 'approve', 'reject'];
const ENTITIES = ['', 'user', 'team', 'product', 'territory', 'dealer', 'report', 'request'];

const actionColor = (a) => {
    if (a === 'create') return 'bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]';
    if (a === 'delete' || a === 'reject') return 'bg-destructive/10 text-destructive border-destructive';
    if (a === 'approve') return 'bg-primary/10 text-primary border-primary';
    return 'bg-secondary text-secondary-foreground';
};

export default function AuditLog() {
    const [items, setItems] = useState([]);
    const [entity, setEntity] = useState('');
    const [action, setAction] = useState('');

    const load = async () => {
        const params = new URLSearchParams();
        if (entity) params.set('entity_type', entity);
        if (action) params.set('action', action);
        const { data } = await api.get(`/audit?${params.toString()}`);
        setItems(data);
    };
    useEffect(() => { load(); }, [entity, action]);

    return (
        <div className="space-y-6" data-testid="audit-page">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Audit log</h1>
                <p className="text-sm text-muted-foreground">System-wide trail of create/update/delete/approve actions.</p>
            </div>
            <Card className="rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={entity} onValueChange={(v) => setEntity(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 rounded-xl" data-testid="audit-entity-filter"><SelectValue placeholder="All entities" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All entities</SelectItem>
                            {ENTITIES.filter(Boolean).map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={action} onValueChange={(v) => setAction(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 rounded-xl" data-testid="audit-action-filter"><SelectValue placeholder="All actions" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All actions</SelectItem>
                            {ACTIONS.filter(Boolean).map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="mt-4 divide-y" data-testid="audit-list">
                    {items.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center" data-testid="audit-empty">No audit entries match these filters.</div>}
                    {items.map((a) => (
                        <div key={a.audit_id} className="py-3 flex items-center gap-3 flex-wrap" data-testid={`audit-row-${a.audit_id}`}>
                            <Badge variant="outline" className={`font-normal capitalize ${actionColor(a.action)}`}>{a.action}</Badge>
                            <Badge variant="outline" className="font-normal capitalize">{a.entity_type}</Badge>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm">
                                    <span className="font-medium">{a.actor_name || 'Unknown'}</span>
                                    <span className="text-muted-foreground"> ({a.actor_role || '—'})</span>
                                    <span className="text-muted-foreground"> — </span>
                                    <span className="text-muted-foreground">{a.entity_label || a.entity_id || '—'}</span>
                                </div>
                                {a.metadata && Object.keys(a.metadata).length > 0 && (
                                    <div className="text-[11px] text-muted-foreground font-mono truncate">{JSON.stringify(a.metadata)}</div>
                                )}
                            </div>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
