import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ref, update } from "firebase/database";
import { db } from "./firebaseConfig";
import EditPatient from "./pages/EditPatient";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerReviews from "./pages/CustomerReviews";
import Prices from "./pages/Prices";
import Discounts from "./pages/Discounts";
import PatientForm from "./pages/PatientForm";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AddSession from "./pages/AddSession";
import AddReview from "./pages/AddReview";
import PatientDetails from './pages/PatientDetails';
import SelectClient from "./pages/SelectClient";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (!user) return;
    
    update(ref(db, `users/${user.username}`), { loggedIn: false })
      .then(() => {
        setUser(null);
        localStorage.removeItem("user");
        navigate("/");
      })
      .catch((err) => console.error(err));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* عرض الـ Sidebar فقط إذا كان user موجود */}
      {user && (
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          onLogout={handleLogout} 
        />
      )}
      
      <div className="flex-1 flex flex-col">
        {/* عرض الهيدر فقط إذا كان user موجود */}
        {user && (
          <header className="p-4 bg-white shadow flex items-center justify-between lg:hidden">
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">لوحة التحكم</h1>
          </header>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
              } 
            />
           <Route path="/edit-patient" element={<EditPatient />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/customers"
              element={user ? <Customers /> : <Navigate to="/login" />}
            />
            <Route
              path="/reviews"
              element={user ? <CustomerReviews /> : <Navigate to="/login" />}
            />
            <Route
              path="/patient-details"
              element={user ? <PatientDetails /> : <Navigate to="/login" />}
            />
            <Route
              path="/SelectClient"
              element={user ? <SelectClient /> : <Navigate to="/login" />}
            />
            <Route
              path="/prices"
              element={user ? <Prices /> : <Navigate to="/login" />}
            />
            <Route 
              path="/add-client" 
              element={user ? <PatientForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add-session" 
              element={user ? <AddSession /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add-review" 
              element={user ? <AddReview /> : <Navigate to="/login" />} 
            />
            <Route
              path="/discounts"
              element={user ? <Discounts /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}