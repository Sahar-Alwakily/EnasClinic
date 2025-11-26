import { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [newPayment, setNewPayment] = useState({
    patientId: '',
    amount: '',
    paymentType: 'نقدي',
    description: '',
    packageType: '',
    sessionsCount: 1,
    date: new Date().toISOString().split('T')[0]
  });

  // جلب تعاملات الدفع والمرضى
  useEffect(() => {
    const paymentsRef = ref(db, 'payments');
    const patientsRef = ref(db, 'patients');
    
    const unsubscribePayments = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const paymentsData = snapshot.val();
        const paymentsList = Object.keys(paymentsData).map(key => ({
          id: key,
          ...paymentsData[key]
        }));
        paymentsList.sort((a, b) => new Date(b.paymentDate || b.date) - new Date(a.paymentDate || a.date));
        setTransactions(paymentsList);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    });

    const unsubscribePatients = onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const patientsData = snapshot.val();
        const patientsList = Object.keys(patientsData).map(key => ({
          id: key,
          ...patientsData[key]
        }));
        setPatients(patientsList);
      }
    });

    return () => {
      unsubscribePayments();
      unsubscribePatients();
    };
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
    return transactions.reduce((sum, t) => sum + (parseInt(t.paidAmount) || parseInt(t.amount) || 0), 0);
  };

  const getTotalRemaining = () => {
    return transactions.reduce((sum, t) => sum + (parseInt(t.remainingAmount) || 0), 0);
  };

  const getTotalRevenue = () => {
    return transactions.reduce((sum, t) => sum + (parseInt(t.totalPrice) || parseInt(t.amount) || 0), 0);
  };

  const addNewPayment = async () => {
    if (!newPayment.patientId || !newPayment.amount) {
      alert('يرجى ملء الحقول الإلزامية');
      return;
    }

    try {
      const selectedPatient = patients.find(p => p.idNumber === newPayment.patientId);
      const paymentRef = push(ref(db, 'payments'));
      
      const paymentData = {
        patientId: newPayment.patientId,
        patientName: selectedPatient?.fullName || 'غير معروف',
        paidAmount: parseInt(newPayment.amount),
        paymentDate: new Date().toISOString(),
        paymentType: newPayment.paymentType,
        description: newPayment.description,
        packageType: newPayment.packageType,
        sessionsCount: parseInt(newPayment.sessionsCount),
        status: 'مكتمل',
        totalPrice: parseInt(newPayment.amount),
        remainingAmount: 0
      };

      await set(paymentRef, paymentData);

      // تحديث رصيد المريض
      const patientRef = ref(db, `patients/${newPayment.patientId}/balance`);
      const currentBalance = selectedPatient?.balance || 0;
      await set(patientRef, currentBalance + parseInt(newPayment.amount));

      // تفريغ الحقول
      setNewPayment({
        patientId: '',
        amount: '',
        paymentType: 'نقدي',
        description: '',
        packageType: '',
        sessionsCount: 1,
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowAddModal(false);
      alert('تم إضافة الدفعة بنجاح!');

    } catch (error) {
      console.error('Error adding payment:', error);
      alert('حدث خطأ أثناء إضافة الدفعة');
    }
  };

  const getPaymentTypeIcon = (type) => {
    const icons = {
      'نقدي': '💵',
      'بطاقة': '💳',
      'تحويل': '🏦'
    };
    return icons[type] || '💰';
  };

  // دالة لجلب إحصائيات الدفع من الجلسات
  const getSessionsPaymentsStats = () => {
    const sessionsPayments = [];
    let totalSessionsRevenue = 0;
    let totalSessionsPaid = 0;
    let totalSessionsRemaining = 0;

    // جلب جميع الجلسات من Firebase
    const sessionsRef = ref(db, 'sessions');
    onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionsData = snapshot.val();
        
        Object.keys(sessionsData).forEach(patientId => {
          const patientSessions = sessionsData[patientId];
          Object.keys(patientSessions).forEach(sessionId => {
            const session = patientSessions[sessionId];
            if (session.amount && session.amount !== "") {
              const amount = parseInt(session.amount) || 0;
              totalSessionsRevenue += amount;
              
              // نفترض أن المبلغ مدفوع بالكامل إذا لم يكن هناك remainingAmount
              const paid = amount - (parseInt(session.remainingAmount) || 0);
              totalSessionsPaid += paid;
              totalSessionsRemaining += (parseInt(session.remainingAmount) || 0);
              
              sessionsPayments.push({
                id: sessionId,
                patientId: patientId,
                patientName: session.clientName,
                amount: amount,
                paidAmount: paid,
                remainingAmount: (parseInt(session.remainingAmount) || 0),
                paymentDate: session.timestamp || session.date,
                paymentType: session.paymentType || 'نقدي',
                description: `جلسة ${session.partName || ''}`,
                status: (parseInt(session.remainingAmount) || 0) > 0 ? 'جزئي' : 'كامل'
              });
            }
          });
        });
      }
    });

    return {
      sessionsPayments,
      totalSessionsRevenue,
      totalSessionsPaid,
      totalSessionsRemaining
    };
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

  // احصائيات الجلسات
  const sessionsStats = getSessionsPaymentsStats();
  const allPayments = [...transactions, ...sessionsStats.sessionsPayments];
  const totalAllRevenue = getTotalRevenue() + sessionsStats.totalSessionsRevenue;
  const totalAllPaid = getTotalPaid() + sessionsStats.totalSessionsPaid;
  const totalAllRemaining = getTotalRemaining() + sessionsStats.totalSessionsRemaining;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">إدارة الدفعات</h1>
          <p className="text-gray-600 text-sm md:text-base">إدارة جميع الدفعات والمدفوعات من الجلسات والدفعات المباشرة</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{allPayments.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المعاملات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {totalAllPaid} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المدفوعات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {totalAllRemaining} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">المبالغ المتبقية</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-600">
              {totalAllRevenue} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي الإيرادات</div>
          </div>
        </div>

        {/* إحصائيات تفصيلية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">دفعات مباشرة</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">عدد المعاملات:</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <span className="font-medium text-green-600">{getTotalRevenue()} ₪</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">مدفوعات الجلسات</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">عدد الجلسات:</span>
                <span className="font-medium">{sessionsStats.sessionsPayments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <span className="font-medium text-green-600">{sessionsStats.totalSessionsRevenue} ₪</span>
              </div>
            </div>
          </div>
        </div>

        {/* زر إضافة دفعة جديدة */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <span>+</span>
            إضافة دفعة جديدة
          </button>
        </div>

        {/* جدول جميع الدفعات */}
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
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الباكج</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الوصف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allPayments.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                          {(transaction.patientName || '؟').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.patientName}</div>
                          <div className="text-xs text-gray-500">#{transaction.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(transaction.paymentDate || transaction.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{getPaymentTypeIcon(transaction.paymentType)}</span>
                        {transaction.paymentType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {transaction.paidAmount || transaction.amount} ₪
                      {transaction.remainingAmount > 0 && (
                        <div className="text-xs text-orange-600">
                          (متبقي: {transaction.remainingAmount} ₪)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.packageType || 'بدون باكج'}
                      {transaction.sessionsCount > 1 && ` (${transaction.sessionsCount} جلسات)`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'مكتمل' || transaction.status === 'كامل'
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
              {allPayments.map(transaction => (
                <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                          {(transaction.patientName || '؟').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.patientName}</div>
                          <div className="text-xs text-gray-500">#{transaction.patientId}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'مكتمل' || transaction.status === 'كامل'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">💵 المبلغ</div>
                        <div className="font-medium text-green-600">
                          {transaction.paidAmount || transaction.amount} ₪
                          {transaction.remainingAmount > 0 && (
                            <div className="text-xs text-orange-600">
                              متبقي: {transaction.remainingAmount} ₪
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">{getPaymentTypeIcon(transaction.paymentType)} نوع الدفع</div>
                        <div className="font-medium">{transaction.paymentType}</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div>📅 {new Date(transaction.paymentDate || transaction.date).toLocaleDateString('ar-SA')}</div>
                      <div>📦 {transaction.packageType || 'بدون باكج'}</div>
                      {transaction.description && <div>📝 {transaction.description}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allPayments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">💵</div>
                <p className="text-sm md:text-base">لا توجد دفعات مسجلة بعد</p>
                <p className="text-xs md:text-sm mt-1">قم بإضافة دفعة جديدة للبدء</p>
              </div>
            )}
          </div>
        </div>

        {/* مودال إضافة دفعة جديدة */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">إضافة دفعة جديدة</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المريض *</label>
                  <select
                    value={newPayment.patientId}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map(patient => (
                      <option key={patient.idNumber} value={patient.idNumber}>
                        {patient.fullName} - {patient.idNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (₪) *</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الدفع</label>
                  <select
                    value={newPayment.paymentType}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paymentType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="نقدي">نقدي</option>
                    <option value="بطاقة">بطاقة</option>
                    <option value="تحويل">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الباكج (اختياري)</label>
                  <select
                    value={newPayment.packageType}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, packageType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">بدون باكج</option>
                    <option value="fullbody">باكج الجسم كامل</option>
                    <option value="face">باكج الوجه</option>
                    <option value="laser">باكج ليزر</option>
                    <option value="custom">باكج مخصص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الجلسات</label>
                  <input
                    type="number"
                    value={newPayment.sessionsCount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, sessionsCount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وصف الدفعة (اختياري)</label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="وصف الدفعة..."
                  />
                </div>
              </div>

              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={addNewPayment}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  إضافة الدفعة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}