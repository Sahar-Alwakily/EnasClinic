import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Payments() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('partial');
  const [sessionsCount, setSessionsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'

  // جلب قائمة المرضى
  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const patientsData = snapshot.val();
        const patientsList = Object.keys(patientsData).map(key => ({
          id: key,
          ...patientsData[key]
        }));
        setPatients(patientsList);
      } else {
        setPatients([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // جلب جلسات المريض المحدد
  useEffect(() => {
    if (!selectedPatient) {
      setSessions([]);
      return;
    }

    const sessionsRef = ref(db, 'sessions');
    
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionsData = snapshot.val();
        const patientSessions = Object.keys(sessionsData)
          .map(key => ({
            id: key,
            ...sessionsData[key]
          }))
          .filter(session => session.patientId === selectedPatient);
        
        setSessions(patientSessions);
      } else {
        setSessions([]);
      }
    });

    return () => unsubscribe();
  }, [selectedPatient]);

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
        setTransactions(paymentsList);
      } else {
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateSessionPrice = async (session) => {
    if (!session.bodyAreas || session.bodyAreas.length === 0) return 0;

    try {
      const pricesRef = ref(db, 'prices');
      const snapshot = await get(pricesRef);
      
      if (snapshot.exists()) {
        const prices = snapshot.val();
        let totalPrice = 0;
        
        session.bodyAreas.forEach(area => {
          if (prices[area]) {
            totalPrice += parseInt(prices[area]);
          }
        });
        
        return totalPrice;
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    }
    
    return 0;
  };

  const handlePayment = async () => {
    if (!selectedPatient || !selectedSession || !paymentAmount) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);

    try {
      const session = sessions.find(s => s.id === selectedSession);
      if (!session) return;

      const sessionPrice = await calculateSessionPrice(session);
      const paidAmount = parseInt(paymentAmount);
      const remainingAmount = sessionPrice - paidAmount;

      // حفظ بيانات الدفع
      const paymentData = {
        patientId: selectedPatient,
        sessionId: selectedSession,
        patientName: patients.find(p => p.id === selectedPatient)?.name || 'غير معروف',
        sessionDate: session.date || 'غير معروف',
        bodyAreas: session.bodyAreas || [],
        totalPrice: sessionPrice,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentType: paymentType,
        sessionsPaid: paymentType === 'full' ? sessionsCount : 1,
        paymentDate: new Date().toISOString(),
        status: remainingAmount > 0 ? 'جزئي' : 'كامل'
      };

      const paymentRef = ref(db, `payments/${Date.now()}`);
      await update(paymentRef, paymentData);

      // تحديث حالة الجلسة
      const sessionRef = ref(db, `sessions/${selectedSession}`);
      await update(sessionRef, {
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentStatus: remainingAmount > 0 ? 'جزئي' : 'كامل',
        lastPaymentDate: new Date().toISOString()
      });

      // تفريغ الحقول
      setPaymentAmount('');
      setSelectedSession('');
      setSessionsCount(1);

      alert('تم تسجيل الدفعة بنجاح!');

    } catch (error) {
      console.error('Error processing payment:', error);
      alert('حدث خطأ أثناء تسجيل الدفعة');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">إدارة الدفعات</h1>
          <p className="text-gray-600 text-sm md:text-base">تتبع دفعات العملاء والمبالغ المتبقية</p>
        </div>

        {/* تبويبات للجوال */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-4 px-2 text-center font-medium text-sm md:text-base ${
                activeTab === 'new'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💳 دفعة جديدة
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-2 text-center font-medium text-sm md:text-base ${
                activeTab === 'history'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 سجل الدفعات
            </button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{patients.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي العملاء</div>
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
            <div className="text-lg md:text-2xl font-bold text-purple-600">{transactions.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">عدد المعاملات</div>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div className="space-y-6">
          {/* تبويب الدفعة الجديدة */}
          {activeTab === 'new' && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">تسجيل دفعة جديدة</h2>
              
              <div className="space-y-4">
                {/* اختيار المريض */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختيار المريض
                  </label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* اختيار الجلسة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختيار الجلسة
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    disabled={!selectedPatient}
                  >
                    <option value="">اختر الجلسة</option>
                    {sessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.date} - {session.bodyAreas?.map(getAreaName).join('، ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* نوع الدفع وعدد الجلسات */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الدفع
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    >
                      <option value="partial">دفعة جزئية</option>
                      <option value="full">دفعة كاملة</option>
                    </select>
                  </div>

                  {paymentType === 'full' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد الجلسات المدفوعة
                      </label>
                      <input
                        type="number"
                        value={sessionsCount}
                        onChange={(e) => setSessionsCount(e.target.value)}
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  )}
                </div>

                {/* مبلغ الدفع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ المدفوع (شيقل)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="أدخل المبلغ"
                    className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* زر الإضافة */}
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center text-sm md:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    'تسجيل الدفعة'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* تبويب سجل الدفعات */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 md:p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">سجل الدفعات</h2>
              </div>

              <div className="overflow-x-auto">
                {/* جدول للشاشات الكبيرة */}
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الجلسة</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المناطق</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">السعر الكلي</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدفوع</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المتبقي</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{transaction.patientName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.sessionDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {transaction.bodyAreas?.slice(0, 2).map(getAreaName).join('، ')}
                          {transaction.bodyAreas?.length > 2 && ' ...'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {transaction.totalPrice} ش
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          {transaction.paidAmount} ش
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                          {transaction.remainingAmount} ش
                        </td>
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
                          <div>📅 {transaction.sessionDate}</div>
                          <div>📍 {transaction.bodyAreas?.slice(0, 2).map(getAreaName).join('، ')}</div>
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
                    <p className="text-xs md:text-sm mt-1">قم بتسجيل دفعة جديدة للبدء</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}