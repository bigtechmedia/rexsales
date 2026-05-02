import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, REQUEST_TYPES } from '@/lib/utils-crm';
import { Check, X } from 'lucide-react';

export function ApprovalCard({ request, onAction }) {
    const typeLabel = REQUEST_TYPES.find((t) => t.value === request.type)?.label || request.type;
    const status = request.status;
    const badgeClass = {
        pending: 'bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]',
        approved: 'bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]',
        rejected: 'bg-destructive/10 text-destructive border-destructive',
    }[status];
    return (
        <Card className="rounded-2xl border bg-card p-4 md:p-5" data-testid={`approval-card-${request.request_id}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-normal">{typeLabel}</Badge>
                        <Badge variant="outline" className={`font-normal ${badgeClass || ''}`}>{status}</Badge>
                    </div>
                    <h3 className="mt-2 font-display font-semibold text-base truncate">{request.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description || '—'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>By {request.author_name}</span>
                        {request.amount !== undefined && request.amount !== null && (
                            <span className="tabular-nums">{formatCurrency(request.amount)}</span>
                        )}
                        {request.start_date && <span>{request.start_date}{request.end_date ? ` → ${request.end_date}` : ''}</span>}
                        {request.destination && <span>{request.destination}</span>}
                        <span className="ml-auto">{formatDate(request.created_at)}</span>
                    </div>
                    {request.approver_name && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            {status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver_name}
                            {request.approver_note ? ` — ${request.approver_note}` : ''}
                        </div>
                    )}
                </div>
                {onAction && status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => onAction('approve', request)} data-testid={`approval-approve-button-${request.request_id}`}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onAction('reject', request)} data-testid={`approval-reject-button-${request.request_id}`}>
                            <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default ApprovalCard;
