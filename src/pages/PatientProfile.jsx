import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatient, saveTeeth, addInvoice, addPrescription, uploadPrescription, updatePatient } from "../api";
import { useLanguage } from "../LanguageContext";
import { createPortal } from "react-dom";
import CasePresentation from "../components/CasePresentation";

const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export default function PatientProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState(null);
  const [isOngoing, setIsOngoing] = useState(true);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [payments, setPayments] = useState([]);
  const [payModal, setPayModal] = useState({ show: false, amount: "", method: "Cash", notes: "" });

  const load = async () => {
    try {
      const data = await getPatient(id);
      setPatient(data);
      setIsOngoing(!!data.is_ongoing);
      // Assuming first invoice is the main one for this simplified local version
      if (data.invoices && data.invoices.length > 0) {
        setAgreedPrice(data.invoices[0].agreed_price || 0);
        setPayments(data.invoices);
      }
    } catch (err) {
      console.error(err);
      nav("/patients");
    }
  };

  useEffect(() => { load(); }, [id]);

  const saveProfile = async (updates) => {
    await updatePatient(id, updates);
    load();
  };

  const addPayment = async () => {
    if (!payModal.amount) return;
    await addInvoice({ 
      patient_id: parseInt(id), 
      amount: 0, 
      paid: parseFloat(payModal.amount),
      agreed_price: agreedPrice,
      payment_method: payModal.method,
      notes: payModal.notes,
      date: localDate()
    });
    setPayModal({ show: false, amount: "", method: "Cash", notes: "" });
    load();
  };

  if (!patient) return <div style={{ color: "white", padding: 40 }}>{t("جاري التحميل...")}</div>;

  const totalPaid = payments.reduce((acc, curr) => acc + (curr.paid || 0), 0);
  const remaining = agreedPrice - totalPaid;

  return (
    <div className="animate-fade" style={{ padding: 20 }}>
      {/* Header with Ongoing Toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{ 
          background: isOngoing ? "#10b981" : "#64748b", 
          padding: "8px 24px", borderRadius: 30, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" 
        }} onClick={() => {
          const next = !isOngoing;
          setIsOngoing(next);
          saveProfile({ is_ongoing: next ? 1 : 0 });
        }}>
          <span style={{ fontWeight: 700, color: "white" }}>{isOngoing ? t("Ongoing Case") : t("Closed Case")}</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40 }}>
        {/* Left Column: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormInput label={t("الاسم الكامل")} val={patient.first_name + " " + patient.last_name} readOnly />
          <FormInput label={t("رقم الهاتف")} val={patient.phone} onChange={v => saveProfile({ phone: v })} />
          <FormInput label={t("العنوان")} val={patient.address} onChange={v => saveProfile({ address: v })} />
          <FormInput label={t("Occupation")} val={patient.occupation} onChange={v => saveProfile({ occupation: v })} />
          
          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "10px 0" }}>
            <span style={{ fontSize: 14 }}>{t("الجنس")}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="radio" checked={patient.gender === "Male"} onChange={() => saveProfile({ gender: "Male" })} /> {t("ذكر")}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="radio" checked={patient.gender === "Female"} onChange={() => saveProfile({ gender: "Female" })} /> {t("أنثى")}
            </label>
          </div>

          <div style={{ width: 120 }}>
            <FormInput label={t("العمر")} val={patient.age} type="number" onChange={v => saveProfile({ age: v })} />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={lblStyle}>{t("أمراض مزمنة")}</label>
            <textarea className="glass-input" style={{ width: "100%", minHeight: 100 }} 
              value={patient.systemic_conditions || ""} onChange={e => saveProfile({ systemic_conditions: e.target.value })} />
          </div>

          <div>
            <label style={lblStyle}>{t("ملاحظات")}</label>
            <textarea className="glass-input" style={{ width: "100%", minHeight: 100 }} 
              value={patient.notes || ""} onChange={e => saveProfile({ notes: e.target.value })} />
          </div>
        </div>

        {/* Right Column: Avatar & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>


          <ActionButton icon="🦷" label="Treatment Plan" onClick={() => setTab("teeth")} />
          <ActionButton icon="Rx" label="Write Prescription" onClick={() => setTab("prescriptions")} />
        </div>
      </div>

      {/* Case Category Dropdown */}
      <div style={{ margin: "40px 0", textAlign: "center" }}>
        <select className="glass-input" style={{ width: 400, textAlign: "center" }} 
          value={patient.case_category || ""} onChange={e => saveProfile({ case_category: e.target.value })}>
          <option value="">{t("نوع الحالة")}</option>
          {["Re Endodontic", "Filling", "Endodontic Treatment", "Extraction", "Surgery", "Implant Surgery", "Implant Prosthetic", "Removable Prosthetics", "Crown and Bridge", "Periodontic", "Pediatric", "Orthodontic", "Teeth Whitening", "Diagnosis", "X-Ray", "Item Purchase", "Other"].map(c => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>

      {/* Simple Finance Section */}
      <div style={{ marginTop: 60, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 40 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
            <div className="glass-panel" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t("إجمالي المبلغ المتفق عليه")}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{agreedPrice.toLocaleString()} IQD</div>
              <button className="btn-ghost" style={{ fontSize: 10, marginTop: 10, padding: "4px 12px" }} 
                onClick={() => {
                  const val = prompt(t("تعديل المبلغ الكلي:"), agreedPrice);
                  if (val) saveProfile({ agreed_price: parseFloat(val) });
                }}>{t("تعديل")}</button>
            </div>
            <div className="glass-panel" style={{ padding: 24, textAlign: "center", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t("المبلغ المدفوع كلياً")}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{totalPaid.toLocaleString()} IQD</div>
            </div>
            <div className="glass-panel" style={{ padding: 24, textAlign: "center", borderLeft: "4px solid #ef4444" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t("المبلغ المتبقي (دين)")}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>{remaining.toLocaleString()} IQD</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18 }}>{t("سجل الدفعات")}</h3>
              <button className="btn-primary" onClick={() => setPayModal({ ...payModal, show: true })}>{t("+ إضافة دفعة")}</button>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>
                  <th style={{ padding: 12, color: "var(--text-muted)", fontSize: 12 }}>{t("التاريخ")}</th>
                  <th style={{ padding: 12, color: "var(--text-muted)", fontSize: 12 }}>{t("المبلغ")}</th>
                  <th style={{ padding: 12, color: "var(--text-muted)", fontSize: 12 }}>{t("ملاحظات")}</th>
                  <th style={{ padding: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 12 }}>{p.date}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{p.paid?.toLocaleString()} IQD</td>
                    <td style={{ padding: 12, color: "var(--text-muted)", fontSize: 13 }}>{p.notes || "—"}</td>
                    <td style={{ padding: 12, textAlign: "left" }}>
                      {/* Delete logic if needed */}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{t("لا توجد دفعات مسجلة")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {tab === "teeth" && (
        <Modal title={t("Treatment Plan")} onClose={() => setTab(null)}>
          <TeethMap initial={patient.teeth} pid={id} />
        </Modal>
      )}

      {tab === "prescriptions" && (
        <Modal title={t("إضافة وصفة طبية (صورة)")} onClose={() => setTab(null)}>
          <div className="animate-fade" style={{ textAlign: "center" }}>
             <div style={{ 
               width: "100%", height: 200, border: "2px dashed rgba(255,255,255,0.1)", 
               borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
               marginBottom: 20, cursor: "pointer", overflow: "hidden", position: "relative"
             }} onClick={() => document.getElementById("presc-file").click()}>
                {patient.temp_presc_img ? 
                  <img src={patient.temp_presc_img} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> :
                  <div style={{ color: "var(--text-muted)" }}>📷 {t("اضغط لتصوير أو اختيار صورة الوصفة")}</div>
                }
             </div>
             <input type="file" id="presc-file" accept="image/*" capture="environment" hidden onChange={(e) => {
               const file = e.target.files[0];
               if(file) setPatient({ ...patient, temp_presc_file: file, temp_presc_img: URL.createObjectURL(file) });
             }} />
             
             <button onClick={async () => {
               if(!patient.temp_presc_file) return alert(t("الرجاء اختيار صورة"));
               const fd = new FormData();
               fd.append("image", patient.temp_presc_file);
               fd.append("date", localDate());
               await uploadPrescription(id, fd);
               load();
               setTab(null);
             }} className="btn-primary" style={{ width: "100%" }}>{t("حفظ الوصفة")}</button>
          </div>
        </Modal>
      )}
      {payModal.show && (
        <Modal title={t("إضافة دفعة جديدة")} onClose={() => setPayModal({ ...payModal, show: false })}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lblStyle}>{t("المبلغ")}</label>
              <input type="number" className="glass-input" style={{ width: "100%" }} placeholder="IQD" 
                value={payModal.amount} onChange={e => setPayModal({...payModal, amount: e.target.value})} />
            </div>
            <div>
              <label style={lblStyle}>{t("طريقة الدفع")}</label>
              <select className="glass-input" style={{ width: "100%" }} 
                value={payModal.method} onChange={e => setPayModal({...payModal, method: e.target.value})}>
                <option value="Cash">{t("Cash (الخزنة)")}</option>
                <option value="Bank">{t("Bank (البنك)")}</option>
              </select>
            </div>
            <div>
              <label style={lblStyle}>{t("ملاحظات")}</label>
              <input type="text" className="glass-input" style={{ width: "100%" }} placeholder={t("أدخل أي ملاحظات حول الدفعة")}
                value={payModal.notes} onChange={e => setPayModal({...payModal, notes: e.target.value})} />
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setPayModal({ ...payModal, show: false })}>{t("إلغاء")}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={addPayment}>{t("إضافة")}</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: 600, padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <h3 style={{ fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 20, padding: "0 10px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  , document.body);
}

const FormInput = ({ label, val, onChange, readOnly, type = "text" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <input className="glass-input" style={{ width: "100%", textAlign: "center" }} 
      type={type} placeholder={label} value={val || ""} readOnly={readOnly}
      onChange={e => onChange && onChange(e.target.value)} />
  </div>
);

const ActionButton = ({ icon, label, onClick }) => (
  <button className="glass-panel" style={{ 
    display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", 
    width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" 
  }} onClick={onClick}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <span style={{ fontWeight: 600 }}>{label}</span>
  </button>
);

const lblStyle = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 };

const DetailRow = ({ label, val, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
    <span style={{ color: "var(--text-muted)" }}>{label}:</span>
    <span style={{ color: color || "white", fontWeight: 500 }}>{val}</span>
  </div>
);

const InfoBox = ({ label, val }) => (
  <div>
    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
    <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 13 }}>{val || "—"}</div>
  </div>
);

function TeethMap({ initial, pid }) {
  const [data, setData] = useState(initial || {});
  const { t } = useLanguage();
  
  const toggle = (i) => {
    const states = ["سليم", "حشو", "تلبيس", "مفقود"];
    const curr = data[i] || "سليم";
    const next = states[(states.indexOf(curr) + 1) % states.length];
    setData({ ...data, [i]: next });
  };

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h3>{t("خريطة الأسنان")}</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { if(confirm(t("هل تريد مسح الخريطة؟"))) setData({}); }} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>{t("مسح الخريطة")}</button>
          <button onClick={() => saveTeeth(pid, data).then(() => alert(t("تم الحفظ")))} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>{t("حفظ")}</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
        {Array(32).fill(0).map((_, i) => {
          const id = i + 1;
          return (
            <div key={id} onClick={() => toggle(id)} style={{ 
              height: 40, border: "1px solid var(--glass-border)", borderRadius: 8, 
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: data[id] === "حشو" ? "#f59e0b30" : data[id] === "تلبيس" ? "#185FA530" : "transparent"
            }}>{id}</div>
          );
        })}
      </div>
    </div>
  );
}


