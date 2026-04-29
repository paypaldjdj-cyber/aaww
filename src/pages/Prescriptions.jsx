import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { getAllPrescriptions, deletePrescription, updatePrescription } from "../api";
import { useNavigate } from "react-router-dom";

export default function Prescriptions() {
  const { t } = useLanguage();
  const [list, setList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const nav = useNavigate();

  const load = () => {
    getAllPrescriptions().then(setList).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (confirm(t("هل أنت متأكد من حذف هذه الوصفة؟"))) {
      await deletePrescription(id);
      load();
      if (selectedPatient) {
        // Refresh selected patient's prescriptions
        const newList = await getAllPrescriptions();
        setList(newList);
        const p = newList.reduce((acc, curr) => {
          if (curr.patient_id === selectedPatient.id) {
            if (!acc) acc = { id: curr.patient_id, name: curr.patient_name, prescriptions: [] };
            acc.prescriptions.push(curr);
          }
          return acc;
        }, null);
        setSelectedPatient(p);
      }
    }
  };

  // Group prescriptions by patient
  const patientsMap = list.reduce((acc, curr) => {
    if (!acc[curr.patient_id]) {
      acc[curr.patient_id] = { id: curr.patient_id, name: curr.patient_name, prescriptions: [] };
    }
    acc[curr.patient_id].prescriptions.push(curr);
    return acc;
  }, {});
  const patientsList = Object.values(patientsMap).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const BASE_URL = "http://localhost:5050";

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t("سجل الوصفات الطبية")}</h2>
        
        {!selectedPatient && (
          <div style={{ position: "relative", width: 300 }}>
            <input 
              type="text" 
              className="glass-input" 
              style={{ width: "100%", paddingLeft: 40 }} 
              placeholder={t("بحث باسم المريض...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
          </div>
        )}
      </div>

      {!selectedPatient ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {patientsList.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: 24, cursor: "pointer", transition: "transform 0.2s" }} 
                 onClick={() => setSelectedPatient(p)}
                 onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                 onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.prescriptions.length} {t("وصفات مسجلة")}</div>
            </div>
          ))}
          {patientsList.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              {t("لا توجد وصفات مسجلة")}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade">
          <button onClick={() => setSelectedPatient(null)} className="btn-ghost" style={{ marginBottom: 24 }}>← {t("رجوع لقائمة المرضى")}</button>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{t("وصفات")} — {selectedPatient.name}</h3>
            <button onClick={() => nav(`/patients/${selectedPatient.id}`)} className="btn-primary" style={{ fontSize: 12 }}>{t("فتح الملف الشخصي")}</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {selectedPatient.prescriptions.map(pr => (
              <div key={pr.id} className="glass-panel" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{pr.date}</div>
                <div style={{ width: "100%", aspectRatio: "3/4", background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {pr.image_url ? (
                    <img src={BASE_URL + pr.image_url} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} 
                         onClick={() => window.open(BASE_URL + pr.image_url, "_blank")} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 20 }}>
                       <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{pr.meds}</div>
                       <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>{pr.notes}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                  <button onClick={() => setEditing(pr)} className="btn-ghost" style={{ fontSize: 11, color: "var(--accent)" }}>✏️ {t("تعديل")}</button>
                  <button onClick={() => handleDelete(pr.id)} className="btn-ghost" style={{ fontSize: 11, color: "var(--danger)" }}>🗑 {t("مسح")}</button>
                  <button onClick={() => window.print()} className="btn-ghost" style={{ fontSize: 11 }}>🖨 {t("طباعة")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="glass-panel animate-fade" style={{ width: 450, padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{t("تعديل بيانات الوصفة")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("التاريخ")}</label>
                <input type="date" className="glass-input" style={{ width: "100%" }} value={editing.date} onChange={e => setEditing({...editing, date: e.target.value})} />
              </div>
              {!editing.image_url && (
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("الأدوية")}</label>
                  <textarea className="glass-input" style={{ width: "100%", minHeight: 100 }} value={editing.meds} onChange={e => setEditing({...editing, meds: e.target.value})} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("ملاحظات")}</label>
                <input className="glass-input" style={{ width: "100%" }} value={editing.notes} onChange={e => setEditing({...editing, notes: e.target.value})} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setEditing(null)} className="btn-ghost" style={{ flex: 1 }}>{t("إلغاء")}</button>
              <button onClick={async () => {
                await updatePrescription(editing.id, editing);
                setEditing(null);
                load();
                if(selectedPatient) {
                  const newList = await getAllPrescriptions();
                  setList(newList);
                  const p = newList.reduce((acc, curr) => {
                    if (curr.patient_id === selectedPatient.id) {
                      if (!acc) acc = { id: curr.patient_id, name: curr.patient_name, prescriptions: [] };
                      acc.prescriptions.push(curr);
                    }
                    return acc;
                  }, null);
                  setSelectedPatient(p);
                }
              }} className="btn-primary" style={{ flex: 1 }}>{t("حفظ")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
