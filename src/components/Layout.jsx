import { useState } from "react";

import { NavLink } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { useSettings } from "../SettingsContext";

const links = [
  { to: "/", label: "الرئيسية", icon: "🏠", mobile: true },
  { to: "/patients", label: "المرضى", icon: "👥", mobile: true },
  { to: "/appointments", label: "المواعيد", icon: "📅", mobile: true },
  { to: "/invoices", label: "الفواتير", icon: "💰", mobile: true },
  { to: "/reports", label: "التقارير", icon: "📈" },
  { to: "/prescriptions", label: "الوصفات", icon: "📝" },
  { to: "/expenses", label: "المصاريف", icon: "📉" },
  { to: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function Layout({ children }) {
  const { t, toggleLanguage, lang } = useLanguage();
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const [showMore, setShowMore] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "short", day: "numeric", month: "short"
  });

  const filteredLinks = user?.role === "secretary"
    ? links.filter(l => l.label !== "الإعدادات")
    : links;

  const mobilePrimaryLinks = filteredLinks.filter(l => l.mobile);
  const mobileSecondaryLinks = filteredLinks.filter(l => !l.mobile);

  return (
    <div className={isMobile ? "mobile-mode" : ""} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <aside className="glass-panel desktop-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, padding: "0 10px" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #185FA5, #00D2FF)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
            }}>🦷</div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>{settings.clinic_name || t("SmileCare")}</div>
          </div>

          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            {filteredLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"}
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <span style={{ fontSize: 18 }}>{l.icon}</span>
                {t(l.label)}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? "12px 12px 80px 12px" : "24px 32px 24px 16px", overflowY: "auto", width: "100%" }}>
        {/* Top Header */}
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: isMobile ? 16 : 32, padding: "0 4px"
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 10 : 12, color: "var(--text-muted)", marginBottom: 2 }}>{today}</div>
            <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>{isMobile ? settings.clinic_name : `${t("أهلاً بك")} ${settings.doctor_name || t("دكتور")}`}</h1>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={toggleLanguage} className="btn-ghost" style={{ fontSize: 12, fontWeight: 600, height: 32, padding: "0 10px" }}>
              {lang === "ar" ? "EN" : "AR"}
            </button>
            <button onClick={() => setIsMobile(!isMobile)} className="glass-panel" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid rgba(255, 255, 255, 0.1)", background: isMobile ? "rgba(0, 210, 255, 0.1)" : "rgba(255,255,255,0.05)", color: isMobile ? "#00D2FF" : "white", cursor: "pointer", borderRadius: 8, transition: "all 0.2s" }}>
              {isMobile ? "💻" : "📱"}
            </button>
            <button onClick={logout} className="glass-panel" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer", borderRadius: 8 }}>
              🚪
            </button>
          </div>
        </header>

        <div className="animate-fade">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      {isMobile && (
        <>
          {showMore && (
            <div className="animate-fade" style={{ position: "fixed", bottom: 80, right: 16, left: 16, zIndex: 10000 }}>
              <div className="glass-panel" style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {mobileSecondaryLinks.map(l => (
                  <NavLink key={l.to} to={l.to} onClick={() => setShowMore(false)}
                    className="nav-link" style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "flex-start", gap: 12 }}>
                    <span>{l.icon}</span>
                    <span style={{ fontSize: 13 }}>{t(l.label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          <nav className="mobile-nav">
            {mobilePrimaryLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setShowMore(false)}
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <span>{l.icon}</span>
                <span>{t(l.label)}</span>
              </NavLink>
            ))}
            <button onClick={() => setShowMore(!showMore)} className={showMore ? "nav-link active" : "nav-link"} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
              <span>{showMore ? "✕" : "➕"}</span>
              <span>{t("المزيد")}</span>
            </button>
          </nav>
        </>
      )}

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
          bottom: 12px;
          left: 12px;
          right: 12px;
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 4px;
          z-index: 9999;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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
        .nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
        }
        .nav-link.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(24, 95, 165, 0.3);
        }
        .mobile-nav .nav-link {
          flex-direction: column;
          gap: 2px;
          padding: 6px 0;
          flex: 1;
          justify-content: center;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0;
        }
        .mobile-nav .nav-link.active {
          color: var(--accent);
        }
        .mobile-nav .nav-link.active span:first-child {
          transform: translateY(-2px);
          text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
