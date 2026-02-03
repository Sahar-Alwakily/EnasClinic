import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, get } from "firebase/database";

export default function SelectClient() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    get(patientsRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('بيانات المرضى المحملة:', data);

        // تحويل البيانات من object إلى array موحدة
        const patientsArray = Object.entries(data).map(([id, p]) => ({
          id,
          fullName: p.fullName || 'غير معروف',
          idNumber: p.idNumber || 'غير معروف',
          phone: p.phone || 'غير معروف',
          // إضافة جميع البيانات الأخرى التي قد تحتاجها
          ...p
        }));

        // الأحدث أولاً مثل صفحة العملاء
        setPatients(patientsArray.reverse());
      }
    });
  }, []);

  // دالة للمقارنة بعد إزالة المسافات وتوحيد الأحرف
  const normalizeText = (text = '') =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  // دالة لتوحيد الأرقام (إزالة أي رموز غير رقمية مثل - أو مسافة)
  const normalizeNumber = (value = '') =>
    value
      .toString()
      .replace(/\D/g, '');

  // فلترة المرضى حسب نص البحث (الاسم / الهوية / الهاتف)
  const filteredPatients = patients.filter((patient) => {
    if (!query) return true;

    const term = normalizeText(query);
    const termNum = normalizeNumber(query);

    const name = normalizeText(patient.fullName || '');
    const idText = normalizeText(patient.idNumber || '');
    const phoneText = normalizeText(patient.phone || '');

    const idDigits = normalizeNumber(patient.idNumber || '');
    const phoneDigits = normalizeNumber(patient.phone || '');

    return (
      // بحث نصي بالاسم: يطابق فقط من بداية الاسم
      (term && name.startsWith(term)) ||
      // بحث نصي جزئي في الهوية والهاتف
      idText.includes(term) ||
      phoneText.includes(term) ||
      // بحث رقمي خالص (يتجاهل الشرطات والمسافات)
      (termNum &&
        (idDigits.includes(termNum) || phoneDigits.includes(termNum)))
    );
  });

  const handleSelect = (patient) => {
    console.log('المريض المختار:', patient);
    navigate('/add-session', { state: { patient } });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl mb-2 font-bold text-center">اختر المريض</h2>
      <p className="text-xs md:text-sm text-gray-500 text-center mb-4">
        ابحث بالاسم، رقم الهوية أو الهاتف (يدعم الحروف العربية والأرقام مع أو بدون فواصل)
      </p>
      <input
        type="text"
        placeholder="ابحث باسم المريض أو رقم الهوية أو الهاتف"
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