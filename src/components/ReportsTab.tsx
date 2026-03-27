import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Department, BASE_AMOUNT } from "../types";
import { formatCurrency } from "../lib/utils";
import { FileSpreadsheet, Clock, BarChart3, Users, DollarSign, Building2, Download, Printer } from "lucide-react";
import { Button } from "./ui/Button";
import * as XLSX from "xlsx";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintReport } from "./PrintReport";
import html2pdf from "html2pdf.js";

interface ReportsTabProps {
  covenant: number;
  stats: {
    totalSpent: number;
    remaining: number;
    totalPersons: number;
    receivedPersons: number;
    pendingPersons: number;
  };
  departments: Department[];
}

export function ReportsTab({ covenant, stats, departments }: ReportsTabProps) {
  const percentage = covenant > 0 ? Math.round((stats.totalSpent / covenant) * 100) : 0;
  const average = stats.receivedPersons > 0 ? Math.round(stats.totalSpent / stats.receivedPersons) : 0;
  const [isDownloading, setIsDownloading] = useState(false);

  let maxAmount = 0;
  let minAmount = Infinity;
  const transactions: any[] = [];

  departments.forEach(d => {
    d.persons.forEach(p => {
      if (p.received) {
        if (p.totalAmount > maxAmount) maxAmount = p.totalAmount;
        if (p.totalAmount < minAmount) minAmount = p.totalAmount;
        transactions.push({
          name: p.name,
          rank: p.rank,
          amount: p.totalAmount,
          date: p.date,
          time: p.time,
        });
      }
    });
  });

  if (minAmount === Infinity) minAmount = 0;

  transactions.sort((a, b) => {
    const dateA = new Date(a.date + " " + a.time).getTime();
    const dateB = new Date(b.date + " " + b.time).getTime();
    return dateB - dateA;
  });

  const recentTransactions = transactions.slice(0, 5);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `التقرير_المالي_العام_${new Date().toLocaleDateString("ar-SA").replace(/\//g, "-")}`,
  });

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const element = printRef.current;
      const date = new Date().toLocaleDateString("ar-SA").replace(/\//g, "-");
      
      // Temporarily make it visible for html2pdf to capture correctly
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.top = '-9999px';
      
      const opt = {
        margin:       10,
        filename:     `التقرير_المالي_العام_${date}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      
      // Restore original styles
      element.style.display = originalDisplay;
      element.style.position = '';
      element.style.top = '';
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const exportDepartmentsToExcel = () => {
    const data = departments.map(dept => {
      const total = dept.persons.length;
      const received = dept.persons.filter(p => p.received).length;
      const remaining = total - received;
      const percent = total > 0 ? Math.round((received / total) * 100) : 0;

      return {
        "القسم": dept.name,
        "إجمالي الأفراد": total,
        "تم الصرف لهم": received,
        "المتبقي": remaining,
        "نسبة الصرف": `${percent}%`
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set RTL direction for the worksheet
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الأقسام");
    
    ws["!cols"] = [
      {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}
    ];

    const date = new Date().toLocaleDateString("ar-SA").replace(/\//g, "-");
    XLSX.writeFile(wb, `تقرير_الأقسام_${date}.xlsx`);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. التقرير المالي العام */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            التقرير المالي العام
          </CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleDownloadPdf} 
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl flex-1 sm:flex-none"
              size="sm"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "جاري التنزيل..." : "تنزيل PDF"}
            </Button>
            <Button 
              onClick={() => handlePrint()} 
              className="bg-slate-900 hover:bg-slate-800 text-white gap-2 rounded-xl flex-1 sm:flex-none"
              size="sm"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <ReportRow label="إجمالي العهد" value={`${covenant.toLocaleString()} ر.ي`} />
          <ReportRow label="إجمالي المصروفات" value={`${stats.totalSpent.toLocaleString()} ر.ي`} />
          <ReportRow label="المبلغ المتبقي" value={`${stats.remaining.toLocaleString()} ر.ي`} />
          <ReportRow
            label="نسبة الصرف"
            value={`${percentage}%`}
            isHighlight
          />
        </CardContent>
      </Card>

      {/* 2. تقرير حالة الصرف للأفراد */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-purple-600" />
            تقرير حالة الصرف للأفراد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ReportRow label="إجمالي عدد الأفراد" value={stats.totalPersons.toString()} />
          <ReportRow label="تم الصرف لهم" value={stats.receivedPersons.toString()} />
          <ReportRow label="عدد المتبقين" value={stats.pendingPersons.toString()} />
        </CardContent>
      </Card>

      {/* 3. تقرير تحليل المبالغ */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            تقرير تحليل المبالغ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ReportRow label="أعلى مبلغ مصروف" value={`${maxAmount.toLocaleString()} ر.ي`} />
          <ReportRow label="أقل مبلغ مصروف" value={`${minAmount.toLocaleString()} ر.ي`} />
          <ReportRow label="متوسط الصرف" value={`${average.toLocaleString()} ر.ي`} />
        </CardContent>
      </Card>

      {/* 4. تقرير الصرف حسب الأقسام */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-indigo-600" />
            تقرير الصرف حسب الأقسام
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportDepartmentsToExcel} className="h-8 gap-1 rounded-lg text-xs font-bold">
            <Download className="w-3.5 h-3.5" />
            تصدير
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {departments.map(dept => {
            const total = dept.persons.length;
            const received = dept.persons.filter(p => p.received).length;
            const percent = total > 0 ? Math.round((received / total) * 100) : 0;
            
            return (
              <div key={dept.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800">{dept.name}</span>
                  <span className="font-black text-indigo-600">{percent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span className="bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">الإجمالي: {total}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 shadow-sm">استلم: {received}</span>
                  <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100 shadow-sm">متبقي: {total - received}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 5. تقرير آخر العمليات */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-amber-600" />
            تقرير آخر العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-semibold">
              لا توجد عمليات
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center ml-3 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 mb-0.5">
                      {t.rank} {t.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      {t.date} • {t.time}
                    </div>
                  </div>
                  <div className="font-black text-emerald-600 text-lg">
                    {t.amount.toLocaleString()} ر.ي
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintReport 
          ref={printRef} 
          covenant={covenant} 
          stats={stats} 
          departments={departments} 
        />
      </div>
    </div>
  );
}

function ReportRow({ label, value, isHighlight = false }: { label: string; value: string; isHighlight?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl ${
        isHighlight ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800"
      }`}
    >
      <span className="font-bold text-sm">{label}</span>
      <span className={`font-black ${isHighlight ? "text-xl" : "text-lg"}`}>{value}</span>
    </div>
  );
}
