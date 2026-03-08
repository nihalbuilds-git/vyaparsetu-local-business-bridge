import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  khataBalance: number;
  lowStockCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  lang: string;
}

export default function BusinessInsights({ khataBalance, lowStockCount, monthlyIncome, monthlyExpense, lang }: Props) {
  const profit = monthlyIncome - monthlyExpense;
  const isHindi = lang === "hi";

  const insights = [
    {
      to: "/khata",
      label: isHindi ? "खाता बैलेंस" : "Khata Balance",
      value: `₹${Math.abs(khataBalance).toLocaleString("en-IN")}`,
      sub: khataBalance >= 0
        ? (isHindi ? "वसूलना बाकी" : "Receivable")
        : (isHindi ? "देना बाकी" : "Payable"),
      icon: CreditCard,
      color: khataBalance >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: khataBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      to: "/inventory",
      label: isHindi ? "कम स्टॉक" : "Low Stock",
      value: String(lowStockCount),
      sub: lowStockCount > 0
        ? (isHindi ? "⚠️ ध्यान दें" : "⚠️ Needs attention")
        : (isHindi ? "✅ सब ठीक" : "✅ All good"),
      icon: lowStockCount > 0 ? AlertTriangle : Package,
      color: lowStockCount > 0 ? "text-amber-600" : "text-emerald-600",
      bgColor: lowStockCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
    },
    {
      to: "/expenses",
      label: isHindi ? "मासिक P&L" : "Monthly P&L",
      value: `${profit >= 0 ? "+" : "-"}₹${Math.abs(profit).toLocaleString("en-IN")}`,
      sub: profit >= 0
        ? (isHindi ? "मुनाफा 🎉" : "Profit 🎉")
        : (isHindi ? "नुकसान" : "Loss"),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      color: profit >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: profit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold font-display text-foreground mb-4">
        {isHindi ? "व्यापार की स्थिति" : "Business Health"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {insights.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="group rounded-2xl border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`shrink-0 rounded-xl ${item.bgColor} p-2.5`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  <p className={`text-lg font-extrabold font-display ${item.color}`}>{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
