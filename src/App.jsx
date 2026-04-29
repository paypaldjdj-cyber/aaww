import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth }  from "./AuthContext";
import { LanguageProvider }       from "./LanguageContext";
import { SettingsProvider }       from "./SettingsContext";
import Layout        from "./components/Layout";
import Login         from "./pages/Login";
import Home          from "./pages/Home";
import Patients      from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Appointments  from "./pages/Appointments";
import Invoices      from "./pages/Invoices";
import Reports       from "./pages/Reports";
import Settings      from "./pages/Settings";
import Expenses      from "./pages/Expenses";
import Debts         from "./pages/Debts";
import Prescriptions from "./pages/Prescriptions";
import Admin         from "./pages/Admin";

function ProtectedApp() {
  const { user, logout } = useAuth();
  
  if (!user) return <Login />;

  // Check subscription/status
  const isInactive = user.status === 'inactive';
  const isExpired = user.expiry_date && new Date(user.expiry_date) < new Date();
  
  if (isInactive || isExpired) {
    return (
      <div style={{ 
        height: "100vh", width: "100vw", background: "var(--bg-dark)", 
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "var(--text-light)", padding: "20px", textAlign: "center"
      }}>
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "500px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>الحساب معطل أو انتهى الاشتراك</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", lineHeight: "1.6" }}>
            عذراً، لا يمكنك الوصول إلى النظام حالياً. يرجى الاتصال بالإدارة لتجديد اشتراكك أو تفعيل الحساب عبر الرقم التالي:<br/>
            <strong style={{ color: "var(--accent)", fontSize: "20px" }}>{user.support_phone}</strong>
          </p>
          <button className="btn-secondary" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>
    );
  }
  
  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/patients"       element={<Patients />} />
        <Route path="/patients/:id"   element={<PatientProfile />} />
        <Route path="/appointments"   element={<Appointments />} />
        <Route path="/invoices"       element={<Invoices />} />
        <Route path="/reports"        element={<Reports />} />
        <Route path="/expenses"       element={<Expenses />} />
        <Route path="/debts"          element={<Debts />} />
        <Route path="/prescriptions"  element={<Prescriptions />} />
        <Route path="/settings"       element={<Settings />} />
        <Route path="*"               element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="/*" element={<ProtectedApp />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}
