import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { getInvoices, getInvoiceSummary, addInvoice, payInvoice, getPatients } from "../api";

const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const StatItem = ({ label, value, color }) => {
  const { t } = useLanguage();
  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{t(label)}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "white" }}>{value}</div>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="glass-panel animate-fade" style={{ width: 450, padding: 32 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{title}</h3>
      {children}
    </div>
  </div>
);

const lblStyle = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 };

export default function Invoices() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const searchRef = useRef(null);
  const isSecretary = user?.role === "secretary";
  const [invoices,  setInvoices]  = useState([]);
  const [summary,   setSummary]   = useState({});
  const [patients,  setPatients]  = useState([]);
  const [q,         setQ]         = useState("");
  const [modal,     setModal]     = useState(false);
  const [payModal,  setPayModal]  = useState(null);
  const [form,      setForm]      = useState({ patient_id:"", agreed_price:"", paid:"", payment_method:"Cash", date: localDate(), notes:"" });
  const [payAmt,    setPayAmt]    = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const load = () => {
    getInvoices(q, "").then(setInvoices).catch(console.error);
    getInvoiceSummary().then(setSummary).catch(console.error);
  };
  useEffect(() => { load(); }, [q]);
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

  const save = async () => {
    if (!form.patient_id || !form.agreed_price) return alert(t("أدخل المريض والمبلغ"));
    await addInvoice({ ...form, patient_id: parseInt(form.patient_id), agreed_price: parseFloat(form.agreed_price), amount: 0, paid: parseFloat(form.paid)||0 });
    setModal(false); load();
    setSearchTerm("");
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  const pay = async () => {
    if (!payAmt) return;
    await payInvoice(payModal.id, parseFloat(payAmt));
    setPayModal(null); setPayAmt(""); load();
  };

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t("الفواتير والمدفوعات")}</h2>
        <button onClick={() => { setForm({ patient_id:"", agreed_price:"", paid:"", payment_method:"Cash", date: localDate(), notes:"" }); setSearchTerm(""); setModal(true); }} className="btn-primary">
          <span>+</span> {t("إصدار فاتورة جديدة")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatItem label={isSecretary ? "إجمالي فواتير اليوم" : "إجمالي الفواتير"} value={(isSecretary ? summary.today_total : summary.total || 0) + " د"} />
        <StatItem label={isSecretary ? "المبالغ المحصلة اليوم" : "المبالغ المحصلة"} value={(isSecretary ? summary.today_collected : summary.collected || 0) + " د"} color="var(--success)" />
        <StatItem label="الديون المتبقية" value={(summary.debt || 0) + " د"} color="var(--danger)" />
      </div>

      <div className="glass-panel" style={{ padding: 16, marginBottom: 20 }}>
        <input className="glass-input" placeholder={t("ابحث باسم المريض...")} 
          value={q} onChange={e => setQ(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {[t("المريض"), t("التاريخ"), t("المبلغ"), t("المدفوع"), t("المستحق"), t("الحالة"), t("إجراء")].map(h => (
                <th key={h} style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "14px 20px", fontWeight: 500 }}>{i.patient_name}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-muted)" }}>{i.date}</td>
                <td style={{ padding: "14px 20px", fontSize: 13 }}>{i.amount} د</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--success)" }}>{i.paid} د</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--danger)" }}>{i.amount - i.paid} د</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ 
                    fontSize: 11, padding: "4px 10px", borderRadius: 20,
                    background: i.status === "مدفوع" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    color: i.status === "مدفوع" ? "#10b981" : "#f59e0b"
                  }}>{t(i.status)}</span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => window.print()} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }}>🖨</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: 520, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{t("إصدار فاتورة جديدة")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ position: "relative" }} ref={searchRef}>
                <label style={lblStyle}>{t("المريض")}</label>
                <div style={{ position: "relative" }}>
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
                
                {showResults && searchTerm && (
                  <div className="glass-panel" style={{ 
                    position: "absolute", top: "105%", left: 0, right: 0, zIndex: 100,
                    maxHeight: 240, overflowY: "auto", padding: 8,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    {filteredPatients.length === 0 ? (
                      <div style={{ padding: 12, color: "var(--text-muted)", textAlign: "center", fontSize: 13 }}>{t("لا يوجد نتائج")}</div>
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
                          <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                          {p.phone && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📞 {p.phone}</div>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={lblStyle}>{t("السعر الكلي المتفق عليه")}</label><input type="number" className="glass-input" style={{ width: "100%" }} placeholder="IQD" value={form.agreed_price} onChange={e => setForm({ ...form, agreed_price: e.target.value })} /></div>
                <div><label style={lblStyle}>{t("الدفعة الأولى")}</label><input type="number" className="glass-input" style={{ width: "100%" }} placeholder="IQD" value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} /></div>
              </div>
              <div>
                <label style={lblStyle}>{t("طريقة الدفع")}</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["Cash", "Bank"].map(m => (
                    <button key={m} onClick={() => setForm({...form, payment_method: m})}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${form.payment_method === m ? (m === 'Cash' ? '#10b981' : '#00D2FF') : 'transparent'}`, background: form.payment_method === m ? (m === 'Cash' ? 'rgba(16,185,129,0.15)' : 'rgba(0,210,255,0.15)') : 'rgba(255,255,255,0.04)', color: form.payment_method === m ? (m === 'Cash' ? '#10b981' : '#00D2FF') : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                      {m === 'Cash' ? t("Cash (الخزنة)") : t("Bank (البنك)")}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={lblStyle}>{t("التاريخ")}</label><input type="date" className="glass-input" style={{ width: "100%" }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><label style={lblStyle}>{t("ملاحظات")}</label><input className="glass-input" style={{ width: "100%" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex: 1 }}>{t("إلغاء")}</button>
              <button onClick={save} className="btn-primary" style={{ flex: 1 }}>{t("حفظ الفاتورة")}</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
