import React from 'react';
import { Card } from '@/components/ui/card';
import { formatDate, REPORT_TYPES } from '@/lib/utils-crm';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const typeLabel = (t) => REPORT_TYPES.find((x) => x.value === t)?.label || t;

export function Timeline({ events = [] }) {
    if (!events.length) {
        return <div className="text-sm text-muted-foreground" data-testid="timeline-empty">No activity yet.</div>;
    }
    return (
        <div className="relative pl-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-border" data-testid="dealer-timeline">
            <div className="space-y-4">
                {events.map((ev, idx) => (
                    <div key={ev.report_id || ev.id || idx} className="relative">
                        <span className="absolute left-[-18px] top-3 h-3 w-3 rounded-full bg-primary" />
                        <Card className="rounded-2xl border p-4" data-testid={`dealer-timeline-event-${ev.report_id || idx}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-normal">{typeLabel(ev.type)}</Badge>
                                    <span className="text-sm font-medium">{ev.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(ev.created_at)}</span>
                            </div>
                            {ev.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{ev.summary}</p>}
                            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                                {ev.author_name && <span>By {ev.author_name}</span>}
                                {ev.amount != null && <span>₹{Number(ev.amount).toLocaleString('en-IN')}</span>}
                                {ev.report_id && <Link to={`/reports/${ev.report_id}`} className="text-primary hover:underline">View→</Link>}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Timeline;
