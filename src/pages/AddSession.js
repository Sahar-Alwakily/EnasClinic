import { useState } from 'react';
import BodyMap3D from '../components/BodyMap3D';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddSession() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // التصحيح هنا: استقبل البيانات كـ patient بدلاً من client
  const patient = location.state?.patient || { 
    fullName: 'عميل تجريبي', 
    idNumber: '0000',
    phone: '0000000000'
  };

  const [sessions, setSessions] = useState([]);

  const handleSaveSession = (sessionData) => {
    setSessions(prev => [...prev, sessionData]);
    console.log('تمت إضافة جلسة:', sessionData);
  };

  return (
    <div className="container-max p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">إضافة جلسة للعميل: {patient.fullName}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          العودة
        </button>
      </div>
      
      {/* التصحيح هنا: أرسل patient كـ client للـ BodyMap3D */}
      <BodyMap3D
        client={patient}
        onSaveSession={handleSaveSession}
      />

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 text-xl">📊 ملخص الجلسات المضافة</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center">لم تتم إضافة أي جلسات بعد</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, idx) => (
              <div key={idx} className="border border-purple-200 p-4 rounded-lg bg-purple-50">
                <div className="font-bold text-purple-700">المنطقة: {session.partName}</div>
                <div className="text-sm">التاريخ: {session.date}</div>
                <div className="text-sm">المعالج: {session.therapist}</div>
                <div className="text-sm">المبلغ: {session.amount} ريال</div>
                {session.notes && (
                  <div className="text-sm mt-2">ملاحظات: {session.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}