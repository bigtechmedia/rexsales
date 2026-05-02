import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/components/Timeline';
import { Store, Phone, Mail, MapPin, Leaf, Plus, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils-crm';

export default function DealerDetail() {
    const { id } = useParams();
    const [dealer, setDealer] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [{ data: d }, { data: ev }] = await Promise.all([
                    api.get(`/dealers/${id}`),
                    api.get(`/reports?dealer_id=${id}`),
                ]);
                setDealer(d);
                setEvents(ev);
            } finally { setLoading(false); }
        })();
    }, [id]);

    if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
    if (!dealer) return <div className="text-sm text-muted-foreground">Dealer not found.</div>;

    return (
        <div className="space-y-6" data-testid="dealer-detail">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h1 className="font-display text-2xl md:text-3xl font-semibold">{dealer.firm_name}</h1></div>
                    <div className="text-sm text-muted-foreground">{dealer.contact_name} · <span className="capitalize">{dealer.status}</span></div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to={`/reports/new?dealer_id=${dealer.dealer_id}&type=dealer_visit`}><Button><Plus className="h-4 w-4 mr-2" /> New visit</Button></Link>
                    <Link to={`/messages?dealer_id=${dealer.dealer_id}`}><Button variant="outline"><MessageSquare className="h-4 w-4 mr-2" /> Message</Button></Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 rounded-2xl p-4 md:p-6">
                    <Tabs defaultValue="timeline">
                        <TabsList>
                            <TabsTrigger value="timeline" data-testid="dealer-tab-timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="details" data-testid="dealer-tab-details">Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline" className="mt-4">
                            <Timeline events={events} />
                        </TabsContent>
                        <TabsContent value="details" className="mt-4 space-y-2 text-sm">
                            <Row icon={Phone} label="Phone" value={dealer.phone} />
                            <Row icon={Mail} label="Email" value={dealer.email || '—'} />
                            <Row icon={MapPin} label="Address" value={[dealer.address, dealer.city, dealer.state, dealer.pincode].filter(Boolean).join(', ') || '—'} />
                            <Row icon={Leaf} label="Crops" value={(dealer.crop_types || []).join(', ') || '—'} />
                            <div className="pt-2 text-xs text-muted-foreground">Onboarded {formatDate(dealer.created_at)}</div>
                        </TabsContent>
                    </Tabs>
                </Card>
                <Card className="rounded-2xl p-4 md:p-6 h-max">
                    <h3 className="font-display text-lg font-semibold">Context</h3>
                    <div className="mt-2 space-y-1.5 text-sm">
                        <div className="text-muted-foreground">GSTIN</div><div className="font-mono text-xs">{dealer.gstin || '—'}</div>
                    </div>
                    <div className="mt-3">
                        <div className="text-muted-foreground text-sm">Recent reports</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {events.slice(0, 6).map((e, i) => <Badge key={e.report_id || i} variant="outline" className="font-normal">{e.type}</Badge>)}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Row({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="truncate">{value}</div>
            </div>
        </div>
    );
}
