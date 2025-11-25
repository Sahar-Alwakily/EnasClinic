import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set } from "firebase/database";
import { db } from "../firebaseConfig";

export default function PatientForm() {
  const navigate = useNavigate();

  // الحالات لكل الحقول
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [exercise, setExercise] = useState(null);
  const [pregnancy, setPregnancy] = useState(null);
  const [menstrualCycle, setMenstrualCycle] = useState(null);
  const [allergiesText, setAllergiesText] = useState("");
  const [allergyBread, setAllergyBread] = useState(false);
  const [allergyMilk, setAllergyMilk] = useState(false);
  const [supplements, setSupplements] = useState(false);
  const [supplementsType, setSupplementsType] = useState("");
  const [dailyMedications, setDailyMedications] = useState({ medications: false, type: "" });
  const [energyDrinks, setEnergyDrinks] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [skinDiseases, setSkinDiseases] = useState(false);
  const [skinDetails, setSkinDetails] = useState("");
  const [chronicConditions, setChronicConditions] = useState({
    "ضيق نفس": false,
    "أمراض قلب": false,
    "تخثر الدم": false,
    "اضطرابات هرمونية": false,
    "غدة درقية": false,
    "أمراض جهاز المناعة": false,
    "صداع / أوجاع رأس": false,
    "صرع": false,
    "فقر دم": false,
    "ضغط دم": false,
    "الكلى": false,
    "الدرقية دم": false,
    "تكيس مبايض": false,
    "سكري": false,
    "سرطان": false,
  });
  const [cosmetics, setCosmetics] = useState({
    "صابون": false,
    "كريم ترطيب": false,
    "واقي شمس": false,
    "تقشير": false,
    "سيروم": false,
    "أدوية أخرى": "",
  });
  const [dailyMedicationsExtra, setDailyMedicationsExtra] = useState({
    "منع حمل (حبوب أو غيرها)": false,
    "حبوب اكتئاب": false,
    "حبوب تهدئة": false,
    "حبوب نوم": false,
    "انتبيّوتيكا (العشر أيام الأخيرة)": false,
    "روكوتان (آخر ثلاثة أشهر)": false,
    "أخرى": "",
  });
  const [previousTreatments, setPreviousTreatments] = useState("");
  const [patientSignature, setPatientSignature] = useState("");
  const [date, setDate] = useState("");

  // دالة لتحويل التاريخ من yyyy-mm-dd إلى dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // دالة لتحويل التاريخ من dd/mm/yyyy إلى yyyy-mm-dd
  const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const renderYesNo = (label, value, setValue, isSmall = false) => (
    <div className={`mb-3 ${isSmall ? 'bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl' : ''}`}>
      <label className="font-medium text-gray-800 text-sm mb-1 block">{label}:</label>
      <div className="flex gap-3 mt-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name={label}
            checked={value === true}
            onChange={() => setValue(true)}
            className="hidden"
          />
          <div 
            className={`relative w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              value === true 
                ? 'border-emerald-500 bg-emerald-500' 
                : 'border-gray-300 group-hover:border-emerald-400'
            }`}
            onClick={() => setValue(true)}
          >
            {value === true && (
              <div className="absolute inset-0.5 bg-white rounded-full"></div>
            )}
          </div>
          <span className="text-gray-700 text-sm group-hover:text-emerald-600 transition-colors">نعم</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name={label}
            checked={value === false}
            onChange={() => setValue(false)}
            className="hidden"
          />
          <div 
            className={`relative w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              value === false 
                ? 'border-rose-500 bg-rose-500' 
                : 'border-gray-300 group-hover:border-rose-400'
            }`}
            onClick={() => setValue(false)}
          >
            {value === false && (
              <div className="absolute inset-0.5 bg-white rounded-full"></div>
            )}
          </div>
          <span className="text-gray-700 text-sm group-hover:text-rose-600 transition-colors">لا</span>
        </label>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !phone) {
      alert("الرجاء تعبئة الحقول الإلزامية (الاسم الكامل ورقم الهاتف)");
      return;
    }

    const patientId = idNumber || `patient-${Date.now()}`;
    const formData = {
      fullName,
      idNumber,
      phone,
      birthDate: formatDateToDDMMYYYY(birthDate), // تحويل تنسيق التاريخ
      healthStatus,
      exercise,
      pregnancy,
      menstrualCycle,
      allergiesText,
      allergyBread,
      allergyMilk,
      supplements,
      supplementsType,
      dailyMedications,
      energyDrinks,
      smoking,
      skinDiseases,
      skinDetails,
      chronicConditions,
      cosmetics,
      dailyMedicationsExtra,
      previousTreatments,
      patientSignature,
      date: formatDateToDDMMYYYY(date), // تحويل تنسيق التاريخ
      createdAt: new Date().toISOString(),
    };

    try {
      await set(ref(db, `patients/${patientId}`), formData);
      alert("تم حفظ بيانات المريض بنجاح!");
      navigate("/add-session", { state: { patientId, clientName: fullName } });
    } catch (err) {
      console.error("Firebase Error:", err);
      alert("حدث خطأ أثناء حفظ البيانات: " + err.message);
    }
  };

  const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-base">{icon}</span>
      </div>
      <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        {title}
      </h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 p-0.5 rounded-xl mb-4 shadow-lg">
            <div className="bg-white rounded-lg px-6 py-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                استمارة المريض
              </h1>
              <p className="text-gray-600 mt-1 text-sm">نظام إدارة بيانات المرضى المتكامل</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* البيانات الشخصية */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="البيانات الشخصية" icon="👤" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                <input 
                  type="text" 
                  placeholder="أدخل الاسم الكامل..." 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white/50 text-sm"
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">رقم الهوية</label>
                <input 
                  type="text" 
                  placeholder="رقم الهوية..." 
                  value={idNumber} 
                  onChange={(e) => setIdNumber(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                <input 
                  type="text" 
                  placeholder="رقم الهاتف..." 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white/50 text-sm"
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                <input 
                  type="date" 
                  value={birthDate} 
                  onChange={(e) => setBirthDate(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all duration-200 bg-white/50 text-sm"
                />
                {birthDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    التنسيق: {formatDateToDDMMYYYY(birthDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* باقي المكونات بدون تغيير */}
          {/* الوضع الصحي العام */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="الوضع الصحي العام" icon="💊" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">الحالة الصحية الحالية</label>
                <input 
                  type="text" 
                  placeholder="وصف الحالة الصحية..." 
                  value={healthStatus} 
                  onChange={(e) => setHealthStatus(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white/50 text-sm"
                />
              </div>
              <div className="space-y-3">
                {renderYesNo("ممارسة الرياضة", exercise, setExercise)}
                {renderYesNo("الحمل", pregnancy, setPregnancy)}
                {renderYesNo("انتظام الدورة الشهرية", menstrualCycle, setMenstrualCycle)}
              </div>
            </div>
          </div>

          {/* الحساسية */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="الحساسية" icon="⚠️" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">أنواع الحساسية</label>
                <input 
                  type="text" 
                  placeholder="اذكر أنواع الحساسية..." 
                  value={allergiesText} 
                  onChange={(e) => setAllergiesText(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-white/50 text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">حساسيات شائعة</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allergyBread}
                      onChange={(e) => setAllergyBread(e.target.checked)}
                      className="hidden"
                    />
                    <div 
                      className={`relative w-4 h-4 rounded border transition-all duration-200 ${
                        allergyBread 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-gray-300 group-hover:border-amber-400'
                      }`}
                      onClick={() => setAllergyBread(!allergyBread)}
                    >
                      {allergyBread && (
                        <div className="absolute inset-0.5 bg-white rounded-sm"></div>
                      )}
                    </div>
                    <span className="text-gray-700 text-sm group-hover:text-amber-600 transition-colors">حساسية الخبز</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allergyMilk}
                      onChange={(e) => setAllergyMilk(e.target.checked)}
                      className="hidden"
                    />
                    <div 
                      className={`relative w-4 h-4 rounded border transition-all duration-200 ${
                        allergyMilk 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-gray-300 group-hover:border-amber-400'
                      }`}
                      onClick={() => setAllergyMilk(!allergyMilk)}
                    >
                      {allergyMilk && (
                        <div className="absolute inset-0.5 bg-white rounded-sm"></div>
                      )}
                    </div>
                    <span className="text-gray-700 text-sm group-hover:text-amber-600 transition-colors">حساسية الحليب</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* باقي الأقسام تبقى كما هي بدون تغيير */}
          {/* ... */}

          {/* توقيع المريض والتاريخ */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="التوقيع والموافقة" icon="✍️" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">توقيع المريض</label>
                <input 
                  type="text" 
                  placeholder="التوقيع..." 
                  value={patientSignature} 
                  onChange={(e) => setPatientSignature(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200 bg-white/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all duration-200 bg-white/50 text-sm"
                />
                {date && (
                  <p className="text-xs text-gray-500 mt-1">
                    التنسيق: {formatDateToDDMMYYYY(date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2 text-sm"
            >
              <span>💾</span>
              حفظ البيانات والمتابعة للجلسات
              <span>🚀</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}