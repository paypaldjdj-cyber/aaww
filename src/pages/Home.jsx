import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getAppointments, getFinancialStats } from "../api";
import { useLanguage } from "../LanguageContext";
import { useSettings } from "../SettingsContext";
import { useAuth } from "../AuthContext";

const StatCard = ({ val, lbl, sub, color, icon }) => (
  <div className="glass-panel animate-fade" style={{ padding: 20, flex: 1, minWidth: 200 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ 
        width: 42, height: 42, borderRadius: 12, background: `${color}20`, 
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 
      }}>{icon}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--success)", background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: 20, height: "fit-content" }}>{sub}</div>}
    </div>
    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{lbl}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "white" }}>{val}</div>
  </div>
);

export default function Home() {
  const [stats, setStats]  = useState({});
  const [fin,   setFin]    = useState({});
  const [apts,  setApts]   = useState([]);
  const nav = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();

  useEffect(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    getStats().then(setStats).catch(console.error);
    getAppointments(today).then(setApts).catch(console.error);
    getFinancialStats().then(setFin).catch(console.error);
  }, []);

  const { user } = useAuth();
  const isSecretary = user?.role === "secretary";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Grid */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon="📅" color="#185FA5" lbl={t("مواعيد اليوم")} val={stats.total_today || "0"} sub={isSecretary ? "" : "+12%"} />
        <StatCard icon="💰" color="#10b981" lbl={isSecretary ? t("إيرادات اليوم") : t("إجمالي الإيرادات")} val={`${(isSecretary ? fin.collected_today : fin.revenue) || "0"} ${t("د")}`} sub={isSecretary ? "" : "+5.4%"} />
        <StatCard icon="💸" color="#ef4444" lbl={isSecretary ? t("صرفيات اليوم") : t("المصاريف")} val={`${(isSecretary ? fin.expenses_today : fin.expenses) || "0"} ${t("د")}`} />
        {!isSecretary && <StatCard icon="💎" color="#00D2FF" lbl={t("صافي الربح")} val={`${fin.net_profit || "0"} ${t("د")}`} sub="Stable" />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Recent Appointments */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{t("جدول المواعيد الحالية")}</h3>
            <button onClick={() => nav("/appointments")} className="btn-ghost" style={{ fontSize: 12 }}>{t("عرض الكل")}</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {apts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
                {t("لا توجد مواعيد متبقية لليوم")}
              </div>
            ) : apts.map(a => (
              <div key={a.id} className="appointment-row" style={{ 
                display: "flex", alignItems: "center", gap: 16, padding: 12, 
                borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" 
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", width: 60 }}>{a.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.patient_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t(a.type)}</div>
                </div>
                <div style={{ 
                  fontSize: 11, padding: "4px 12px", borderRadius: 20, 
                  background: a.status === "مكتمل" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  color: a.status === "مكتمل" ? "#10b981" : "#f59e0b"
                }}>{t(a.status)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>{t("الوصول السريع")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "👤", label: "مريض جديد", path: "/patients", color: "#185FA5" },
                { icon: "📅", label: "موعد جديد", path: "/appointments", color: "#00D2FF" },
                { icon: "🧾", label: "فاتورة", path: "/invoices", color: "#10b981" },
                { icon: "📈", label: "التقارير", path: "/reports", color: "#f59e0b" },
              ].map(action => (
                <button key={action.path} onClick={() => nav(action.path)} className="quick-action-btn">
                  <div className="icon-box" style={{ background: `${action.color}20`, color: action.color }}>{action.icon}</div>
                  <span>{t(action.label)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24, background: "linear-gradient(135deg, rgba(24, 95, 165, 0.2), rgba(0, 210, 255, 0.1))" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>💡 {t("نصيحة اليوم")}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {t("تأكد من مراجعة الحالات الطبية المسجلة للمريض قبل البدء في أي إجراء جراحي اليوم.")}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .quick-action-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
          color: white;
        }
        .quick-action-btn:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.2);
        }
        .icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .appointment-row:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </div>
  );
}
