import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-crm';
import { toast } from 'sonner';

const empty = { name: '', sku: '', category: '', unit: '', pack_size: '', mrp: '', description: '' };

export default function Products() {
    const { user } = useAuth();
    const canEdit = ['owner', 'admin'].includes(user?.role);
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(empty);

    const load = async () => { const { data } = await api.get('/products'); setItems(data); };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', { ...form, mrp: form.mrp ? Number(form.mrp) : null });
            toast.success('Product added');
            setOpen(false);
            setForm(empty);
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    const del = async (pid) => {
        if (!window.confirm('Delete product?')) return;
        try { await api.delete(`/products/${pid}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
    };

    return (
        <div className="space-y-6" data-testid="products-page">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Products</h1>
                    <p className="text-sm text-muted-foreground">Rex Botanix fertiliser catalogue.</p>
                </div>
                {canEdit && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="product-create-button"><Plus className="h-4 w-4 mr-2" /> New product</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
                            <form className="space-y-3" onSubmit={save}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="product-name-input" /></Field>
                                    <Field label="SKU" required><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required data-testid="product-sku-input" /></Field>
                                    <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="product-category-input" /></Field>
                                    <Field label="Pack size"><Input value={form.pack_size} onChange={(e) => setForm({ ...form, pack_size: e.target.value })} data-testid="product-packsize-input" /></Field>
                                    <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} data-testid="product-unit-input" /></Field>
                                    <Field label="MRP (INR)"><Input type="number" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} data-testid="product-mrp-input" /></Field>
                                </div>
                                <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="product-description-input" /></Field>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" data-testid="product-save-button">Save</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="rounded-2xl p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.length === 0 && <div className="text-sm text-muted-foreground col-span-full py-10 text-center" data-testid="products-empty">No products yet.</div>}
                    {items.map((p) => (
                        <div key={p.product_id} className="rounded-2xl border bg-card p-4" data-testid={`product-row-${p.product_id}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{p.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                                    {p.category && <Badge variant="outline" className="mt-1 font-normal">{p.category}</Badge>}
                                </div>
                                {canEdit && <Button variant="ghost" size="icon" onClick={() => del(p.product_id)}><Trash2 className="h-4 w-4" /></Button>}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{p.pack_size || ''} {p.unit ? `· ${p.unit}` : ''}</span>
                                <span className="tabular-nums font-medium">{p.mrp ? formatCurrency(p.mrp) : '—'}</span>
                            </div>
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
