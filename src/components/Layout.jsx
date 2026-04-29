import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { useSettings } from "../SettingsContext";

const links = [
  { to: "/",            label: "الرئيسية",   icon: "🏠" },
  { to: "/patients",    label: "المرضى",     icon: "👥" },
  { to: "/appointments",label: "المواعيد",   icon: "📅" },
  { to: "/invoices",    label: "الفواتير",   icon: "💰" },
  { to: "/reports",     label: "التقارير",   icon: "📈" },
  { to: "/prescriptions",label: "الوصفات",   icon: "📝" },
  { to: "/expenses",    label: "المصاريف",   icon: "📉" },
  { to: "/settings",    label: "الإعدادات",  icon: "⚙️" },
];

export default function Layout({ children }) {
  const { t, toggleLanguage, lang } = useLanguage();
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday:"long", day:"numeric", month:"long"
  });

  const [isMobile, setIsMobile] = useState(true);

  const filteredLinks = user?.role === "secretary" 
    ? links.filter(l => l.label !== "الإعدادات") 
    : links;

  return (
    <div className={isMobile ? "mobile-mode" : ""} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Sidebar / Bottom Nav */}
      <aside className={`glass-panel ${isMobile ? "mobile-nav" : "desktop-nav"}`}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, padding: "0 10px" }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #185FA5, #00D2FF)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
            }}>🦷</div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>{settings.clinic_name || t("عيادة الابتسامة")}</div>
          </div>
        )}

        <nav style={{ flex: 1, display: "flex", flexDirection: isMobile ? "row" : "column", gap: isMobile ? 0 : 6, justifyContent: isMobile ? "space-between" : "flex-start", width: "100%" }}>
          {filteredLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              style={navStyle}>
              <span style={{ fontSize: isMobile ? 22 : 18 }}>{l.icon}</span>
              {!isMobile && t(l.label)}
              {isMobile && <span style={{ fontSize: 10 }}>{t(l.label)}</span>}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? "16px 16px 100px 16px" : "24px 32px 24px 16px", overflowY: "auto", width: "100%" }}>
        {/* Top Header */}
        <header style={{ 
          display: "flex", justifyContent: "space-between", alignItems: "center", 
          marginBottom: 32, padding: "0 8px" 
        }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{today}</div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t("أهلاً بك")} {settings.doctor_name || t("دكتور")} 👋</h1>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={toggleLanguage} className="btn-ghost" style={{ fontSize: 13, fontWeight: 600, height: 40, padding: "0 16px" }}>
              {lang === "ar" ? "EN" : "عربي"} 🌐
            </button>
            {!isMobile && (
              <div className="glass-panel" style={{ padding: "0 16px", height: 40, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{t("النظام متصل")}</span>
              </div>
            )}
            <button onClick={() => setIsMobile(!isMobile)} className="glass-panel" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid rgba(255, 255, 255, 0.1)", background: isMobile ? "rgba(0, 210, 255, 0.1)" : "rgba(255,255,255,0.05)", color: isMobile ? "#00D2FF" : "white", cursor: "pointer", borderRadius: 12, transition: "all 0.2s" }} title="وضع الموبايل">
              📱
            </button>
            <button onClick={logout} className="glass-panel" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer", borderRadius: 12, transition: "all 0.2s" }} title={t("تسجيل الخروج")}>
              🚪
            </button>
          </div>
        </header>

        <div className="animate-fade">
          {children}
        </div>
      </main>

      <style>{`
        .desktop-nav {
          width: 260px;
          margin: 16px;
          display: flex;
          flex-direction: column;
          padding: 24px;
          position: sticky;
          top: 16px;
          height: calc(100vh - 32px);
        }
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          display: flex;
          align-items: center;
          padding: 0 5px;
          margin: 0;
          z-index: 9999;
          border-radius: 20px 20px 0 0;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .mobile-nav .nav-link {
          flex-direction: column;
          gap: 4px;
          padding: 6px 0;
          flex: 1;
          justify-content: center;
          border-radius: 0;
          background: transparent !important;
          box-shadow: none !important;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
        }
        .nav-link.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(24, 95, 165, 0.3);
        }
        .mobile-nav .nav-link.active {
          color: var(--accent);
          border-top: 3px solid var(--accent);
          background: transparent;
        }
        .mobile-mode [style*="display: grid"]:not(.calendar-grid) {
          grid-template-columns: 1fr !important;
        }
        .mobile-mode header {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 16px !important;
          width: 100% !important;
        }
        .mobile-mode .glass-panel {
          max-width: 100vw;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

const navStyle = {};
