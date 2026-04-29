import { useEffect, useState } from "react";
import { useLanguage } from '../LanguageContext';
import { getSettings, updateSettings } from "../api";
import { useSettings } from "../SettingsContext";

export default function Settings() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isLight, setIsLight] = useState(document.body.classList.contains("light-mode"));

  useEffect(() => {
    getSettings().then(setForm).catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true);
    await updateSettings(form).catch(console.error);
    refreshSettings();
    setSaving(false);
    alert(t("✓ تم الحفظ"));
  };

  const fields = [
    { k: "clinic_name",  l: "اسم العيادة" },
    { k: "doctor_name",  l: "اسم الطبيب" },
    { k: "phone",        l: "رقم الهاتف" },
    { k: "address",      l: "عنوان العيادة" },
  ];

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{t("إعدادات النظام")}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Clinic Info */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>🏢 {t("بيانات العيادة")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {fields.map(f => (
              <div key={f.k}>
                <label style={lblStyle}>{t(f.l)}</label>
                <input className="glass-input" style={{ width: "100%" }} 
                  value={form[f.k] || ""} onChange={e => setForm({ ...form, [f.k]: e.target.value })} />
              </div>
            ))}
            <button onClick={save} disabled={saving} className="btn-primary" style={{ marginTop: 12 }}>
              {saving ? t("جاري الحفظ...") : t("حفظ التغييرات")}
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>🌐 {t("اللغة والمظهر")}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 14 }}>{t("لغة النظام")}</span>
              <button onClick={toggleLanguage} className="btn-ghost" style={{ fontSize: 12 }}>
                {lang === "ar" ? "English" : "العربية"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14 }}>{t("الوضع الليلي")}</span>
              <div onClick={() => {
                const body = document.body;
                body.classList.toggle("light-mode");
                const light = body.classList.contains("light-mode");
                localStorage.setItem("light-mode", light);
                setIsLight(light);
              }} style={{ 
                width: 40, height: 20, borderRadius: 20, background: isLight ? "#cbd5e1" : "var(--primary)", 
                position: "relative", cursor: "pointer" 
              }}>
                <div style={{ 
                  width: 16, height: 16, borderRadius: "50%", background: "white", 
                  position: "absolute", top: 2, 
                  right: isLight ? 22 : 2,
                  transition: "all 0.2s"
                }} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>🛡️ {t("الأمان والنسخ الاحتياطي")}</h3>
            <button onClick={() => window.open("http://localhost:5050/api/settings/backup")} className="btn-ghost" style={{ width: "100%", textAlign: "right", marginBottom: 12, fontSize: 13 }}>
              📥 {t("تحميل نسخة احتياطية (قاعدة البيانات)")}
            </button>
            <button onClick={() => {
              const pass = prompt(t("أدخل كلمة المرور الجديدة:"));
              if(pass) {
                fetch("http://localhost:5050/api/auth/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: "doctor", password: pass })
                }).then(() => alert(t("✓ تم التغيير")));
              }
            }} className="btn-ghost" style={{ width: "100%", textAlign: "right", fontSize: 13, color: "var(--danger)" }}>
              🔑 {t("تغيير كلمة المرور")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 };
