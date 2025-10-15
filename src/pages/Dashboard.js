import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SessionList from "../components/SessionList";
import admin from "./admin.jpeg"

export default function Dashboard({ user }) {
  const [manager, setManager] = useState({ name: user?.name || "أيناس كلينك  ", avatar: admin });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setManager({ 
            name: data.name || user.displayName || " أيناس كلينك ", 
            avatar: admin 
          });
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
        setError("خطأ في تحميل بيانات المستخدم");
        setManager({
          name: user.displayName || " أيناس كلينك ",
          avatar: admin
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);


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
    <div className="space-y-6 container-max p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      <Header manager={manager} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold">إضافة جلسة سريعة</h3>
            <p className="text-sm text-gray-500">
              استخدم صفحة العملاء لإضافة بيانات مفصلة لاحقاً
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <button
                onClick={() => navigate("/SelectClient")}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                إضافة جلسة
              </button>
              <button
                onClick={() => navigate("/add-client")}
                className="px-4 py-2 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
              >
                إضافة عميل جديد
              </button>
              <button
                onClick={() => navigate("/add-review")}
                className="px-4 py-2 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
              >
                إضافة رأي العميل
              </button>
            </div>
          </div>
          
          {/* إضافة إحصائيات سريعة */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">إحصائيات سريعة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div className="text-sm text-blue-800">عملاء جدد</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-green-800">جلسات اليوم</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <SessionList />
        </div>
      </div>
    </div>
  );
}