import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Customers() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);

  // جلب البيانات من Firebase عند التحميل
  useEffect(() => {
    const patientsRef = ref(db, "patients");
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // تحويل object إلى array
        const clientsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setClients(clientsArray.reverse()); // أحدث أولاً
      } else {
        setClients([]);
      }
    });

    return () => unsubscribe(); // تنظيف عند الخروج
  }, []);

  const deleteClient = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      // حذف من Firebase
      const clientRef = ref(db, `patients/${id}`);
      clientRef.remove().catch((err) => alert("حدث خطأ: " + err));
    }
  };

  return (
    <div className="container-max p-4 sm:p-6">
      {/* العنوان وزر إضافة مريض جديد */}
      <div className="flex flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">📁 حافظة العملاء</h2>
        <button
          onClick={() => navigate("/add-client")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
        >
          تعبئة استمارة مريض جديد
        </button>
      </div>

      {/* قائمة العملاء */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <ul>
          {clients.length > 0 ? (
            clients.map((c) => (
              <li
                key={c.id}
                className="p-4 border-b last:border-b-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium text-gray-900">{c.fullName}</div>
                  <div className="text-sm text-gray-500">
                    الهوية: {c.idNumber} | الهاتف: {c.phone}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    onClick={() =>
                      navigate("/patient-details", { state: { patientId: c.id } })
                    }
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    عرض المزيد
                  </button>
                  <button
                    onClick={() => deleteClient(c.id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="p-4 text-gray-500 text-center">لا يوجد عملاء بعد</li>
          )}
        </ul>
      </div>
    </div>
  );
}
