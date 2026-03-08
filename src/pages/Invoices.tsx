import { useEffect, useState } from "react";
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
import { Plus, FileText, Trash2, Download, Share2, IndianRupee, Eye } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { shareOnWhatsApp } from "@/lib/whatsapp";

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
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", gst_percent: "18", date: format(new Date(), "yyyy-MM-dd") });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ name: "", qty: 1, price: 0 }]);

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id, name, address").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    setShopName(biz.name || "");
    setShopAddress(biz.address || "");
    const { data } = await supabase.from("invoices").select("*").eq("business_id", biz.id).order("date", { ascending: false });
    setInvoices(((data || []) as any[]).map(d => ({ ...d, items: (d.items || []) as InvoiceItem[] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0);
  const gstAmt = subtotal * (parseFloat(form.gst_percent) || 0) / 100;
  const total = subtotal + gstAmt;

  const addLine = () => setLineItems(l => [...l, { name: "", qty: 1, price: 0 }]);
  const removeLine = (i: number) => setLineItems(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof InvoiceItem, val: string) => {
    setLineItems(l => l.map((item, idx) => idx === i ? { ...item, [field]: field === "name" ? val : parseFloat(val) || 0 } : item));
  };

  const handleSave = async () => {
    if (!businessId || !form.customer_name.trim() || lineItems.every(l => !l.name.trim())) return;
    const validItems = lineItems.filter(l => l.name.trim());
    const { error } = await supabase.from("invoices").insert({
      business_id: businessId,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      items: validItems as any,
      subtotal,
      gst_percent: parseFloat(form.gst_percent) || 0,
      total,
      date: form.date,
    });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("invoiceCreated") });
    setForm({ customer_name: "", customer_phone: "", gst_percent: "18", date: format(new Date(), "yyyy-MM-dd") });
    setLineItems([{ name: "", qty: 1, price: 0 }]);
    setDialogOpen(false);
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
    const url = inv.customer_phone ? `https://wa.me/91${inv.customer_phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl"><Plus size={18} /> {t("createInvoice")}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t("createInvoice")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("name")}</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder={t("contactNamePlaceholder")} className="rounded-xl" /></div>
                <div><Label>{t("phone")}</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder={t("phonePlaceholder10")} className="rounded-xl" /></div>
                
                <div className="space-y-2">
                  <Label>{t("invoiceItems")}</Label>
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <Input value={item.name} onChange={e => updateLine(i, "name", e.target.value)} placeholder={t("itemName")} className="rounded-xl flex-1" />
                      <Input type="number" value={item.qty || ""} onChange={e => updateLine(i, "qty", e.target.value)} placeholder="Qty" className="rounded-xl w-16" />
                      <Input type="number" value={item.price || ""} onChange={e => updateLine(i, "price", e.target.value)} placeholder="₹" className="rounded-xl w-20" />
                      {lineItems.length > 1 && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLine(i)}><Trash2 size={14} /></Button>}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLine} className="rounded-xl gap-1"><Plus size={14} /> {t("addItem")}</Button>
                </div>

                <div><Label>GST %</Label><Input type="number" value={form.gst_percent} onChange={e => setForm(f => ({ ...f, gst_percent: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>

                <Card className="rounded-xl bg-muted/50"><CardContent className="p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span>GST ({form.gst_percent}%)</span><span>₹{gstAmt.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-1"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
                </CardContent></Card>

                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{t("createInvoice")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : invoices.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noInvoices")}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <Card key={inv.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{inv.customer_name}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(inv.date), "dd MMM yyyy")} · {inv.items.length} {t("invoiceItems").toLowerCase()}</p>
                    </div>
                    <p className="font-bold text-primary text-lg">₹{Number(inv.total).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => setViewInvoice(inv)}><Eye size={14} /> {t("view")}</Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => generatePDF(inv)}><Download size={14} /> PDF</Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 flex-1" onClick={() => shareWhatsApp(inv)}><Share2 size={14} /> WhatsApp</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </AppLayout>
  );
}
