import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REPORT_TYPES } from '@/lib/utils-crm';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const baseForm = {
    type: 'farm_visit',
    title: '',
    summary: '',
    dealer_id: '',
    farmer_name: '',
    crop: '',
    acreage: '',
    location: '',
    area: '',
    amount: '',
    next_action: '',
    due_at: '',
    territory_id: '',
    geo: null,
    notes: '',
    items: [],
    attachments: [],
};

export default function NewReport() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [params] = useSearchParams();
    const [form, setForm] = useState(() => ({
        ...baseForm,
        type: params.get('type') || baseForm.type,
        dealer_id: params.get('dealer_id') || '',
    }));
    const [dealers, setDealers] = useState([]);
    const [products, setProducts] = useState([]);
    const [territories, setTerritories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [capturingGeo, setCapturingGeo] = useState(false);

    useEffect(() => {
        api.get('/dealers').then(({ data }) => setDealers(data)).catch(() => {});
        api.get('/products').then(({ data }) => setProducts(data)).catch(() => {});
        api.get('/territories').then(({ data }) => setTerritories(data)).catch(() => {});
    }, []);

    const isDealer = user?.role === 'dealer';
    const availableTypes = useMemo(() => {
        if (isDealer) return REPORT_TYPES.filter((t) => ['product_enquiry', 'sales_enquiry', 'sales_requirement'].includes(t.value));
        return REPORT_TYPES;
    }, [isDealer]);

    const captureGeo = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not available in this browser'); return; }
        setCapturingGeo(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((f) => ({
                    ...f,
                    geo: {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy_m: pos.coords.accuracy,
                        captured_at: new Date().toISOString(),
                    },
                }));
                setCapturingGeo(false);
                toast.success('Location captured');
            },
            (err) => { setCapturingGeo(false); toast.error(err.message || 'Could not get location'); },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };
    const clearGeo = () => setForm((f) => ({ ...f, geo: null }));

    const save = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                acreage: form.acreage ? Number(form.acreage) : null,
                amount: form.amount ? Number(form.amount) : null,
                items: (form.items || []).filter((i) => i.product_id),
                dealer_id: form.dealer_id || null,
                territory_id: form.territory_id || null,
                due_at: form.due_at || null,
                geo: form.geo || null,
            };
            await api.post('/reports', payload);
            toast.success('Report submitted');
            navigate('/reports');
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to submit'); }
        finally { setSubmitting(false); }
    };

    const addItem = () => setForm((f) => ({ ...f, items: [...(f.items || []), { product_id: '', quantity: 1, unit: '' }] }));
    const updateItem = (idx, patch) => setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
    const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

    const showFarmFields = ['farm_visit', 'field_report'].includes(form.type);
    const showDealer = ['dealer_visit', 'sales_requirement', 'sales_enquiry', 'product_enquiry'].includes(form.type);
    const showItems = ['sales_requirement', 'product_enquiry'].includes(form.type);
    const showGeo = ['farm_visit', 'field_report', 'dealer_visit', 'area_status'].includes(form.type);
    const showDue = ['sales_requirement', 'sales_enquiry', 'product_enquiry'].includes(form.type);

    return (
        <form className="space-y-6 max-w-3xl" onSubmit={save} data-testid="new-report-form">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">New report</h1>
                <p className="text-sm text-muted-foreground">Fill the details. Add photos, documents, a due date (SLA), and optional geo-location.</p>
            </div>

            <Card className="rounded-2xl p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Report type" required>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                            <SelectTrigger data-testid="report-type-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {availableTypes.map((rt) => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="report-title-input" /></Field>
                </div>
                <Field label="Summary"><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} data-testid="report-summary-input" /></Field>

                {showDealer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Dealer">
                            <Select value={form.dealer_id} onValueChange={(v) => setForm({ ...form, dealer_id: v })}>
                                <SelectTrigger data-testid="report-dealer-select"><SelectValue placeholder="Select dealer" /></SelectTrigger>
                                <SelectContent>
                                    {dealers.map((d) => <SelectItem key={d.dealer_id} value={d.dealer_id}>{d.firm_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Amount (INR, optional)"><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="report-amount-input" /></Field>
                    </div>
                )}

                {showFarmFields && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Field label="Farmer name"><Input value={form.farmer_name} onChange={(e) => setForm({ ...form, farmer_name: e.target.value })} data-testid="report-farmer-input" /></Field>
                        <Field label="Crop"><Input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} data-testid="report-crop-input" /></Field>
                        <Field label="Acreage"><Input type="number" step="0.1" value={form.acreage} onChange={(e) => setForm({ ...form, acreage: e.target.value })} data-testid="report-acreage-input" /></Field>
                        <Field label="Location (text)"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="report-location-input" /></Field>
                    </div>
                )}

                {form.type === 'area_status' && (
                    <Field label="Area"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} data-testid="report-area-input" /></Field>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Territory (optional)">
                        <Select value={form.territory_id} onValueChange={(v) => setForm({ ...form, territory_id: v })}>
                            <SelectTrigger data-testid="report-territory-select"><SelectValue placeholder="Select territory" /></SelectTrigger>
                            <SelectContent>
                                {territories.map((t) => <SelectItem key={t.territory_id} value={t.territory_id}>{t.name} {t.code ? `· ${t.code}` : ''}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    {showDue && (
                        <Field label="Due by (SLA)">
                            <Input type="datetime-local" value={form.due_at ? form.due_at.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, due_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} data-testid="report-due-input" />
                        </Field>
                    )}
                </div>

                {showGeo && (
                    <div className="rounded-xl border bg-secondary/40 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4" /> Geo-tag this visit</div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={captureGeo} disabled={capturingGeo} data-testid="report-geo-capture">
                                    {capturingGeo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
                                    {capturingGeo ? 'Capturing…' : form.geo ? 'Recapture' : 'Capture location'}
                                </Button>
                                {form.geo && <Button type="button" variant="ghost" size="sm" onClick={clearGeo} data-testid="report-geo-clear">Clear</Button>}
                            </div>
                        </div>
                        {form.geo ? (
                            <div className="text-xs text-muted-foreground font-mono">
                                {Number(form.geo.lat).toFixed(5)}, {Number(form.geo.lng).toFixed(5)}
                                {form.geo.accuracy_m ? ` ± ${Math.round(form.geo.accuracy_m)}m` : ''}
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">Tip: in the field, tap Capture to tag the visit with your current location.</div>
                        )}
                    </div>
                )}

                {showItems && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Product requirements</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addItem} data-testid="report-add-item-button"><Plus className="h-4 w-4 mr-1" /> Add item</Button>
                        </div>
                        <div className="space-y-2">
                            {(form.items || []).map((it, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6">
                                        <Select value={it.product_id} onValueChange={(v) => updateItem(idx, { product_id: v })}>
                                            <SelectTrigger data-testid={`report-item-product-${idx}`}><SelectValue placeholder="Product" /></SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => <SelectItem key={p.product_id} value={p.product_id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3"><Input type="number" step="0.01" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} placeholder="Qty" data-testid={`report-item-qty-${idx}`} /></div>
                                    <div className="col-span-2"><Input value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} placeholder="Unit" data-testid={`report-item-unit-${idx}`} /></div>
                                    <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} data-testid={`report-item-remove-${idx}`}><Trash2 className="h-4 w-4" /></Button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Field label="Next action"><Input value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} placeholder="e.g. Follow up on quotation, send samples" data-testid="report-next-action-input" /></Field>
                <Field label="Internal notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="report-notes-input" /></Field>

                <div>
                    <Label className="text-xs mb-2 inline-block">Attachments (photos, documents)</Label>
                    <AttachmentGrid editable attachments={form.attachments} onChange={(a) => setForm({ ...form, attachments: a })} testIdPrefix="report-attachment" />
                </div>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={submitting} data-testid="report-submit-button">{submitting ? 'Submitting…' : 'Submit report'}</Button>
            </div>
        </form>
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
