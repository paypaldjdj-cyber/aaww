const API_BASE_URL = "http://localhost:5050";
const BASE = `${API_BASE_URL}/api`;

async function req(path, method = "GET", body = null) {
  console.log(`API REQ: ${method} ${path}`, body);
  let user = null;
  try {
    const saved = localStorage.getItem("clinic_user");
    if (saved && saved !== "undefined") user = JSON.parse(saved);
  } catch (e) { }
  
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": user?.token ? `Bearer ${user.token}` : ""
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    let msg = "Error";
    try {
      const errData = await res.json();
      msg = errData.error || msg;
      if (errData.support_phone) {
        const err = new Error(msg);
        err.support_phone = errData.support_phone;
        throw err;
      }
    } catch (e) {
      if (e.support_phone) throw e;
      msg = await res.text() || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}

// Auth
export const login = (data) => req("/auth/login", "POST", data);
export const getDoctors = () => req("/auth/doctors");
export const createDoctor = (data) => req("/auth/doctors", "POST", data);
export const updateDoctor = (id, data) => req(`/auth/doctors/${id}`, "PUT", data);
export const deleteDoctor = (id) => req(`/auth/doctors/${id}`, "DELETE");
export const getAdminSettings = () => req("/auth/admin/settings");
export const updateAdminSettings = (data) => req("/auth/admin/settings", "POST", data);

// Patients
export const getPatients = (q = "", status = "") => req(`/patients/?q=${q}&status=${status}`);
export const getPatient = (id) => req(`/patients/${id}`);
export const addPatient = (data) => req("/patients/", "POST", data);
export const updatePatient = (id, data) => req(`/patients/${id}`, "PUT", data);

// Teeth & Medical
export const saveTeeth = (id, data) => req(`/patients/${id}/teeth`, "POST", data);
export const addPrescription = (id, data) => req(`/patients/${id}/prescriptions`, "POST", data);
export const uploadPrescription = async (id, formData) => {
  const user = JSON.parse(localStorage.getItem("clinic_user") || "{}");
  const res = await fetch(`${BASE}/patients/${id}/prescriptions`, {
    method: "POST",
    headers: { "Authorization": user?.token ? `Bearer ${user.token}` : "" },
    body: formData
  });
  return res.json();
};
export const getAllPrescriptions = () => req("/patients/prescriptions/all");
export const deletePrescription = (id) => req(`/patients/prescriptions/${id}`, "DELETE");
export const updatePrescription = (id, data) => req(`/patients/prescriptions/${id}`, "PUT", data);

// Appointments
export const getAppointments = (date = "") => req(`/appointments/?date=${date}`);
export const addAppointment = (data) => req("/appointments/", "POST", data);
export const updateAppointment = (id, data) => req(`/appointments/${id}`, "PUT", data);
export const deleteAppointment = (id) => req(`/appointments/${id}`, "DELETE");

// Finance & Invoices
export const getInvoices = (q = "", status = "") => req(`/invoices/?q=${q}&status=${status}`);
export const addInvoice = (data) => req("/invoices/", "POST", data);
export const payInvoice = (id, amount) => req(`/invoices/${id}/pay`, "POST", { amount });
export const getInvoiceSummary = () => req("/stats/invoices/summary");

// Expenses
export const getExpenses = () => req("/expenses/");
export const addExpense = (data) => req("/expenses/", "POST", data);
export const deleteExpense = (id) => req(`/expenses/${id}`, "DELETE");

// Stats & Settings
export const getStats = () => req("/stats/summary");
export const getFinancialStats = () => req("/stats/financial");
export const getDebts = () => req("/stats/debts");
export const getSettings = () => req("/settings/");
export const updateSettings = (data) => req("/settings/", "PUT", data);
