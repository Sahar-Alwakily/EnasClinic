import { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Payments() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    patientId: '',
    amount: '',
    paymentType: 'نقدي',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // جلب المرضى وجلساتهم
  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const sessionsRef = ref(db, 'sessions');
    
    const unsubscribePatients = onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const patientsData = snapshot.val();
        const patientsList = Object.keys(patientsData).map(key => ({
          id: key,
          ...patientsData[key]
        }));
        
        // جلب الجلسات لكل مريض
        const unsubscribeSessions = onValue(sessionsRef, (sessionsSnapshot) => {
          if (sessionsSnapshot.exists()) {
            const sessionsData = sessionsSnapshot.val();
            
            // حساب المدفوعات والمديونيات لكل مريض - مصحح
            const patientsWithPayments = patientsList.map(patient => {
              const patientSessions = sessionsData[patient.idNumber] || {};
              const sessionsArray = Object.values(patientSessions);
              
              let totalSessionsAmount = 0;
              let totalPaid = 0;
              let totalRemaining = 0;
              
              sessionsArray.forEach(session => {
                const sessionAmount = parseInt(session.amount) || 0;
                const sessionRemaining = parseInt(session.remainingAmount) || sessionAmount;
                const sessionPaid = sessionAmount - sessionRemaining;
                
                totalSessionsAmount += sessionAmount;
                totalPaid += sessionPaid;
                totalRemaining += sessionRemaining;
              });
              
              return {
                ...patient,
                totalSessionsAmount,
                totalPaid,
                totalRemaining,
                sessionsCount: sessionsArray.length
              };
            });
            
            setPatients(patientsWithPayments);
          } else {
            setPatients(patientsList.map(patient => ({
              ...patient,
              totalSessionsAmount: 0,
              totalPaid: 0,
              totalRemaining: 0,
              sessionsCount: 0
            })));
          }
          setLoading(false);
        });
        
        return () => unsubscribeSessions();
      } else {
        setPatients([]);
        setLoading(false);
      }
    });

    return () => unsubscribePatients();
  }, []);

  // إضافة دفعة جديدة لمريض - مصحح
  const addNewPayment = async () => {
    if (!newPayment.patientId || !newPayment.amount) {
      alert('يرجى ملء الحقول الإلزامية');
      return;
    }

    try {
      const selectedPatient = patients.find(p => p.idNumber === newPayment.patientId);
      const paymentAmount = parseInt(newPayment.amount);
      
      if (paymentAmount > selectedPatient.totalRemaining) {
        alert(`المبلغ المدخل (${paymentAmount} ₪) أكبر من المبلغ المتبقي (${selectedPatient.totalRemaining} ₪)`);
        return;
      }
      
      // حفظ الدفعة في payments
      const paymentRef = push(ref(db, 'payments'));
      const paymentData = {
        patientId: newPayment.patientId,
        patientName: selectedPatient?.fullName || 'غير معروف',
        paidAmount: paymentAmount,
        paymentDate: new Date().toISOString(),
        paymentType: newPayment.paymentType,
        description: newPayment.description,
        status: 'مكتمل',
        previousRemaining: selectedPatient.totalRemaining,
        newRemaining: selectedPatient.totalRemaining - paymentAmount
      };

      await set(paymentRef, paymentData);

      // تحديث الجلسات - خصم المبلغ من المتبقي بشكل صحيح
      const sessionsRef = ref(db, `sessions/${newPayment.patientId}`);
      onValue(sessionsRef, (snap) => {
        if (snap.exists()) {
          const sessionsData = snap.val();
          let remainingToDeduct = paymentAmount;
          
          // ترتيب الجلسات من الأقدم إلى الأحدث
          const sortedSessions = Object.entries(sessionsData)
            .sort(([,a], [,b]) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date));
          
          for (const [sessionId, session] of sortedSessions) {
            if (remainingToDeduct <= 0) break;
            
            const currentRemaining = parseInt(session.remainingAmount) || parseInt(session.amount) || 0;
            
            if (currentRemaining > 0) {
              const deductAmount = Math.min(remainingToDeduct, currentRemaining);
              const newRemaining = currentRemaining - deductAmount;
              remainingToDeduct -= deductAmount;
              
              console.log(`خصم ${deductAmount} ₪ من جلسة ${sessionId}, المتبقي الجديد: ${newRemaining} ₪`);
              
              // تحديث الجلسة
              set(ref(db, `sessions/${newPayment.patientId}/${sessionId}/remainingAmount`), newRemaining.toString());
              
              // تحديث حالة الدفع
              const paymentStatus = newRemaining === 0 ? 'كامل' : 'جزئي';
              set(ref(db, `sessions/${newPayment.patientId}/${sessionId}/paymentStatus`), paymentStatus);
              
              // تحديث المبلغ المدفوع في الجلسة
              const currentPaid = parseInt(session.paidAmount) || 0;
              const newPaidAmount = currentPaid + deductAmount;
              set(ref(db, `sessions/${newPayment.patientId}/${sessionId}/paidAmount`), newPaidAmount.toString());
            }
          }
        }
      }, { onlyOnce: true });

      // تفريغ الحقول
      setNewPayment({
        patientId: '',
        amount: '',
        paymentType: 'نقدي',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowAddModal(false);
      alert(`تم إضافة الدفعة بنجاح! تم خصم ${paymentAmount} ₪ من المديونية`);

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

  // إحصائيات عامة
  const getTotalStats = () => {
    return patients.reduce((stats, patient) => {
      return {
        totalPatients: stats.totalPatients + 1,
        totalRevenue: stats.totalRevenue + patient.totalSessionsAmount,
        totalPaid: stats.totalPaid + patient.totalPaid,
        totalRemaining: stats.totalRemaining + patient.totalRemaining
      };
    }, { totalPatients: 0, totalRevenue: 0, totalPaid: 0, totalRemaining: 0 });
  };

  const stats = getTotalStats();

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
      <div className="max-w-7xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">إدارة المدفوعات والمديونيات</h1>
          <p className="text-gray-600 text-sm md:text-base">عرض المدفوعات والمديونيات لجميع المرضى بناءً على الجلسات</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المرضى</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-600">
              {stats.totalRevenue} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي فواتير الجلسات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {stats.totalPaid} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المدفوعات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {stats.totalRemaining} ₪
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">إجمالي المديونيات</div>
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

        {/* جدول المرضى والمدفوعات */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 border-b bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">المرضى والمدفوعات</h2>
          </div>

          <div className="overflow-x-auto">
            {/* جدول للشاشات الكبيرة */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الجلسات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجمالي الفاتورة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدفوع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المتبقي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map(patient => (
                  <tr key={patient.idNumber} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                          {(patient.fullName || '؟').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{patient.fullName}</div>
                          <div className="text-xs text-gray-500">#{patient.idNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {patient.sessionsCount}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-purple-600">
                      {patient.totalSessionsAmount} ₪
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {patient.totalPaid} ₪
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-orange-600">
                      {patient.totalRemaining} ₪
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.totalRemaining === 0 
                          ? 'bg-green-100 text-green-800' 
                          : patient.totalPaid > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.totalRemaining === 0 ? 'مدفوع بالكامل' : 
                         patient.totalPaid > 0 ? 'مدفوع جزئياً' : 
                         'غير مدفوع'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* بطاقات للجوال */}
            <div className="md:hidden space-y-4 p-4">
              {patients.map(patient => (
                <div key={patient.idNumber} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                          {(patient.fullName || '؟').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{patient.fullName}</div>
                          <div className="text-xs text-gray-500">#{patient.idNumber}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.totalRemaining === 0 
                          ? 'bg-green-100 text-green-800' 
                          : patient.totalPaid > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.totalRemaining === 0 ? 'مدفوع بالكامل' : 
                         patient.totalPaid > 0 ? 'مدفوع جزئياً' : 
                         'غير مدفوع'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">📊 الجلسات</div>
                        <div className="font-medium">{patient.sessionsCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">🧾 الفاتورة</div>
                        <div className="font-medium text-purple-600">{patient.totalSessionsAmount} ₪</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">💵 المدفوع</div>
                        <div className="font-medium text-green-600">{patient.totalPaid} ₪</div>
                      </div>
                      <div>
                        <div className="text-gray-600">📋 المتبقي</div>
                        <div className="font-medium text-orange-600">{patient.totalRemaining} ₪</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {patients.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-sm md:text-base">لا توجد بيانات مرضى</p>
                <p className="text-xs md:text-sm mt-1">سيظهر هنا بيانات المدفوعات عند إضافة جلسات للمرضى</p>
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
                        {patient.fullName} - {patient.idNumber} (متبقي: {patient.totalRemaining} ₪)
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
                    max={patients.find(p => p.idNumber === newPayment.patientId)?.totalRemaining || 0}
                  />
                  {newPayment.patientId && (
                    <p className="text-xs text-gray-500 mt-1">
                      أقصى مبلغ يمكن دفعه: {patients.find(p => p.idNumber === newPayment.patientId)?.totalRemaining || 0} ₪
                    </p>
                  )}
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