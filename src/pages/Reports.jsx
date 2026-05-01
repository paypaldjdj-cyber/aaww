import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { getFinancialStats, getStats } from "../api";

const SummaryCard = ({ label, val, color }) => {
  const { t } = useLanguage();
  return (
    <div className="glass-panel" style={{ padding: 16, textAlign: "center", borderTop: `4px solid ${color}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{val?.toLocaleString()} {t("د")}</div>
    </div>
  );
};

const ReportRow = ({ label, val, unit, color, bold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
    <span style={{ fontSize: bold ? 20 : 16, fontWeight: 700, color: color || "white" }}>{val?.toLocaleString()} {unit}</span>
  </div>
);

export default function Reports() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSecretary = user?.role === "secretary";
  const [fin, setFin] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    getFinancialStats().then(setFin).catch(console.error);
    getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t("التقارير والإحصائيات")}</h2>
      </div>

      <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <SummaryCard label={t("إيرادات اليوم")} val={fin.collected_today} color="#10b981" />
        <SummaryCard label={t("صرفيات اليوم")} val={fin.expenses_today} color="#ef4444" />
        {!isSecretary && (
          <>
            <SummaryCard label={t("إيرادات الشهر")} val={fin.collected_month} color="#185FA5" />
            <SummaryCard label={t("إجمالي الكاش (Cash)")} val={fin.cash_revenue} color="#f59e0b" />
            <SummaryCard label={t("إجمالي البنك (Bank)")} val={fin.bank_revenue} color="#00D2FF" />
          </>
        )}
      </div>

      <style>{`
        .mobile-mode .summary-grid {
          grid-template-columns: 1fr 1fr !important;
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: isSecretary ? "1fr" : "1.5fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Main Financial Report */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>🏦 {isSecretary ? t("التقرير المالي لليوم") : t("التقرير المالي العام")}</h3>
            {!isSecretary && (
              <div style={{ fontSize: 12, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 12px", borderRadius: 20 }}>
                Collection Rate: {fin.collection_rate}%
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
             <ReportRow label={t("إيرادات اليوم")} val={fin.collected_today} unit={t("د")} />
             <ReportRow label={t("صرفيات اليوم")} val={fin.expenses_today} unit={t("د")} />
             {!isSecretary && (
               <>
                 <ReportRow label={t("إجمالي المقبوضات (All Time)")} val={fin.revenue} unit={t("د")} />
                 <ReportRow label={t("إجمالي المصاريف (All Time)")} val={fin.expenses} unit={t("د")} />
               </>
             )}
             <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
             <ReportRow label={isSecretary ? t("صافي ربح اليوم") : t("صافي الربح")} val={isSecretary ? (fin.collected_today - fin.expenses_today) : fin.net_profit} unit={t("د")} color="#10b981" bold />
          </div>
        </div>

        {/* Debts Summary */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>⚠️ {t("مديونية المرضى")}</h3>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
             <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t("إجمالي الديون المتبقية عند المرضى")}</div>
             <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444" }}>{fin.total_debt?.toLocaleString()} {t("د")}</div>
             <button className="btn-ghost" style={{ marginTop: 20, width: "100%" }} onClick={() => window.location.href = "/debts"}>{t("عرض تفاصيل المدينين")}</button>
          </div>
        </div>
      </div>

      {!isSecretary && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📈 {t("النمو الشهري")}</h3>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 12, padding: "0 20px" }}>
            {[40, 65, 45, 90, 55, 80, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(to top, var(--primary), var(--accent))", borderRadius: "8px 8px 0 0", opacity: 0.8 }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Month {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


