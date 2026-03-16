import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Download, Share2, Eye, Pencil, Search, Package } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { shareOnWhatsApp } from "@/lib/whatsapp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InvoiceItem { name: string; qty: number; price: number; }
interface Invoice {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  items: InvoiceItem[];
  subtotal: number;
  gst_percent: number;
  total: number;
  date: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  selling_price: number;
  quantity: number;
  unit: string | null;
}

export default function Invoices() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", gst_percent: "18", date: format(new Date(), "yyyy-MM-dd") });
  const [gstEnabled, setGstEnabled] = useState(true);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ name: "", qty: 1, price: 0 }]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [itemSearchIdx, setItemSearchIdx] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id, name, address").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    setShopName(biz.name || "");
    setShopAddress(biz.address || "");
    const [{ data: invData }, { data: invItems }] = await Promise.all([
      supabase.from("invoices").select("*").eq("business_id", biz.id).order("date", { ascending: false }),
      supabase.from("inventory_items").select("id, item_name, selling_price, quantity, unit").eq("business_id", biz.id).order("item_name"),
    ]);
    setInvoices(((invData || []) as any[]).map(d => ({ ...d, items: (d.items || []) as InvoiceItem[] })));
    setInventoryItems(invItems || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0);
  const gstAmt = gstEnabled ? subtotal * (parseFloat(form.gst_percent) || 0) / 100 : 0;
  const total = subtotal + gstAmt;

  const addLine = () => setLineItems(l => [...l, { name: "", qty: 1, price: 0 }]);
  const removeLine = (i: number) => setLineItems(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof InvoiceItem, val: string) => {
    setLineItems(l => l.map((item, idx) => idx === i ? { ...item, [field]: field === "name" ? val : parseFloat(val) || 0 } : item));
  };

  const selectInventoryItem = (lineIdx: number, invItem: InventoryItem) => {
    setLineItems(l => l.map((item, idx) => idx === lineIdx ? { ...item, name: invItem.item_name, price: Number(invItem.selling_price) } : item));
    setItemSearchIdx(null);
    setItemSearchQuery("");
  };

  const filteredInventory = useMemo(() => {
    if (!itemSearchQuery.trim()) return inventoryItems;
    const q = itemSearchQuery.toLowerCase();
    return inventoryItems.filter(i => i.item_name.toLowerCase().includes(q));
  }, [inventoryItems, itemSearchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return invoices;
    const q = invoiceSearch.toLowerCase();
    return invoices.filter(inv =>
      inv.customer_name.toLowerCase().includes(q) ||
      inv.items.some(i => i.name.toLowerCase().includes(q))
    );
  }, [invoices, invoiceSearch]);

  const resetForm = () => {
    setForm({ customer_name: "", customer_phone: "", gst_percent: "18", date: format(new Date(), "yyyy-MM-dd") });
    setLineItems([{ name: "", qty: 1, price: 0 }]);
    setEditingId(null);
    setGstEnabled(true);
  };

  const openEdit = (inv: Invoice) => {
    setForm({
      customer_name: inv.customer_name,
      customer_phone: inv.customer_phone || "",
      gst_percent: String(inv.gst_percent),
      date: inv.date,
    });
    setLineItems(inv.items.length > 0 ? [...inv.items] : [{ name: "", qty: 1, price: 0 }]);
    setEditingId(inv.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!businessId || !form.customer_name.trim() || lineItems.every(l => !l.name.trim())) return;
    const validItems = lineItems.filter(l => l.name.trim());
    const payload = {
      business_id: businessId,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      items: validItems as any,
      subtotal,
      gst_percent: parseFloat(form.gst_percent) || 0,
      total,
      date: form.date,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("invoices").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("invoices").insert(payload));
    }
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Invoice updated!" : t("invoiceCreated") });
    resetForm();
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice deleted" });
    load();
  };

  const generatePDF = (inv: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(shopName || "Invoice", 14, 20);
    if (shopAddress) { doc.setFontSize(10); doc.text(shopAddress, 14, 28); }
    doc.setFontSize(12);
    doc.text(`${t("invoiceTo")}: ${inv.customer_name}`, 14, 40);
    doc.text(`${t("date")}: ${format(new Date(inv.date), "dd MMM yyyy")}`, 14, 48);
    let y = 60;
    doc.setFontSize(10);
    doc.text("Item", 14, y); doc.text("Qty", 100, y); doc.text("Price", 130, y); doc.text("Total", 165, y);
    y += 8;
    inv.items.forEach(item => {
      doc.text(item.name, 14, y);
      doc.text(String(item.qty), 100, y);
      doc.text(`₹${item.price}`, 130, y);
      doc.text(`₹${item.qty * item.price}`, 165, y);
      y += 7;
    });
    y += 5;
    doc.text(`Subtotal: ₹${Number(inv.subtotal).toLocaleString("en-IN")}`, 130, y);
    y += 7;
    doc.text(`GST (${inv.gst_percent}%): ₹${(Number(inv.subtotal) * Number(inv.gst_percent) / 100).toLocaleString("en-IN")}`, 130, y);
    y += 7;
    doc.setFontSize(12);
    doc.text(`Total: ₹${Number(inv.total).toLocaleString("en-IN")}`, 130, y);
    doc.save(`invoice-${inv.customer_name}-${inv.date}.pdf`);
    toast({ title: t("pdfDownloaded") });
  };

  const shareWhatsApp = (inv: Invoice) => {
    const text = `*${t("invoiceFrom")} ${shopName}*\n${t("invoiceTo")}: ${inv.customer_name}\n${t("date")}: ${format(new Date(inv.date), "dd MMM yyyy")}\n\n${inv.items.map(i => `${i.name} x${i.qty} = ₹${i.qty * i.price}`).join("\n")}\n\nSubtotal: ₹${Number(inv.subtotal).toLocaleString("en-IN")}\nGST (${inv.gst_percent}%): ₹${(Number(inv.subtotal) * Number(inv.gst_percent) / 100).toLocaleString("en-IN")}\n*Total: ₹${Number(inv.total).toLocaleString("en-IN")}*`;
    shareOnWhatsApp(text, inv.customer_phone ? `91${inv.customer_phone}` : undefined);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground flex items-center gap-2">
              <FileText className="text-primary" size={28} /> {t("invoices")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("invoicesSubtext")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl"><Plus size={18} /> {t("createInvoice")}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Edit Invoice" : t("createInvoice")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("name")}</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder={t("contactNamePlaceholder")} className="rounded-xl" /></div>
                <div><Label>{t("phone")}</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder={t("phonePlaceholder10")} className="rounded-xl" /></div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">{t("invoiceItems")} {inventoryItems.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Inventory available</span>}</Label>
                  {lineItems.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 relative">
                          <Input
                            value={item.name}
                            onChange={e => { updateLine(i, "name", e.target.value); setItemSearchIdx(i); setItemSearchQuery(e.target.value); }}
                            onFocus={() => { setItemSearchIdx(i); setItemSearchQuery(item.name); }}
                            placeholder={t("itemName")}
                            className="rounded-xl"
                          />
                          {itemSearchIdx === i && inventoryItems.length > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                              <div className="p-2 border-b border-border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Package size={12} /> Inventory Items
                                </div>
                              </div>
                              {filteredInventory.length === 0 ? (
                                <p className="p-2 text-xs text-muted-foreground">No items found</p>
                              ) : (
                                filteredInventory.map(invItem => (
                                  <button
                                    key={invItem.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                    onClick={() => selectInventoryItem(i, invItem)}
                                  >
                                    <span className="font-medium text-foreground">{invItem.item_name}</span>
                                    <span className="text-xs text-muted-foreground">₹{Number(invItem.selling_price)} · {Number(invItem.quantity)} {invItem.unit || "pcs"}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <Input type="number" value={item.qty || ""} onChange={e => updateLine(i, "qty", e.target.value)} placeholder="Qty" className="rounded-xl w-16" />
                        <Input type="number" value={item.price || ""} onChange={e => updateLine(i, "price", e.target.value)} placeholder="₹" className="rounded-xl w-20" />
                        {lineItems.length > 1 && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLine(i)}><Trash2 size={14} /></Button>}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLine} className="rounded-xl gap-1"><Plus size={14} /> {t("addItem")}</Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>GST</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{gstEnabled ? "ON" : "OFF"}</span>
                      <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
                    </div>
                  </div>
                  {gstEnabled && (
                    <Input type="number" value={form.gst_percent} onChange={e => setForm(f => ({ ...f, gst_percent: e.target.value }))} placeholder="18" className="rounded-xl" />
                  )}
                </div>
                <div><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>

                <Card className="rounded-xl bg-muted/50"><CardContent className="p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span>GST ({form.gst_percent}%)</span><span>₹{gstAmt.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-1"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
                </CardContent></Card>

                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{editingId ? "Update Invoice" : t("createInvoice")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search invoices */}
        {invoices.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={invoiceSearch}
              onChange={e => setInvoiceSearch(e.target.value)}
              placeholder="Search invoices by customer or item..."
              className="pl-9 rounded-xl"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : invoices.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noInvoices")}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((inv, index) => {
              const invoiceNum = `INV-${String(invoices.length - invoices.indexOf(inv)).padStart(3, "0")}`;
              return (
              <Card key={inv.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{invoiceNum}</span>
                        <h3 className="font-bold text-foreground">{inv.customer_name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(inv.date), "dd MMM yyyy")} · {inv.items.length} {t("invoiceItems").toLowerCase()}</p>
                    </div>
                    <p className="font-bold text-primary text-lg">₹{Number(inv.total).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => setViewInvoice(inv)}><Eye size={14} /> {t("view")}</Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => openEdit(inv)}><Pencil size={14} /> Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => generatePDF(inv)}><Download size={14} /> PDF</Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => shareWhatsApp(inv)}><Share2 size={14} /> WhatsApp</Button>
                    <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(inv.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewInvoice && (
            <>
              <DialogHeader><DialogTitle>{t("invoiceFrom")} {shopName}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm"><strong>{t("invoiceTo")}:</strong> {viewInvoice.customer_name}</p>
                <p className="text-sm"><strong>{t("date")}:</strong> {format(new Date(viewInvoice.date), "dd MMM yyyy")}</p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted"><tr><th className="p-2 text-left">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Total</th></tr></thead>
                    <tbody>
                      {viewInvoice.items.map((item, i) => (
                        <tr key={i} className="border-t border-border"><td className="p-2">{item.name}</td><td className="p-2 text-right">{item.qty}</td><td className="p-2 text-right">₹{item.price}</td><td className="p-2 text-right">₹{item.qty * item.price}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-sm space-y-1 text-right">
                  <p>Subtotal: ₹{Number(viewInvoice.subtotal).toLocaleString("en-IN")}</p>
                  <p>GST ({viewInvoice.gst_percent}%): ₹{(Number(viewInvoice.subtotal) * Number(viewInvoice.gst_percent) / 100).toLocaleString("en-IN")}</p>
                  <p className="font-bold text-lg">Total: ₹{Number(viewInvoice.total).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 rounded-xl gap-1" onClick={() => generatePDF(viewInvoice)}><Download size={14} /> PDF</Button>
                  <Button variant="outline" className="flex-1 rounded-xl gap-1" onClick={() => shareWhatsApp(viewInvoice)}><Share2 size={14} /> WhatsApp</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Close inventory dropdown on outside click */}
      {itemSearchIdx !== null && (
        <div className="fixed inset-0 z-40" onClick={() => { setItemSearchIdx(null); setItemSearchQuery(""); }} />
      )}
    </AppLayout>
  );
}
