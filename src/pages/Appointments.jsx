import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../LanguageContext";
import { getAppointments, getPatients, addAppointment, deleteAppointment, addPatient } from "../api";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const TREATMENT_TYPES = [
  "فحص دوري", "تنظيف أسنان", "حشو ضرس", "خلع ضرس",
  "علاج عصب", "تلبيس ضرس", "تقويم أسنان", "تبييض أسنان",
  "زراعة", "أشعة", "استشارة", "أخرى"
];

const STATUS_COLORS = {
  "قادم":   { bg: "rgba(24, 95, 165, 0.15)", color: "#185FA5" },
  "مكتمل":  { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" },
  "ملغي":   { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

const lblStyle = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 };

export default function Appointments() {
  const { t } = useLanguage();
  const today = new Date();
  const searchRef = useRef(null);
  const [year,   setYear]   = useState(today.getFullYear());
  const [month,  setMonth]  = useState(today.getMonth());
  const [selDay, setSelDay] = useState(today.getDate());
  const [apts,   setApts]   = useState([]);
  const [allApts,setAllApts]= useState([]);
  const [patients, setPatients] = useState([]);
  const [modal,  setModal]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({
    patient_id: "", date: "", time: "", type: "", duration_min: 30, status: "قادم", notes: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);

  const dateStr = (d = selDay) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const load = () => {
    getAppointments(dateStr()).then(setApts).catch(console.error);
    getAppointments().then(setAllApts).catch(console.error);
  };

  useEffect(() => { load(); }, [year, month, selDay]);
  useEffect(() => { getPatients().then(setPatients).catch(console.error); }, []);

  // Click outside search results to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = new Date(year, month, 1).getDay();
  const aptDays = new Set(allApts.map(a => parseInt(a.date?.split("-")[2])));

  const openModal = () => {
    setForm({ patient_id: "", date: dateStr(), time: "", type: "", duration_min: 30, status: "قادم", notes: "" });
    setSearchTerm("");
    setShowResults(false);
    setModal(true);
  };

  const quickAddPatient = async () => {
    console.log("Quick Add Clicked. SearchTerm:", searchTerm);
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return;
    
    setPatientSaving(true);
    try {
      // Check if exists
      const exists = patients.find(p => 
        `${p.first_name} ${p.last_name}`.trim().toLowerCase() === trimmedTerm.toLowerCase()
      );
      
      if (exists) {
        console.log("Patient exists:", exists);
        alert(t("المريض موجود بالفعل"));
        setForm(f => ({ ...f, patient_id: exists.id }));
        setSearchTerm(`${exists.first_name} ${exists.last_name}`.trim());
        setShowResults(false);
        setPatientSaving(false);
        return;
      }

      const nameParts = trimmedTerm.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      
      console.log("Sending Add Patient Request...", { firstName, lastName });
      const res = await addPatient({ first_name: firstName, last_name: lastName });
      console.log("Add Patient Response:", res);
      
      if (res && res.id) {
        const newPatient = { 
          id: res.id, 
          first_name: firstName, 
          last_name: lastName,
          phone: "" 
        };
        
        setPatients(prev => [newPatient, ...prev]);
        setForm(f => ({ ...f, patient_id: res.id }));
        setSearchTerm(`${firstName} ${lastName}`.trim());
        setShowResults(false);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      console.error("Quick Add Error:", e);
      alert(t("خطأ في إضافة المريض") + " (" + e.message + ")");
    }
    setPatientSaving(false);
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  const save = async () => {
    if (!form.patient_id || !form.date || !form.time) return alert(t("أدخل المريض والتاريخ والوقت"));
    setSaving(true);
    await addAppointment({ ...form, patient_id: parseInt(form.patient_id) }).catch(console.error);
    setSaving(false);
    setModal(false);
    load();
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t("إدارة المواعيد")}</h2>
        <button onClick={openModal} className="btn-primary">
          <span>+</span> {t("موعد جديد")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
        {/* Calendar */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{t(MONTHS[month])} {year}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={prevMonth} className="btn-ghost" style={{ padding: "4px 12px", fontSize: 18 }}>‹</button>
              <button onClick={nextMonth} className="btn-ghost" style={{ padding: "4px 12px", fontSize: 18 }}>›</button>
            </div>
          </div>

          {/* Day headers */}
          <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 8 }}>
            {["أح", "اث", "ثل", "أر", "خم", "جم", "سب"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, padding: "4px 0" }}>{t(d)}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array(firstWeekDay).fill(null).map((_, i) => <div key={"e" + i} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const d = i + 1;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSel = d === selDay;
              const hasApt = aptDays.has(d);
              return (
                <div key={d} onClick={() => setSelDay(d)} style={{
                  height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, fontSize: 13, cursor: "pointer", position: "relative",
                  background: isSel ? "var(--primary)" : isToday ? "rgba(24,95,165,0.2)" : "transparent",
                  color: isSel ? "white" : isToday ? "var(--primary)" : "white",
                  fontWeight: isSel || isToday ? 700 : 400,
                  border: hasApt && !isSel ? "1px solid rgba(24,95,165,0.4)" : "1px solid transparent",
                  transition: "all 0.15s"
                }}>
                  {d}
                  {hasApt && !isSel && (
                    <div style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "var(--primary)" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", marginLeft: 4 }} />يوم فيه موعد</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--primary)", marginLeft: 4 }} />اليوم المحدد</span>
          </div>
        </div>

        {/* Day appointments */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>
              📅 مواعيد {selDay} {t(MONTHS[month])} {year}
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: 20 }}>
              {apts.length} موعد
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {apts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>{t("لا توجد مواعيد في هذا اليوم")}</div>
                <button onClick={openModal} className="btn-ghost" style={{ marginTop: 16, fontSize: 13 }}>+ أضف موعداً</button>
              </div>
            ) : apts.map(a => {
              const sc = STATUS_COLORS[a.status] || STATUS_COLORS["قادم"];
              return (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                  background: "rgba(255,255,255,0.03)", borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.07)", transition: "background 0.2s"
                }}>
                  {/* Time badge */}
                  <div style={{
                    minWidth: 60, textAlign: "center", padding: "8px 4px", borderRadius: 10,
                    background: "rgba(24,95,165,0.15)", color: "var(--primary)", fontWeight: 700, fontSize: 15
                  }}>
                    {a.time}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{a.patient_name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {a.type || "—"} · {a.duration_min || 30} دقيقة
                      {a.notes && <span> · {a.notes}</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600 }}>
                    {a.status}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteAppointment(a.id).then(load)}
                    className="btn-ghost"
                    style={{ padding: "6px 10px", fontSize: 14, color: "var(--danger)", opacity: 0.7 }}
                    title="حذف"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {modal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: 580, padding: 36 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, textAlign: "center" }}>{t("إضافة موعد جديد")}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Patient */}
              <div>
                <label style={lblStyle}>{t("المريض *")}</label>
                <div style={{ position: "relative" }} ref={searchRef} onMouseDown={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <input 
                        className="glass-input" 
                        style={{ width: "100%", paddingRight: 40 }}
                        placeholder={t("بحث عن مريض...")}
                        value={searchTerm}
                        onFocus={() => setShowResults(true)}
                        onChange={e => {
                          setSearchTerm(e.target.value);
                          setShowResults(true);
                          if (!e.target.value) setForm({ ...form, patient_id: "" });
                        }}
                      />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                    </div>
                    <button 
                      type="button"
                      className="btn-secondary" 
                      onClick={quickAddPatient}
                      disabled={patientSaving}
                      style={{ padding: "0 15px", whiteSpace: "nowrap", height: 46, opacity: patientSaving ? 0.5 : 1 }}
                      title={t("إضافة مريض جديد بهذا الاسم")}
                    >
                      {patientSaving ? "..." : "+ " + t("إضافة سريع")}
                    </button>
                  </div>
                  
                  {showResults && searchTerm && (
                    <div className="glass-panel" style={{ 
                      position: "absolute", top: "105%", left: 0, right: 0, zIndex: 100,
                      maxHeight: 240, overflowY: "auto", padding: 8,
                      boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      {filteredPatients.length === 0 ? (
                        <div style={{ padding: 12, color: "var(--text-muted)", textAlign: "center", fontSize: 13 }}>
                          <div>{t("لا يوجد مريض بهذا الاسم")}</div>
                          <div style={{ fontSize: 11, marginTop: 4 }}>{t("يمكنك الضغط على إضافة سريع لإنشاء حساب له")}</div>
                        </div>
                      ) : (
                        filteredPatients.map(p => (
                          <div key={p.id} 
                            onClick={() => {
                              setForm({ ...form, patient_id: p.id });
                              setSearchTerm(`${p.first_name} ${p.last_name}`);
                              setShowResults(false);
                            }}
                            style={{ 
                              padding: "10px 16px", cursor: "pointer", borderRadius: 10,
                              background: form.patient_id == p.id ? "rgba(24, 95, 165, 0.3)" : "transparent",
                              marginBottom: 4, transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                            onMouseLeave={e => e.currentTarget.style.background = form.patient_id == p.id ? "rgba(24, 95, 165, 0.3)" : "transparent"}
                          >
                            <div style={{ fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                              <span>{p.first_name} {p.last_name}</span>
                              {form.patient_id == p.id && <span style={{ color: "var(--accent)" }}>✓</span>}
                            </div>
                            {p.phone && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>📞 {p.phone}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lblStyle}>{t("التاريخ *")}</label>
                  <input type="date" className="glass-input" style={{ width: "100%" }}
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label style={lblStyle}>{t("الوقت *")}</label>
                  <input type="time" className="glass-input" style={{ width: "100%" }}
                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>

              {/* Type & Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lblStyle}>{t("نوع العلاج")}</label>
                  <select className="glass-input" style={{ width: "100%" }}
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="">{t("اختر النوع...")}</option>
                    {TREATMENT_TYPES.map(typ => <option key={typ} value={typ}>{t(typ)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>{t("المدة (دقيقة)")}</label>
                  <select className="glass-input" style={{ width: "100%" }}
                    value={form.duration_min} onChange={e => setForm({ ...form, duration_min: parseInt(e.target.value) })}>
                    {[15, 20, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} {t("دقيقة")}</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={lblStyle}>{t("الحالة")}</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["قادم", "مكتمل", "ملغي"].map(s => {
                    const sc = STATUS_COLORS[s];
                    return (
                      <button key={s} onClick={() => setForm({ ...form, status: s })}
                        style={{
                          flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${form.status === s ? sc.color : "transparent"}`,
                          background: form.status === s ? sc.bg : "rgba(255,255,255,0.04)",
                          color: form.status === s ? sc.color : "var(--text-muted)",
                          fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.15s"
                        }}>
                        {t(s)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lblStyle}>{t("ملاحظات")}</label>
                <input type="text" className="glass-input" style={{ width: "100%" }}
                  placeholder={t("أي ملاحظات خاصة بالموعد...")}
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex: 1 }}>{t("إلغاء")}</button>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ flex: 2 }}>
                {saving ? t("جاري الحفظ...") : t("✓ حفظ الموعد")}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
