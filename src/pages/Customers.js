import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Customers() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const deleteClient = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل؟\nسيتم حذف جميع بيانات العميل بما في ذلك الجلسات.")) {
      try {
        // حذف العميل من Firebase
        const clientRef = ref(db, `patients/${id}`);
        await remove(clientRef);
        
        // حذف جميع جلسات العميل
        const sessionsRef = ref(db, `sessions/${id}`);
        await remove(sessionsRef);
        
        alert("✅ تم حذف العميل بنجاح");
      } catch (err) {
        console.error("Error deleting client:", err);
        alert("❌ حدث خطأ أثناء حذف العميل: " + err.message);
      }
    }
  };

  // دالة للمقارنة بعد إزالة المسافات وتوحيد الأحرف
  const normalizeText = (text = "") =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  // فلترة العملاء حسب البحث (الاسم / الهوية / الهاتف) مع دعم الأرقام والحروف العربية والإنجليزية
  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;

    const term = normalizeText(searchTerm);

    // حقول البحث المحتملة
    const name = normalizeText(c.fullName || "");
    const idNumber = normalizeText(c.idNumber || "");
    const phone = normalizeText(c.phone || "");

    // نبحث في الاسم، رقم الهوية، ورقم الهاتف
    return (
      name.includes(term) ||
      idNumber.includes(term) ||
      phone.includes(term)
    );
  });

  return (
    <div className="container-max p-4 sm:p-6">
      {/* العنوان وزر إضافة مريض جديد */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
            📁 حافظة العملاء
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            ابحث بالاسم، رقم الهوية أو الهاتف (يدعم الحروف العربية والأرقام)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن عميل بالاسم أو رقم الهوية أو الهاتف..."
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => navigate("/add-client")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap transition"
          >
            تعبئة استمارة مريض جديد
          </button>
        </div>
      </div>

      {/* قائمة العملاء */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <ul>
          {filteredClients.length > 0 ? (
            filteredClients.map((c) => (
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
