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
    "بيّوتيكا (العشر أيام الأخيرة)": false,
    "كوتان (آخر ثلاثة أشهر)": false,
    "أدوية أخرى": "",
  });
  const [dailyMedicationsExtra, setDailyMedicationsExtra] = useState({
    "منع حمل (حبوب أو غيرها)": false,
    "حبوب اكتئاب": false,
    "حبوب تهدئة": false,
    "حبوب نوم": false,
    "أخرى": "",
  });
  const [previousTreatments, setPreviousTreatments] = useState("");
  const [patientSignature, setPatientSignature] = useState("");
  const [date, setDate] = useState("");

  const renderYesNo = (label, value, setValue) => (
    <div className="mb-3">
      <label className="font-medium">{label}:</label>
      <div className="flex gap-4 mt-1">
        <label className="flex items-center gap-1">
          <input type="radio" checked={value === true} onChange={() => setValue(true)} />
          نعم
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={value === false} onChange={() => setValue(false)} />
          لا
        </label>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patientId = idNumber || `patient-${Date.now()}`;
    const formData = {
      fullName,
      idNumber,
      phone,
      birthDate,
      healthStatus,
      exercise,
      pregnancy,
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
      date,
    };

    try {
      await set(ref(db, `patients/${patientId}`), formData);
      alert("تم حفظ بيانات المريض بنجاح!");
      navigate("/add-session", { state: { patientId, clientName: fullName } });
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ البيانات");
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex justify-center">
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">استمارة تعبئة المريض قبل العلاج</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* البيانات الشخصية */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">البيانات الشخصية</h3>
            <input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border p-2 rounded w-full mb-2" />
            <input type="text" placeholder="رقم الهوية" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="border p-2 rounded w-full mb-2" />
            <input type="text" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 rounded w-full mb-2" />
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="border p-2 rounded w-full" />
          </div>

          {/* الوضع الصحي العام */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">الوضع الصحي العام</h3>
            <input type="text" placeholder="الحالة الصحية الحالية" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} className="border p-2 rounded w-full mb-2" />
            {renderYesNo("ممارسة الرياضة", exercise, setExercise)}
            {renderYesNo("الحمل", pregnancy, setPregnancy)}
          </div>

          {/* الحساسية */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">الحساسية</h3>
            <input type="text" placeholder="أنواع الحساسية" value={allergiesText} onChange={(e) => setAllergiesText(e.target.value)} className="border p-2 rounded w-full mb-2" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={allergyBread} onChange={(e) => setAllergyBread(e.target.checked)} /> خبز
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={allergyMilk} onChange={(e) => setAllergyMilk(e.target.checked)} /> حليب
              </label>
            </div>
          </div>

          {/* المكملات الغذائية والأدوية */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">المكملات الغذائية والأدوية</h3>
            {renderYesNo("مكملات غذائية", supplements, setSupplements)}
            <input type="text" placeholder="نوع المكملات" value={supplementsType} onChange={(e) => setSupplementsType(e.target.value)} className="border p-2 rounded w-full mb-2" />
            {renderYesNo("أدوية يومية", dailyMedications.medications, (val) => setDailyMedications(prev => ({ ...prev, medications: val })))}
            <input type="text" placeholder="نوع الأدوية" value={dailyMedications.type} onChange={(e) => setDailyMedications(prev => ({ ...prev, type: e.target.value }))} className="border p-2 rounded w-full mb-2" />
            {renderYesNo("مشروبات الطاقة", energyDrinks, setEnergyDrinks)}
            {renderYesNo("تدخين", smoking, setSmoking)}
          </div>

          {/* الأمراض الجلدية */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">الأمراض الجلدية</h3>
            {renderYesNo("هل تعاني من أمراض جلدية؟", skinDiseases, setSkinDiseases)}
            <input type="text" placeholder="تفاصيل الأمراض الجلدية" value={skinDetails} onChange={(e) => setSkinDetails(e.target.value)} className="border p-2 rounded w-full" />
          </div>

          {/* الأمراض المزمنة */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">الأمراض المزمنة والحالات الطبية</h3>
            {Object.keys(chronicConditions).map((key) => (
              <div key={key}>{renderYesNo(key, chronicConditions[key], (val) => setChronicConditions(prev => ({ ...prev, [key]: val })))}</div>
            ))}
          </div>

          {/* مستحضرات التجميل */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">استعمال مستحضرات التجميل والعناية الشخصية</h3>
            {Object.keys(cosmetics).map((key) => key === "أدوية أخرى" ? (
              <input key={key} type="text" placeholder="أدوية أخرى" value={cosmetics["أدوية أخرى"]} onChange={(e) => setCosmetics(prev => ({ ...prev, "أدوية أخرى": e.target.value }))} className="border p-2 rounded w-full mb-2" />
            ) : (
              <div key={key}>{renderYesNo(key, cosmetics[key], (val) => setCosmetics(prev => ({ ...prev, [key]: val })))}</div>
            ))}
          </div>

          {/* أدوية يومية إضافية */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">استعمال أدوية يومية إضافية</h3>
            {Object.keys(dailyMedicationsExtra).map((key) => key === "أخرى" ? (
              <input key={key} type="text" placeholder="أخرى" value={dailyMedicationsExtra["أخرى"]} onChange={(e) => setDailyMedicationsExtra(prev => ({ ...prev, "أخرى": e.target.value }))} className="border p-2 rounded w-full mb-2" />
            ) : (
              <div key={key}>{renderYesNo(key, dailyMedicationsExtra[key], (val) => setDailyMedicationsExtra(prev => ({ ...prev, [key]: val })))}</div>
            ))}
          </div>

          {/* العلاجات السابقة */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">عمليات سابقة أو علاجات خاصة</h3>
            <input type="text" placeholder="تفاصيل" value={previousTreatments} onChange={(e) => setPreviousTreatments(e.target.value)} className="border p-2 rounded w-full" />
          </div>

          {/* توقيع المريض والتاريخ */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">توقيع المريض والتاريخ</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="توقيع المريض" value={patientSignature} onChange={(e) => setPatientSignature(e.target.value)} className="border p-2 rounded w-full" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 rounded w-full" />
            </div>
          </div>

          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded w-full mt-2">
            حفظ الاستمارة والانتقال للجلسات
          </button>
        </form>
      </div>
    </div>
  );
}
