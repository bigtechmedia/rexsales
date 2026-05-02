import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import { formatCurrency, formatDate, REPORT_TYPES } from '@/lib/utils-crm';

export default function ReportDetail() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/reports/${id}`);
                setReport(data);
            } finally { setLoading(false); }
        })();
    }, [id]);

    if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
    if (!report) return <div className="text-sm text-muted-foreground">Report not found.</div>;

    return (
        <div className="space-y-4 max-w-3xl" data-testid="report-detail">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">{REPORT_TYPES.find(x => x.value === report.type)?.label || report.type}</Badge>
                        <h1 className="font-display text-xl md:text-2xl font-semibold">{report.title}</h1>
                    </div>
                    <div className="text-xs text-muted-foreground">By {report.author_name} · {formatDate(report.created_at)}</div>
                </div>
                <Link to="/reports"><Button variant="outline">Back to list</Button></Link>
            </div>
            <Card className="rounded-2xl p-4 md:p-6 space-y-3">
                {report.summary && <p className="text-sm">{report.summary}</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {report.farmer_name && <Info label="Farmer" value={report.farmer_name} />}
                    {report.crop && <Info label="Crop" value={report.crop} />}
                    {report.acreage != null && <Info label="Acreage" value={report.acreage} />}
                    {report.location && <Info label="Location" value={report.location} />}
                    {report.area && <Info label="Area" value={report.area} />}
                    {report.amount != null && <Info label="Amount" value={formatCurrency(report.amount)} />}
                </div>
                {report.items?.length > 0 && (
                    <div>
                        <div className="text-xs text-muted-foreground">Items</div>
                        <ul className="mt-1 text-sm list-disc ml-5">
                            {report.items.map((it, i) => <li key={i}>{it.quantity} {it.unit || ''} × Product {it.product_id}</li>)}
                        </ul>
                    </div>
                )}
                {report.next_action && <Info label="Next action" value={report.next_action} />}
                {report.notes && <Info label="Notes" value={report.notes} />}
                {report.attachments?.length > 0 && (
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">Attachments</div>
                        <AttachmentGrid attachments={report.attachments} />
                    </div>
                )}
            </Card>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div>{value}</div>
        </div>
    );
}
