import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paymentsRef = ref(db, 'payments');
    
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const paymentsData = snapshot.val();
        const paymentsList = Object.entries(paymentsData).map(([id, payment]) => ({
          id,
          ...payment
        })).sort((a, b) => {
          const dateA = new Date(a.paymentDate || 0);
          const dateB = new Date(b.paymentDate || 0);
          return dateB - dateA;
        });
        setPayments(paymentsList);
      } else {
        setPayments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💳 إدارة الدفعات</h1>
        <p className="text-gray-600">عرض جميع الدفعات المسجلة</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">لا توجد دفعات مسجلة بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {payment.patientName || "مريض غير معروف"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    #{payment.patientId || "غير محدد"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {payment.paidAmount || 0} ₪
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <span className="text-gray-600">نوع الدفع:</span>
                  <span className="mr-2 font-medium">{payment.paymentType || "غير محدد"}</span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة:</span>
                  <span className={`mr-2 font-medium ${
                    payment.status === 'مكتمل' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {payment.status || "غير محدد"}
                  </span>
                </div>
                {payment.description && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">الوصف:</span>
                    <span className="mr-2">{payment.description}</span>
                  </div>
                )}
                {payment.isPackagePayment && (
                  <div className="md:col-span-2">
                    <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      📦 دفعة من حزمة: {payment.packageName || "غير محدد"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

