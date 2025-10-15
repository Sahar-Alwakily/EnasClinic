import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, get } from "firebase/database";

export default function SelectClient() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientsData, setPatientsData] = useState({});

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    get(patientsRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPatientsData(data);
        console.log('بيانات المرضى المحملة:', data);
      }
    });
  }, []);

  useEffect(() => {
    if (!query) return setFilteredPatients([]);
    
    const results = Object.entries(patientsData)
      .filter(([id, p]) => {
        const nameMatch = p.fullName?.toLowerCase().includes(query.toLowerCase());
        const idMatch = p.idNumber?.includes(query);
        return nameMatch || idMatch;
      })
      .map(([id, p]) => ({ 
        id: id,
        fullName: p.fullName || 'غير معروف',
        idNumber: p.idNumber || 'غير معروف',
        phone: p.phone || 'غير معروف',
        // إضافة جميع البيانات الأخرى التي قد تحتاجها
        ...p
      }));
    
    setFilteredPatients(results);
  }, [query, patientsData]);

  const handleSelect = (patient) => {
    console.log('المريض المختار:', patient);
    navigate('/add-session', { state: { patient } });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl mb-6 font-bold text-center">اختر المريض</h2>
      <input
        type="text"
        placeholder="ابحث باسم المريض أو رقم الهوية"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-3 w-full rounded-lg mb-4 text-lg"
      />
      <div className="border rounded-lg max-h-96 overflow-y-auto shadow-sm">
        {filteredPatients.map(patient => (
          <div 
            key={patient.idNumber} 
            className="p-4 cursor-pointer hover:bg-purple-50 border-b last:border-b-0 transition-colors"
            onClick={() => handleSelect(patient)}
          >
            <div className="font-semibold text-lg">{patient.fullName}</div>
            <div className="text-gray-600">رقم الهوية: {patient.idNumber}</div>
            <div className="text-gray-600">الهاتف: {patient.phone}</div>
            <div className="text-gray-500 text-sm mt-1">
              {patient.allergiesText ? `الحساسية: ${patient.allergiesText}` : 'لا توجد حساسية'}
            </div>
          </div>
        ))}
        {filteredPatients.length === 0 && query && (
          <div className="p-4 text-gray-500 text-center">لا توجد نتائج</div>
        )}
        {!query && (
          <div className="p-4 text-gray-500 text-center">اكتب للبحث عن مريض</div>
        )}
      </div>
    </div>
  );
}