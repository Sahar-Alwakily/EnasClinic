import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, get } from "firebase/database";

export default function SelectClient() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    get(patientsRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('بيانات المرضى المحملة:', data);

        const patientsArray = Object.entries(data).map(([id, p]) => ({
          id,
          fullName: p.fullName || 'غير معروف',
          idNumber: p.idNumber || 'غير معروف',
          phone: p.phone || 'غير معروف',
          allergiesText: p.allergiesText || '',
          ...p
        }));

        setPatients(patientsArray.reverse());
      }
      setLoading(false);
    }).catch(error => {
      console.error('خطأ في تحميل المرضى:', error);
      setLoading(false);
    });
  }, []);

  // دالة توحيد النص مع تحسينات للعربية
  const normalizeText = (text = '') => {
    if (!text) return '';
    
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[هة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      .replace(/[ؤ]/g, 'و')
      .replace(/[ئ]/g, 'ي');
  };

  // دالة البحث الرئيسية المحسنة
  const getFilteredPatients = () => {
    if (!query.trim()) return patients;

    const term = normalizeText(query);
    
    // إذا كان البحث برقم (يحتوي على أرقام فقط)
    const isNumericSearch = /^\d+$/.test(term);
    
    return patients.filter((patient) => {
      // البحث في رقم الهوية (مطابقة جزئية)
      const normalizedId = normalizeText(patient.idNumber || '');
      if (normalizedId.includes(term)) return true;
      
      // البحث في رقم الهاتف (مطابقة جزئية)
      const normalizedPhone = normalizeText(patient.phone || '');
      if (normalizedPhone.includes(term)) return true;
      
      // البحث في الاسم (المعيار الأهم)
      const normalizedName = normalizeText(patient.fullName || '');
      
      // 1. أولاً: البحث في بداية الاسم الكامل
      if (normalizedName.startsWith(term)) return true;
      
      // 2. ثانياً: البحث في بداية أي كلمة من الاسم
      const nameWords = normalizedName.split(' ');
      const startsWithAnyWord = nameWords.some(word => word.startsWith(term));
      if (startsWithAnyWord) return true;
      
      // 3. ثالثاً: إذا كان البحث برقم، لا نبحث في الأسماء
      if (isNumericSearch) return false;
      
      // 4. رابعاً: البحث في أي جزء من الاسم (لكن مع ترجيح أقل)
      if (normalizedName.includes(term)) return true;
      
      return false;
    });
  };

  // دالة ترتيب النتائج
  const getSortedPatients = () => {
    const filtered = getFilteredPatients();
    if (!query.trim()) return filtered;
    
    const term = normalizeText(query);
    
    return [...filtered].sort((a, b) => {
      const aName = normalizeText(a.fullName || '');
      const bName = normalizeText(b.fullName || '');
      
      // 1. الأولوية: الاسم يبدأ بالكلمة المبحوثة
      const aStartsWith = aName.startsWith(term) ? 1 : 0;
      const bStartsWith = bName.startsWith(term) ? 1 : 0;
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;
      
      // 2. الأولوية: أي كلمة في الاسم تبدأ بالكلمة المبحوثة
      const aWords = aName.split(' ');
      const bWords = bName.split(' ');
      
      const aWordStarts = aWords.some(word => word.startsWith(term)) ? 1 : 0;
      const bWordStarts = bWords.some(word => word.startsWith(term)) ? 1 : 0;
      if (aWordStarts !== bWordStarts) return bWordStarts - aWordStarts;
      
      // 3. الأولوية: المطابقة في رقم الهوية أو الهاتف
      const normalizedIdA = normalizeText(a.idNumber || '');
      const normalizedIdB = normalizeText(b.idNumber || '');
      const normalizedPhoneA = normalizeText(a.phone || '');
      const normalizedPhoneB = normalizeText(b.phone || '');
      
      const aIdMatch = normalizedIdA.includes(term) ? 1 : 0;
      const bIdMatch = normalizedIdB.includes(term) ? 1 : 0;
      const aPhoneMatch = normalizedPhoneA.includes(term) ? 1 : 0;
      const bPhoneMatch = normalizedPhoneB.includes(term) ? 1 : 0;
      
      const aContactScore = aIdMatch + aPhoneMatch;
      const bContactScore = bIdMatch + bPhoneMatch;
      if (aContactScore !== bContactScore) return bContactScore - aContactScore;
      
      // 4. ترتيب أبجدي
      return aName.localeCompare(bName, 'ar');
    });
  };

  const handleSelect = (patient) => {
    console.log('المريض المختار:', patient);
    navigate('/add-session', { state: { patient } });
  };

  const sortedPatients = getSortedPatients();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl mb-2 font-bold text-center text-gray-800">اختـــــــر المــــريض</h2>
      <p className="text-sm text-gray-600 text-center mb-6">
        ابحث بالاسم، رقم الهوية أو الهاتف
      </p>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="ابحث عن مريض بالاسم أو رقم الهوية أو الهاتف..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          autoFocus
        />
        {query && (
          <div className="mt-2 text-sm text-gray-500">
            {sortedPatients.length} نتيجة لـ "<span className="font-semibold text-blue-600">{query}</span>"
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">جاري تحميل بيانات المرضى...</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {sortedPatients.length > 0 ? (
            sortedPatients.map((patient, index) => (
              <div 
                key={patient.id || patient.idNumber || index}
                className="p-4 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                onClick={() => handleSelect(patient)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-lg text-gray-900 mb-1">{patient.fullName}</div>
                    <div className="text-gray-700">رقم الهوية: {patient.idNumber}</div>
                    <div className="text-gray-700">الهاتف: {patient.phone}</div>
                    {patient.allergiesText && (
                      <div className="text-sm text-amber-600 mt-1">
                        الحساسية: {patient.allergiesText}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                      اختر
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <div className="text-lg text-gray-700 mb-2">لا توجد نتائج لـ "{query}"</div>
              <div className="text-gray-500 text-sm">
                حاول استخدام مصطلحات بحث مختلفة أو تحقق من التهجئة
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">👥</div>
              <div className="text-lg text-gray-700 mb-2">لا توجد مرضى مسجلين</div>
              <div className="text-gray-500 text-sm">
                ابدأ بإضافة مرضى جدد لظهورهم هنا
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}