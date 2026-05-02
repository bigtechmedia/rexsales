import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KpiCard({ label, value, delta, tone = 'default', icon: Icon, suffix, testId }) {
    const toneDot = {
        good: 'bg-[hsl(var(--chart-4))]',
        warn: 'bg-[hsl(var(--chart-3))]',
        bad: 'bg-destructive',
        default: 'bg-primary',
    }[tone] || 'bg-primary';
    return (
        <Card
            data-testid={testId}
            className="rounded-2xl border bg-card p-5 md:p-6 shadow-[0_1px_0_hsl(var(--border))] hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', toneDot)} aria-hidden />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="mt-2 font-display text-2xl md:text-3xl font-semibold tabular-nums text-foreground leading-none">
                        {value}
                        {suffix ? <span className="text-sm ml-1 text-muted-foreground font-normal">{suffix}</span> : null}
                    </div>
                    {delta !== undefined && delta !== null && (
                        <div className={cn('mt-2 inline-flex items-center gap-1 text-xs', delta >= 0 ? 'text-[hsl(var(--chart-4))]' : 'text-destructive')}>
                            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
                            <span className="text-muted-foreground">vs prev.</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="shrink-0 rounded-xl bg-secondary p-2 text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </Card>
    );
}

export default KpiCard;
