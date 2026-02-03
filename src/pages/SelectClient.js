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

  // دالة normalizeText المحسنة
  const normalizeText = (text = '') =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[أإآ]/g, 'ا') // توحيد حرف الألف
      .replace(/[هة]/g, 'ه') // توحيد التاء المربوطة والهاء
      .replace(/[ى]/g, 'ي'); // توحيد الياء والألف المقصورة

  // فلترة المرضى مع بحث تدريجي في الاسم
  const filteredPatients = patients.filter((patient) => {
    if (!query) return true;

    const term = normalizeText(query);
    
    // تطبيع بيانات المريض
    const name = normalizeText(patient.fullName || '');
    const idNumber = normalizeText(patient.idNumber || '');
    const phone = normalizeText(patient.phone || '');

    // 1. البحث في الاسم: أي جزء من الاسم (ليس فقط البداية)
    if (name.includes(term)) return true;
    
    // 2. البحث في رقم الهوية: مطابقة كاملة أو جزئية
    if (idNumber.includes(term)) return true;
    
    // 3. البحث في الهاتف: مطابقة كاملة أو جزئية
    if (phone.includes(term)) return true;

    return false;
  });

  // ترتيب النتائج بحيث تكون المطابقة في بداية الاسم أولاً
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const term = normalizeText(query);
    const aName = normalizeText(a.fullName);
    const bName = normalizeText(b.fullName);
    
    // إذا بدأ الاسم بالكلمة المبحوثة يأتي أولاً
    if (aName.startsWith(term) && !bName.startsWith(term)) return -1;
    if (!aName.startsWith(term) && bName.startsWith(term)) return 1;
    
    // ثم الترتيب حسب أقرب مطابقة في بداية الكلمة
    const aWords = aName.split(' ');
    const bWords = bName.split(' ');
    
    const aHasWordStart = aWords.some(word => word.startsWith(term));
    const bHasWordStart = bWords.some(word => word.startsWith(term));
    
    if (aHasWordStart && !bHasWordStart) return -1;
    if (!aHasWordStart && bHasWordStart) return 1;
    
    return 0;
  });

  const handleSelect = (patient) => {
    console.log('المريض المختار:', patient);
    navigate('/add-session', { state: { patient } });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl mb-2 font-bold text-center">اختـــــر المــــريض</h2>
      <p className="text-xs md:text-sm text-gray-500 text-center mb-4">
        ابحث بالاسم، رقم الهوية أو الهاتف - البحث في الاسم يكون تدريجياً
      </p>
      <input
        type="text"
        placeholder="ابحث عن مريض بالاسم أو رقم الهوية أو الهاتف..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-3 w-full rounded-lg mb-4 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        autoFocus
      />
      
      <div className="text-sm text-gray-500 mb-2">
        {query && (
          <span>
            {sortedPatients.length} نتيجة لـ "<span className="font-semibold">{query}</span>"
          </span>
        )}
      </div>
      
      <div className="border rounded-lg max-h-96 overflow-y-auto shadow-sm">
        {sortedPatients.map(patient => (
          <div 
            key={patient.idNumber} 
            className="p-4 cursor-pointer hover:bg-purple-50 border-b last:border-b-0 transition-colors duration-200"
            onClick={() => handleSelect(patient)}
          >
            <div className="font-semibold text-lg text-gray-800">{patient.fullName}</div>
            <div className="text-gray-600 mt-1">رقم الهوية: {patient.idNumber}</div>
            <div className="text-gray-600">الهاتف: {patient.phone}</div>
            <div className="text-gray-500 text-sm mt-1">
              {patient.allergiesText ? `الحساسية: ${patient.allergiesText}` : 'لا توجد حساسية'}
            </div>
          </div>
        ))}
        
        {sortedPatients.length === 0 && query && (
          <div className="p-8 text-gray-500 text-center">
            <div className="text-lg mb-2">😟 لا توجد نتائج</div>
            <div className="text-sm">جرب مصطلحات بحث أخرى أو تحقق من التهجئة</div>
          </div>
        )}
        
        {!query && patients.length > 0 && (
          <div className="p-4 text-gray-500 text-center">
            ابدأ بالكتابة للبحث عن مريض
            <div className="text-xs mt-1">عدد المرضى المسجلين: {patients.length}</div>
          </div>
        )}
        
        {!query && patients.length === 0 && (
          <div className="p-4 text-gray-500 text-center">
            جاري تحميل بيانات المرضى...
          </div>
        )}
      </div>
    </div>
  );
}