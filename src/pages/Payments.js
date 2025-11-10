import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب تعاملات الدفع
  useEffect(() => {
    const paymentsRef = ref(db, 'payments');
    
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const paymentsData = snapshot.val();
        const paymentsList = Object.keys(paymentsData).map(key => ({
          id: key,
          ...paymentsData[key]
        }));
        // ترتيب من الأحدث إلى الأقدم
        paymentsList.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        setTransactions(paymentsList);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAreaName = (area) => {
    const areaNames = {
      fullbody: 'الجسم كامل',
      bikiniArea: 'منطقة البيكيني',
      abdomen: 'البطن',
      arm: 'الذراع',
      neck: 'الرقبة',
      face: 'الوجه',
      shin: 'الساق',
      hand: 'اليد',
      armpit: 'تحت الإبط',
      elbow: 'الكوع',
      feet: 'القدم',
      thighs: 'الفخذين',
      back: 'الظهر'
    };
    return areaNames[area] || area;
  };

  const getTotalPaid = () => {
    return transactions.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
  };

  const getTotalRemaining = () => {
    return transactions.reduce((sum, t) => sum + (t.remainingAmount || 0), 0);
  };

  const getTotalRevenue = () => {
    return transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">سجل الدفعات</h1>
          <p className="text-gray-600 text-sm md:text-base">جميع الدفعات المسجلة تلقائيًا من نظام الجلسات</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{transactions.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المعاملات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {getTotalPaid()} ش
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المدفوعات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {getTotalRemaining()} ش
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">المبالغ المتبقية</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-600">
              {getTotalRevenue()} ش
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي الإيرادات</div>
          </div>
        </div>

        {/* جدول الدفعات */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 border-b bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">جميع الدفعات المسجلة</h2>
          </div>

          <div className="overflow-x-auto">
            {/* جدول للشاشات الكبيرة */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المناطق</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المعالج</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">السعر الكلي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدفوع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المتبقي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(transaction.paymentDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.bodyAreas?.slice(0, 2).map(getAreaName).join('، ')}
                      {transaction.bodyAreas?.length > 2 && ' ...'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.therapist}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {transaction.totalPrice} ش
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {transaction.paidAmount} ش
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600">
                      {transaction.remainingAmount} ش
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.paymentType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'كامل' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* بطاقات للجوال */}
            <div className="md:hidden space-y-4 p-4">
              {transactions.map(transaction => (
                <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-900">{transaction.patientName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'كامل' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>📅 {new Date(transaction.paymentDate).toLocaleDateString('ar-SA')}</div>
                      <div>👨‍⚕️ {transaction.therapist}</div>
                      <div>📍 {transaction.bodyAreas?.slice(0, 2).map(getAreaName).join('، ')}</div>
                      <div>💳 {transaction.paymentType}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{transaction.totalPrice} ش</div>
                        <div className="text-xs text-gray-500">الإجمالي</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{transaction.paidAmount} ش</div>
                        <div className="text-xs text-gray-500">المدفوع</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{transaction.remainingAmount} ش</div>
                        <div className="text-xs text-gray-500">المتبقي</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">💵</div>
                <p className="text-sm md:text-base">لا توجد دفعات مسجلة بعد</p>
                <p className="text-xs md:text-sm mt-1">سيتم تسجيل الدفعات تلقائيًا عند إضافة جلسات جديدة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}