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
        <h2 className="text-2xl font-bold">إضافة جلسة لعميلة: {patient.fullName}</h2>
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

    </div>
  );
}