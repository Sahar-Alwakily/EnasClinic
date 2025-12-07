/* ----------- EDIT PATIENT MODERN UI -------------- */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

export default function EditPatient() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId, patient: initialPatient } = location.state || {};

  const [patient, setPatient] = useState(initialPatient || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!patientId) {
      navigate("/customers");
      return;
    }
  }, [patientId, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPatient(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setPatient(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleChronicConditionChange = (condition, value) => {
    setPatient(prev => ({
      ...prev,
      chronicConditions: {
        ...prev.chronicConditions,
        [condition]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!patientId) return;

    setIsSaving(true);
    try {
      const patientRef = ref(db, `patients/${patientId}`);
      await update(patientRef, patient);
      
      alert("تم تحديث بيانات المريض بنجاح!");
      navigate(-1); // العودة للصفحة السابقة
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSaving(false);
    }
  };

  const chronicConditions = [
    { id: "diabetes", label: "السكري" },
    { id: "bloodPressure", label: "ضغط الدم" },
    { id: "heartDisease", label: "أمراض القلب" },
    { id: "thyroid", label: "الغدة الدرقية" },
    { id: "anemia", label: "فقر الدم" },
    { id: "epilepsy", label: "الصرع" },
    { id: "cancer", label: "السرطان" },
    { id: "kidney", label: "أمراض الكلى" },
    { id: "headache", label: "الصداع المزمن" },
    { id: "pcod", label: "متلازمة تكيس المبايض" },
    { id: "shortBreath", label: "ضيق التنفس" },
    { id: "hormoneDisorder", label: "اضطرابات هرمونية" },
    { id: "immuneDisease", label: "أمراض المناعة" },
    { id: "bloodClot", label: "تجلط الدم" }
  ];

  const dailyMedicationsExtra = [
    { id: "roaccutane", label: "روأكيوتان" },
    { id: "contraceptive", label: "مانع الحمل" },
    { id: "antidepressant", label: "مضاد الاكتئاب" },
    { id: "sedative", label: "مهدئ" },
    { id: "sleepingPill", label: "حبوب نوم" },
    { id: "biotica", label: "مضاد حيوي" }
  ];

  const cosmetics = [
    { id: "moisturizer", label: "مرطب" },
    { id: "sunscreen", label: "واقي شمس" },
    { id: "serum", label: "سيروم" },
    { id: "soap", label: "صابون" },
    { id: "exfoliation", label: "مقشر" },
    { id: "roaccutane", label: "روأكيوتان (عناية)" },
    { id: "biotica", label: "مضاد حيوي (عناية)" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* HEADER */}
      <div className="bg-white shadow-md rounded-b-3xl pb-4">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-800">تعديل بيانات المريض</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl font-medium ${isSaving ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'} text-white transition`}
          >
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>

        {/* Patient Info */}
        <div className="px-4">
          <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-4 rounded-2xl shadow-xl text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-xl">
                {patient.fullName?.slice(0, 2) || "??"}
              </div>
              <div>
                <h1 className="font-bold text-xl">{patient.fullName}</h1>
                <p className="text-sm opacity-80">
                  الهوية: {patient.idNumber} • الهاتف: {patient.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className="p-4 space-y-4">
        {/* المعلومات الأساسية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">المعلومات الأساسية</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-700 text-sm mb-1">الاسم الكامل</label>
              <input
                type="text"
                name="fullName"
                value={patient.fullName || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm mb-1">رقم الهوية</label>
                <input
                  type="text"
                  name="idNumber"
                  value={patient.idNumber || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  name="phone"
                  value={patient.phone || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  name="birthDate"
                  value={patient.birthDate || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">تاريخ التسجيل</label>
                <input
                  type="date"
                  name="date"
                  value={patient.date || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* الحساسية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الحساسية</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allergyBread"
                name="allergyBread"
                checked={patient.allergyBread || false}
                onChange={handleInputChange}
                className="w-5 h-5"
              />
              <label htmlFor="allergyBread" className="text-gray-700">حساسية الخبز</label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allergyMilk"
                name="allergyMilk"
                checked={patient.allergyMilk || false}
                onChange={handleInputChange}
                className="w-5 h-5"
              />
              <label htmlFor="allergyMilk" className="text-gray-700">حساسية الحليب</label>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm mb-1">حساسيات أخرى</label>
              <textarea
                name="allergiesText"
                value={patient.allergiesText || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="2"
                placeholder="أي حساسيات أخرى..."
              />
            </div>
          </div>
        </div>

        {/* الصحة العامة */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الصحة العامة</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-700 text-sm mb-1">الحالة الصحية</label>
              <input
                type="text"
                name="healthStatus"
                value={patient.healthStatus || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="وصف الحالة الصحية"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "exercise", label: "ممارسة الرياضة" },
                { id: "pregnancy", label: "الحمل" },
                { id: "menstrualCycle", label: "الدورة الشهرية" },
                { id: "smoking", label: "التدخين" },
                { id: "energyDrinks", label: "مشروبات الطاقة" },
                { id: "supplements", label: "المكملات الغذائية" }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={item.id}
                    name={item.id}
                    checked={patient[item.id] || false}
                    onChange={handleInputChange}
                    className="w-5 h-5"
                  />
                  <label htmlFor={item.id} className="text-gray-700">{item.label}</label>
                </div>
              ))}
            </div>
            
            {patient.supplements && (
              <div>
                <label className="block text-gray-700 text-sm mb-1">نوع المكملات</label>
                <input
                  type="text"
                  name="supplementsType"
                  value={patient.supplementsType || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="أوميغا 3، فيتامينات، إلخ..."
                />
              </div>
            )}
          </div>
        </div>

        {/* الأمراض المزمنة */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الأمراض المزمنة</h2>
          <div className="grid grid-cols-2 gap-3">
            {chronicConditions.map(condition => (
              <div key={condition.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={condition.id}
                  checked={patient.chronicConditions?.[condition.id] || false}
                  onChange={(e) => handleChronicConditionChange(condition.id, e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor={condition.id} className="text-gray-700">{condition.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* الأمراض الجلدية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الأمراض الجلدية</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="skinDiseases"
                name="skinDiseases"
                checked={patient.skinDiseases || false}
                onChange={handleInputChange}
                className="w-5 h-5"
              />
              <label htmlFor="skinDiseases" className="text-gray-700">أمراض جلدية</label>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm mb-1">تفاصيل الجلد</label>
              <textarea
                name="skinDetails"
                value={patient.skinDetails || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="2"
                placeholder="تفاصيل الأمراض الجلدية..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm mb-1">العلاجات السابقة</label>
              <textarea
                name="previousTreatments"
                value={patient.previousTreatments || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="2"
                placeholder="العلاجات السابقة..."
              />
            </div>
          </div>
        </div>

        {/* الأدوية اليومية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الأدوية اليومية</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="dailyMedications"
                name="dailyMedications.medications"
                checked={patient.dailyMedications?.medications || false}
                onChange={handleInputChange}
                className="w-5 h-5"
              />
              <label htmlFor="dailyMedications" className="text-gray-700">أدوية يومية</label>
            </div>
            
            {patient.dailyMedications?.medications && (
              <div>
                <label className="block text-gray-700 text-sm mb-1">نوع الأدوية</label>
                <input
                  type="text"
                  name="dailyMedications.type"
                  value={patient.dailyMedications?.type || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثلاً: أدوية ضغط، سكري، إلخ..."
                />
              </div>
            )}
          </div>
        </div>

        {/* الأدوية الإضافية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">الأدوية الإضافية</h2>
          <div className="grid grid-cols-2 gap-3">
            {dailyMedicationsExtra.map(med => (
              <div key={med.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`extra_${med.id}`}
                  checked={patient.dailyMedicationsExtra?.[med.id] || false}
                  onChange={(e) => {
                    setPatient(prev => ({
                      ...prev,
                      dailyMedicationsExtra: {
                        ...prev.dailyMedicationsExtra,
                        [med.id]: e.target.checked
                      }
                    }));
                  }}
                  className="w-5 h-5"
                />
                <label htmlFor={`extra_${med.id}`} className="text-gray-700">{med.label}</label>
              </div>
            ))}
          </div>
          
          <div className="mt-3">
            <label className="block text-gray-700 text-sm mb-1">أدوية أخرى</label>
            <input
              type="text"
              name="dailyMedicationsExtra.other"
              value={patient.dailyMedicationsExtra?.other || ""}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="أدوية إضافية أخرى..."
            />
          </div>
        </div>

        {/* منتجات العناية */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-purple-700 font-bold mb-4">منتجات العناية المستخدمة</h2>
          <div className="grid grid-cols-2 gap-3">
            {cosmetics.map(cosmetic => (
              <div key={cosmetic.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`cosmetic_${cosmetic.id}`}
                  checked={patient.cosmetics?.[cosmetic.id] || false}
                  onChange={(e) => {
                    setPatient(prev => ({
                      ...prev,
                      cosmetics: {
                        ...prev.cosmetics,
                        [cosmetic.id]: e.target.checked
                      }
                    }));
                  }}
                  className="w-5 h-5"
                />
                <label htmlFor={`cosmetic_${cosmetic.id}`} className="text-gray-700">{cosmetic.label}</label>
              </div>
            ))}
          </div>
          
          {patient.cosmetics?.otherMedications && (
            <div className="mt-3">
              <label className="block text-gray-700 text-sm mb-1">أدوية عناية أخرى</label>
              <input
                type="text"
                name="cosmetics.otherMedications"
                value={patient.cosmetics?.otherMedications || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="أدوية عناية إضافية..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}