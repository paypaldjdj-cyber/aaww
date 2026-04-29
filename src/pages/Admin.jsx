import React, { useState, useEffect } from "react";
import { getDoctors, createDoctor, deleteDoctor, updateDoctor } from "../api";
import { useLanguage } from "../LanguageContext";

export default function Admin() {
  const [doctors, setDoctors] = useState([]);
  const [supportPhone, setSupportPhone] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    clinic_name: "",
    expiry_date: "",
    status: "active",
    secretary_enabled: 0,
    secretary_password: "",
    settings: {
      currency: "IQD",
      doctor_name: ""
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data);
      
      const { getAdminSettings } = await import("../api");
      const settings = await getAdminSettings();
      setSupportPhone(settings.support_phone || "");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctors();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormData(prev => ({ ...prev, expiry_date: nextYear.toISOString().split('T')[0] }));
  }, []);

  const handleUpdateSupportPhone = async () => {
    try {
      const { updateAdminSettings } = await import("../api");
      await updateAdminSettings({ support_phone: supportPhone });
      alert("تم تحديث رقم الدعم بنجاح!");
    } catch (e) {
      alert("Error updating support phone");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoctor(editingId, formData);
        alert("تم تحديث الحساب والإعدادات بنجاح!");
      } else {
        if (!formData.username || !formData.password) return alert("Username and password are required");
        await createDoctor(formData);
        alert("تم إنشاء حساب العيادة بنجاح!");
      }
      resetForm();
      fetchDoctors();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormData({
      username: "",
      password: "",
      clinic_name: "",
      expiry_date: nextYear.toISOString().split('T')[0],
      status: "active",
      secretary_enabled: 0,
      secretary_password: "",
      settings: {
        currency: "IQD",
        doctor_name: ""
      }
    });
  };

  const handleEdit = (doc) => {
    setEditingId(doc.id);
    setFormData({
      username: doc.username,
      password: "",
      clinic_name: doc.clinic_name,
      expiry_date: doc.expiry_date || "",
      status: doc.status || "active",
      secretary_enabled: doc.secretary_enabled || 0,
      secretary_password: doc.secretary_password || "",
      settings: {
        currency: "IQD",
        doctor_name: doc.clinic_name // Defaulting doctor name to clinic name
      }
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه العيادة نهائياً؟")) return;
    try {
      await deleteDoctor(id);
      fetchDoctors();
    } catch (e) {
      alert("Error deleting doctor");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "40px", color: "var(--text-light)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>EasyClinic SaaS Admin Dashboard</h1>
          <p style={{ color: "var(--text-muted)" }}>إدارة الحسابات، الاشتراكات، وإعدادات العيادات</p>
          <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>رقم هاتف الدعم الفني:</span>
            <input 
              className="glass-input" 
              style={{ width: "160px", height: "32px", fontSize: "13px" }} 
              value={supportPhone} 
              onChange={(e) => setSupportPhone(e.target.value)} 
            />
            <button className="btn-primary" style={{ height: "32px", padding: "0 12px", fontSize: "12px" }} onClick={handleUpdateSupportPhone}>حفظ</button>
          </div>
        </div>
        <div>
          <button className="btn-secondary" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
            {language === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
        {/* Management Form */}
        <div className="glass-panel" style={{ padding: "24px", position: "sticky", top: 40, height: "fit-content" }}>
          <h2 style={{ marginBottom: "24px" }}>{editingId ? "تعديل حساب" : "إنشاء حساب عيادة جديد"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--accent)" }}>البيانات الأساسية</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "12px" }}>اسم العيادة</label>
                <input className="glass-input" style={{ width: "100%" }} value={formData.clinic_name} onChange={(e) => setFormData({...formData, clinic_name: e.target.value})} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "12px" }}>اسم المستخدم</label>
                <input className="glass-input" style={{ width: "100%", opacity: editingId ? 0.6 : 1 }} value={formData.username} disabled={!!editingId} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "12px" }}>{editingId ? "تغيير كلمة المرور" : "كلمة المرور"}</label>
                <input type="password" className="glass-input" style={{ width: "100%" }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>

            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--accent)" }}>الاشتراك والحالة</h3>
              <div><label style={lblStyle}>تاريخ الانتهاء</label><input type="date" className="glass-input" style={{ width: "100%" }} value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} /></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <div>
                  <label style={lblStyle}>حساب السكرتيرة</label>
                  <select className="glass-input" style={{ width: "100%" }} value={formData.secretary_enabled} onChange={e => setFormData({ ...formData, secretary_enabled: parseInt(e.target.value) })}>
                    <option value={0}>معطل</option>
                    <option value={1}>مفعل</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>كلمة مرور السكرتيرة</label>
                  <input type="text" className="glass-input" style={{ width: "100%" }} placeholder="Password" value={formData.secretary_password} onChange={e => setFormData({ ...formData, secretary_password: e.target.value })} />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={lblStyle}>حالة الحساب</label>
                <select className="glass-input" style={{ width: "100%" }} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">نشط</option>
                  <option value="inactive">معطل</option>
                </select>
              </div>
            </div>

            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--accent)" }}>إعدادات العيادة (للطبيب)</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "12px" }}>اسم الطبيب (Settings)</label>
                <input className="glass-input" style={{ width: "100%" }} value={formData.settings.doctor_name} onChange={(e) => setFormData({...formData, settings: {...formData.settings, doctor_name: e.target.value}})} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "12px" }}>العملة (Currency)</label>
                <select className="glass-input" style={{ width: "100%" }} value={formData.settings.currency} onChange={(e) => setFormData({...formData, settings: {...formData.settings, currency: e.target.value}})}>
                  <option value="IQD">دينار عراقي (IQD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EGP">جنيه مصري (EGP)</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button className="btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? "جاري المعالجة..." : (editingId ? "تحديث الكل" : "إنشاء الحساب")}
              </button>
              {editingId && <button type="button" className="btn-secondary" onClick={resetForm} style={{ flex: 1 }}>إلغاء</button>}
            </div>
          </form>
        </div>

        {/* List of Doctors */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ marginBottom: "24px" }}>العيادات والاشتراكات</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم العيادة</th>
                  <th>اسم المستخدم</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => {
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                  return (
                    <tr key={doc.id} style={{ opacity: doc.status === 'inactive' ? 0.6 : 1 }}>
                      <td style={{ fontWeight: 600 }}>{doc.clinic_name}</td>
                      <td><span className="badge badge-primary">{doc.username}</span></td>
                      <td dir="ltr" style={{ color: isExpired ? "#ff4d4d" : "inherit" }}>
                        {doc.expiry_date}
                        {isExpired && <div style={{ fontSize: '10px', fontWeight: 'bold' }}>EXPIRED</div>}
                      </td>
                      <td>
                        <span className={`badge ${doc.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {doc.status === 'active' ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="btn-secondary" onClick={() => handleEdit(doc)} style={{ padding: "4px 8px", fontSize: "12px" }}>تعديل</button>
                          <button className="btn-danger" onClick={() => handleDelete(doc.id)} style={{ padding: "4px 8px", fontSize: "12px" }}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 };
