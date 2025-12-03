import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set } from "firebase/database";
import { db } from "../firebaseConfig";
import SignatureCanvas from 'react-signature-canvas';

export default function PatientForm() {
  const navigate = useNavigate();
  
  // مراجع للتوقيعات
  const clientSigRef = useRef();

  // الحالات لكل الحقول - متوافقة مع Firebase
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
    "shortBreath": false,
    "heartDisease": false,
    "bloodClot": false,
    "hormoneDisorder": false,
    "thyroid": false,
    "immuneDisease": false,
    "headache": false,
    "epilepsy": false,
    "anemia": false,
    "bloodPressure": false,
    "kidney": false,
    "diabetes": false,
    "pcod": false,
    "cancer": false,
  });
  const [cosmetics, setCosmetics] = useState({
    "soap": false,
    "moisturizer": false,
    "sunscreen": false,
    "exfoliation": false,
    "serum": false,
    "otherMedications": "",
  });
  const [dailyMedicationsExtra, setDailyMedicationsExtra] = useState({
    "contraceptive": false,
    "antidepressant": false,
    "sedative": false,
    "sleepingPill": false,
    "biotica": false,
    "roaccutane": false,
    "other": "",
  });
  const [previousTreatments, setPreviousTreatments] = useState("");
  const [vellusHairConsent, setVellusHairConsent] = useState(false);
  const [date, setDate] = useState("");
  const [clientSignatureData, setClientSignatureData] = useState("");

  // دالة محسنة لأزرار نعم/لا
  const renderYesNo = (label, value, setValue, isSmall = false) => (
    <div className={`mb-3 ${isSmall ? 'bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl' : ''}`}>
      <label className="font-medium text-gray-800 text-sm mb-1 block">{label}:</label>
      <div className="flex gap-3 mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`${label}-yesno`}
            checked={value === true}
            onChange={() => setValue(true)}
            className="w-4 h-4 text-emerald-500 focus:ring-emerald-400"
          />
          <span className="text-gray-700 text-sm">نعم</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`${label}-yesno`}
            checked={value === false}
            onChange={() => setValue(false)}
            className="w-4 h-4 text-rose-500 focus:ring-rose-400"
          />
          <span className="text-gray-700 text-sm">لا</span>
        </label>
      </div>
    </div>
  );

  // دالة محسنة للـ checkboxes
  const renderCheckbox = (label, checked, setChecked, isSmall = false) => (
    <label className={`flex items-center gap-2 cursor-pointer ${isSmall ? 'text-sm' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-4 h-4 text-amber-500 focus:ring-amber-400 rounded"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );

  // دالة لمسح توقيع العميلة
  const clearClientSignature = () => {
    clientSigRef.current.clear();
    setClientSignatureData("");
  };

  // دالة لحفظ التوقيع عند الانتهاء
  const handleClientSignatureEnd = () => {
    if (clientSigRef.current.isEmpty()) {
      setClientSignatureData("");
    } else {
      setClientSignatureData(clientSigRef.current.toDataURL());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !phone) {
      alert("الرجاء تعبئة الحقول الإلزامية (الاسم الكامل ورقم الهاتف)");
      return;
    }

    if (!vellusHairConsent) {
      alert("الرجاء الموافقة على إقرار الشعر الوبري");
      return;
    }

    // الحصول على بيانات التوقيع
    const finalClientSignature = clientSigRef.current.isEmpty() 
      ? "" 
      : clientSigRef.current.toDataURL();

    const patientId = idNumber || `patient-${Date.now()}`;
    
    // البيانات متوافقة مع هيكل Firebase
    const formData = {
      fullName,
      idNumber,
      phone,
      birthDate,
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
      vellusHairConsent,
      clientSignature: finalClientSignature,
      date,
      createdAt: new Date().toISOString(),
    };

    try {
      await set(ref(db, `patients/${patientId}`), formData);
      alert("تم حفظ بيانات العميلة بنجاح!");
      navigate("/dashboard");
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

  // خرائط للعرض بالعربية مع الحفاظ على المفاتيح الإنجليزية
  const chronicConditionsMap = {
    "shortBreath": "ضيق نفس",
    "heartDisease": "أمراض قلب", 
    "bloodClot": "تخثر الدم",
    "hormoneDisorder": "اضطرابات هرمونية",
    "thyroid": "غدة درقية",
    "immuneDisease": "أمراض جهاز المناعة",
    "headache": "صداع / أوجاع رأس",
    "epilepsy": "صرع",
    "anemia": "فقر دم",
    "bloodPressure": "ضغط دم",
    "kidney": "الكلى",
    "diabetes": "سكري",
    "pcod": "تكيس مبايض",
    "cancer": "سرطان"
  };

  const cosmeticsMap = {
    "soap": "صابون",
    "moisturizer": "كريم ترطيب", 
    "sunscreen": "واقي شمس",
    "exfoliation": "تقشير",
    "serum": "سيروم",
    "otherMedications": "أدوية أخرى"
  };

  const dailyMedicationsExtraMap = {
    "contraceptive": "منع حمل (حبوب أو غيرها)",
    "antidepressant": "حبوب اكتئاب",
    "sedative": "حبوب تهدئة", 
    "sleepingPill": "حبوب نوم",
    "biotica": "انتبيّوتيكا (العشر أيام الأخيرة)",
    "roaccutane": "روكوتان (آخر ثلاثة أشهر)",
    "other": "أخرى"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 p-0.5 rounded-xl mb-4 shadow-lg">
            <div className="bg-white rounded-lg px-6 py-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                استمارة العميلة
              </h1>
              <p className="text-gray-600 mt-1 text-sm">نظام إدارة بيانات العملاء المتكامل</p>
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
              </div>
            </div>
          </div>

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
                <div className="flex flex-col gap-3">
                  {renderCheckbox("حساسية الخبز", allergyBread, setAllergyBread)}
                  {renderCheckbox("حساسية الحليب", allergyMilk, setAllergyMilk)}
                </div>
              </div>
            </div>
          </div>

          {/* المكملات الغذائية والأدوية */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="المكملات الغذائية والأدوية" icon="💊" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderYesNo("مكملات غذائية", supplements, setSupplements)}
                {supplements && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">نوع المكملات</label>
                    <input 
                      type="text" 
                      placeholder="نوع المكملات..." 
                      value={supplementsType} 
                      onChange={(e) => setSupplementsType(e.target.value)} 
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/50 text-sm"
                    />
                  </div>
                )}
                {renderYesNo("أدوية يومية", dailyMedications.medications, (val) => setDailyMedications(prev => ({ ...prev, medications: val })))}
                {dailyMedications.medications && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">نوع الأدوية</label>
                    <input 
                      type="text" 
                      placeholder="نوع الأدوية..." 
                      value={dailyMedications.type} 
                      onChange={(e) => setDailyMedications(prev => ({ ...prev, type: e.target.value }))} 
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/50 text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {renderYesNo("مشروبات الطاقة", energyDrinks, setEnergyDrinks)}
                {renderYesNo("تدخين", smoking, setSmoking)}
              </div>
            </div>
          </div>

          {/* الأمراض الجلدية */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="الأمراض الجلدية" icon="🔬" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {renderYesNo("هل تعاني من أمراض جلدية؟", skinDiseases, setSkinDiseases)}
              </div>
              {skinDiseases && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">تفاصيل الأمراض الجلدية</label>
                  <input 
                    type="text" 
                    placeholder="وصف الأمراض الجلدية..." 
                    value={skinDetails} 
                    onChange={(e) => setSkinDetails(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200 bg-white/50 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* الأمراض المزمنة */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="الأمراض المزمنة والحالات الطبية" icon="❤️" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.keys(chronicConditions).map((key) => (
                <div key={key} className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                  {renderYesNo(chronicConditionsMap[key], chronicConditions[key], (val) => setChronicConditions(prev => ({ ...prev, [key]: val })), true)}
                </div>
              ))}
            </div>
          </div>

          {/* مستحضرات التجميل */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="مستحضرات التجميل والعناية" icon="💄" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(cosmetics).map((key) => key === "otherMedications" ? (
                <div key={key} className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">أدوية أخرى</label>
                  <input 
                    type="text" 
                    placeholder="أدوية أخرى..." 
                    value={cosmetics["otherMedications"]} 
                    onChange={(e) => setCosmetics(prev => ({ ...prev, "otherMedications": e.target.value }))} 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white/50 text-sm"
                  />
                </div>
              ) : (
                <div key={key} className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-3 rounded-xl border border-purple-100/50">
                  {renderYesNo(cosmeticsMap[key], cosmetics[key], (val) => setCosmetics(prev => ({ ...prev, [key]: val })), true)}
                </div>
              ))}
            </div>
          </div>

          {/* أدوية يومية إضافية */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="أدوية يومية إضافية" icon="🩺" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(dailyMedicationsExtra).map((key) => key === "other" ? (
                <div key={key} className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">أخرى</label>
                  <input 
                    type="text" 
                    placeholder="أدوية أخرى..." 
                    value={dailyMedicationsExtra["other"]} 
                    onChange={(e) => setDailyMedicationsExtra(prev => ({ ...prev, "other": e.target.value }))} 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/50 text-sm"
                  />
                </div>
              ) : (
                <div key={key} className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-3 rounded-xl border border-emerald-100/50">
                  {renderYesNo(dailyMedicationsExtraMap[key], dailyMedicationsExtra[key], (val) => setDailyMedicationsExtra(prev => ({ ...prev, [key]: val })), true)}
                </div>
              ))}
            </div>
          </div>

          {/* العلاجات السابقة */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="العلاجات والعمليات السابقة" icon="🏥" />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">وصف العمليات أو العلاجات السابقة</label>
              <textarea 
                placeholder="وصف العمليات أو العلاجات السابقة..." 
                value={previousTreatments} 
                onChange={(e) => setPreviousTreatments(e.target.value)} 
                rows="3"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 bg-white/50 text-sm resize-none"
              />
            </div>
          </div>

          {/* قسم الشعر الوبري */}
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-rose-200/50">
            <SectionHeader title="قسم الشعر الوبري" icon="⚠️" />
            <div className="bg-white/90 rounded-xl p-5 border border-rose-300/30 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full shadow-md">
                  <span className="text-white text-xl font-bold">!</span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-lg text-gray-800">
                    إقرار خاص بالشعر الوبري
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    أقر أنني أريد إزالة الشعر الوبري من جميع أنحاء الجسم يشمل الوجه والرقبة والبطن والظهر والذراع
                  </p>
                  <p className="text-rose-600 font-semibold text-sm leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-200 mt-2">
                    رغم علمي ومعرفتي من قبل الأخصائية أن الشعر الوبري إذا تم إزالته بالليزر سوف يتحفز ويصبح أكثر من قبل حتى لو تم عمله من قبل أو بمراكز أخرى
                  </p>
                </div>

                <div className="w-full max-w-sm pt-4 border-t border-rose-200/50">
                  <label className="flex items-center justify-center gap-3 cursor-pointer p-3 bg-white rounded-xl border border-rose-300/50 hover:border-rose-400 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={vellusHairConsent}
                      onChange={(e) => setVellusHairConsent(e.target.checked)}
                      required
                      className="w-5 h-5 text-rose-500 focus:ring-rose-400 rounded"
                    />
                    <span className="font-medium text-gray-800 text-sm">
                      ✓ أوافق على هذا الإقرار وأتحمل مسؤولية النتيجة
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* توقيع العميلة الإلكتروني */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
            <SectionHeader title="توقيع العميلة الإلكتروني" icon="✍️" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">التوقيع الإلكتروني للعميلة</label>
                    <div className="bg-white rounded-lg border border-gray-300 p-3">
                      <SignatureCanvas
                        ref={clientSigRef}
                        penColor="#7c3aed"
                        backgroundColor="#f8fafc"
                        canvasProps={{
                          width: 400,
                          height: 200,
                          className: 'sig-canvas w-full rounded-lg border border-gray-200'
                        }}
                        onEnd={handleClientSignatureEnd}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={clearClientSignature}
                        className="px-4 py-2 text-sm bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors font-medium"
                      >
                        🗑️ مسح التوقيع
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        قم بالتوقيع في المربع أعلاه باستخدام الماوس أو الإصبع
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ التوقيع</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* معاينة التوقيع */}
              {clientSignatureData && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-dashed border-purple-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xl font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-purple-700 text-lg">توقيع إلكتروني معتمد</p>
                        <p className="text-gray-600 text-sm">تم تسجيل توقيع العميلة بنجاح</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="inline-block bg-white/80 p-3 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-500 mb-1">العميلة:</p>
                        <p className="text-sm font-bold text-gray-800">{fullName || "غير محدد"}</p>
                        <p className="text-xs text-gray-500 mt-2">التاريخ: {date || "غير محدد"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* عرض مصغر للتوقيع */}
                  <div className="mt-4 pt-4 border-t border-purple-200/50">
                    <p className="text-xs text-gray-600 mb-2">معاينة التوقيع:</p>
                    <div className="bg-white p-2 rounded-lg border border-gray-300 inline-block">
                      <img 
                        src={clientSignatureData} 
                        alt="توقيع العميلة" 
                        className="h-12 w-auto opacity-80"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* تحذير إذا لم يتم التوقيع */}
              {!clientSignatureData && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">⚠️</span>
                    <p className="text-sm text-amber-700">
                      الرجاء التوقيع في المربع أعلاه للموافقة على جميع المعلومات المقدمة
                    </p>
                  </div>
                </div>
              )}
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