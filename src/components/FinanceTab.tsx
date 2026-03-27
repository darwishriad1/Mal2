import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { formatCurrency } from "../lib/utils";
import { Briefcase, TrendingDown, CheckCircle, Users, ArrowUpRight, ArrowDownRight, Activity, Clock, Receipt, Wallet } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Department } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface FinanceTabProps {
  covenant: number;
  stats: {
    totalSpent: number;
    remaining: number;
    pendingPersons: number;
    totalPersons: number;
    receivedPersons: number;
  };
  onUpdateCovenant: (amount: number) => void;
  departments: Department[];
}

export function FinanceTab({ covenant, stats, onUpdateCovenant, departments }: FinanceTabProps) {
  const [amountInput, setAmountInput] = useState("");

  const handleDeposit = () => {
    const amount = parseInt(amountInput);
    if (!isNaN(amount) && amount > 0) {
      onUpdateCovenant(covenant + amount);
      setAmountInput("");
    }
  };

  const handleWithdraw = () => {
    const amount = parseInt(amountInput);
    if (!isNaN(amount) && amount > 0) {
      if (amount > covenant) {
        alert("المبلغ المطلوب سحبه أكبر من العهدة الحالية!");
        return;
      }
      onUpdateCovenant(covenant - amount);
      setAmountInput("");
    }
  };

  const chartData = {
    labels: ["المصروف", "المتبقي"],
    datasets: [
      {
        data: [stats.totalSpent, Math.max(0, stats.remaining)],
        backgroundColor: ["#10b981", "#e2e8f0"],
        borderWidth: 0,
      },
    ],
  };

  // Get recent transactions (just taking the last few who received)
  const recentTransactions = departments
    .flatMap(d => d.persons.filter(p => p.received).map(p => ({ ...p, deptName: d.name })))
    .reverse()
    .slice(0, 5);

  const spentPercentage = covenant > 0 ? ((stats.totalSpent / covenant) * 100).toFixed(1) : "0";
  const avgPayment = stats.receivedPersons > 0 ? (stats.totalSpent / stats.receivedPersons).toFixed(0) : "0";

  return (
    <div className="space-y-4 pb-24">
      {/* Main Covenant Card */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-slate-300">إجمالي العهدة الحالية</h2>
                  <p className="text-xs text-slate-400">الرصيد المتاح للصرف</p>
                </div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-black tracking-tight">{covenant.toLocaleString()}</div>
                <div className="text-sm text-blue-400 font-bold">ريال يمني</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="أدخل المبلغ..."
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 text-center font-bold h-12 flex-1"
                />
                <Button
                  onClick={handleDeposit}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-4 flex items-center gap-1"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  إيداع
                </Button>
                <Button
                  onClick={handleWithdraw}
                  className="bg-rose-500 hover:bg-rose-600 text-white h-12 px-4 flex items-center gap-1"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  سحب
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          icon={<TrendingDown className="w-5 h-5 text-emerald-600" />}
          value={(stats.totalSpent / 1000).toFixed(1) + "K"}
          label="إجمالي المصروف"
          bg="bg-emerald-100"
        />
        <StatBox
          icon={<CheckCircle className="w-5 h-5 text-amber-600" />}
          value={(stats.remaining / 1000).toFixed(1) + "K"}
          label="المتبقي من العهدة"
          bg="bg-amber-100"
        />
        <StatBox
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          value={`${spentPercentage}%`}
          label="نسبة الصرف"
          bg="bg-blue-100"
        />
        <StatBox
          icon={<Receipt className="w-5 h-5 text-purple-600" />}
          value={Number(avgPayment).toLocaleString()}
          label="متوسط الصرف للفرد"
          bg="bg-purple-100"
        />
      </div>

      {/* Charts & Analysis */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            تحليل الميزانية
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[220px] relative flex justify-center">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      font: { family: "Cairo", size: 13, weight: "bold" },
                      padding: 20,
                      usePointStyle: true,
                    },
                  },
                },
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-black text-slate-800">{spentPercentage}%</span>
              <span className="text-xs font-bold text-slate-400">تم صرفه</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            أحدث عمليات الصرف
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentTransactions.map((tx, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{tx.name}</p>
                      <p className="text-xs text-slate-500">{tx.deptName} • {tx.time}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-emerald-600">-{tx.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">ر.ي</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              لا توجد عمليات صرف حديثة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, value, label, bg }: { icon: React.ReactNode; value: string; label: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${bg}`}>
        {icon}
      </div>
      <div className="text-lg font-black text-slate-800 mb-0.5">{value}</div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}
