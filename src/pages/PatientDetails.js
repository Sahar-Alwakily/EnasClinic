import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebaseConfig";

export default function PatientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [newSession, setNewSession] = useState({
    date: "",
    treatment: "",
    notes: "",
  });

  useEffect(() => {
    if (!patientId) return;

    const patientRef = ref(db, `patients/${patientId}`);
    onValue(patientRef, (snapshot) => setPatient(snapshot.val()));

    const sessionsRef = ref(db, `sessions/${patientId}`);
    onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sessionsArray = Object.entries(data).map(([id, session]) => ({
        id,
        ...session,
      }));
      setSessions(sessionsArray);
    });
  }, [patientId]);

  if (!patient) return <div className="p-4">جارٍ تحميل بيانات المريض...</div>;

  const handleSessionChange = (field, value) => {
    setNewSession((prev) => ({ ...prev, [field]: value }));
  };

  const addSession = async () => {
    if (!newSession.date) return alert("أدخل تاريخ الجلسة");
    try {
      const sessionRef = push(ref(db, `sessions/${patientId}`));
      await set(sessionRef, newSession);
      alert("تم إضافة الجلسة بنجاح");
      setNewSession({ date: "", treatment: "", notes: "" });
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ الجلسة");
    }
  };

  const renderYesNo = (value) => (value ? "نعم" : "لا");

  const chronicLabels = {
    shortBreath: "ضيق نفس",
    heartDisease: "أمراض قلب",
    bloodClot: "تخثر الدم",
    hormoneDisorder: "اضطرابات هرمونية",
    thyroid: "غدة درقية",
    immuneDisease: "أمراض جهاز المناعة",
    headache: "صداع / أوجاع رأس",
    epilepsy: "صرع",
    anemia: "فقر دم",
    bloodPressure: "ضغط دم",
    pcod: "تكيس مبايض",
    diabetes: "سكري",
    cancer: "سرطان",
  };

  const cosmeticsLabels = {
    soap: "صابون",
    moisturizer: "كريم ترطيب",
    sunscreen: "واقي شمس",
    exfoliation: "تقشير",
    serum: "سيروم",
    biotica: "بيوتيكا (آخر 10 أيام)",
    roaccutane: "كوتان (آخر 3 أشهر)",
    otherMedications: "أدوية أخرى",
  };

  const dailyMedicationsExtraLabels = {
    contraceptive: "حبوب منع حمل",
    antidepressant: "حبوب اكتئاب",
    sedative: "حبوب تهدئة",
    sleepingPill: "حبوب نوم",
    other: "أخرى",
  };

  return (
    <div className="container-max p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
      >
        ← العودة للقائمة
      </button>

      <h2 className="text-2xl font-bold mb-4">{patient.fullName}</h2>

      {/* البيانات الشخصية */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">البيانات الشخصية</h3>
        <p>رقم الهوية: {patient.idNumber}</p>
        <p>رقم الهاتف: {patient.phone}</p>
        <p>تاريخ الميلاد: {patient.birthDate}</p>
      </div>

      {/* الوضع الصحي */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">الوضع الصحي</h3>
        <p>الحالة الصحية: {patient.healthStatus || "-"}</p>
        <p>ممارسة الرياضة: {renderYesNo(patient.exercise)}</p>
        <p>الحمل: {renderYesNo(patient.pregnancy)}</p>
      </div>

      {/* الحساسية */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">الحساسية</h3>
        <p>أنواع الحساسية: {patient.allergiesText || "-"}</p>
        <p>خبز: {renderYesNo(patient.allergyBread)}</p>
        <p>حليب: {renderYesNo(patient.allergyMilk)}</p>
      </div>

      {/* المكملات والأدوية */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">المكملات الغذائية والأدوية</h3>
        <p>مكملات غذائية: {renderYesNo(patient.supplements)}</p>
        <p>نوع المكملات: {patient.supplementsType || "-"}</p>
        <p>أدوية يومية: {renderYesNo(patient.dailyMedications.medications)}</p>
        <p>نوع الأدوية: {patient.dailyMedications.type || "-"}</p>
        <p>مشروبات الطاقة: {renderYesNo(patient.energyDrinks)}</p>
        <p>تدخين: {renderYesNo(patient.smoking)}</p>
      </div>

      {/* الأمراض الجلدية */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">الأمراض الجلدية</h3>
        <p>هل تعاني من أمراض جلدية؟ {renderYesNo(patient.skinDiseases)}</p>
        <p>تفاصيل الأمراض الجلدية: {patient.skinDetails || "-"}</p>
      </div>

      {/* الأمراض المزمنة */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">الأمراض المزمنة والحالات الطبية</h3>
        {Object.keys(patient.chronicConditions).map((key) => (
          <p key={key}>
            {chronicLabels[key]}: {renderYesNo(patient.chronicConditions[key])}
          </p>
        ))}
      </div>

      {/* مستحضرات التجميل */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">مستحضرات التجميل والعناية الشخصية</h3>
        {Object.keys(patient.cosmetics).map((key) =>
          key === "otherMedications" ? (
            <p key={key}>أدوية أخرى: {patient.cosmetics[key] || "-"}</p>
          ) : (
            <p key={key}>
              {cosmeticsLabels[key]}: {renderYesNo(patient.cosmetics[key])}
            </p>
          )
        )}
      </div>

      {/* أدوية يومية إضافية */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">أدوية يومية إضافية</h3>
        {Object.keys(patient.dailyMedicationsExtra).map((key) =>
          key === "other" ? (
            <p key={key}>أخرى: {patient.dailyMedicationsExtra[key] || "-"}</p>
          ) : (
            <p key={key}>
              {dailyMedicationsExtraLabels[key]}:{" "}
              {renderYesNo(patient.dailyMedicationsExtra[key])}
            </p>
          )
        )}
      </div>

      {/* العلاجات السابقة */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">العلاجات السابقة</h3>
        <p>{patient.previousTreatments || "-"}</p>
      </div>

      {/* توقيع المريض والتاريخ */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">توقيع المريض والتاريخ</h3>
        <p>توقيع المريض: {patient.patientSignature || "-"}</p>
        <p>تاريخ تعبئة الاستمارة: {patient.date || "-"}</p>
      </div>

      {/* سجل الجلسات */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold mb-2">سجل الجلسات</h3>
        {sessions.length === 0 ? (
          <p>لا توجد جلسات بعد</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="border-b last:border-b-0 py-2">
              <p>تاريخ الجلسة: {session.date}</p>
              <p>العلاج: {session.treatment || "-"}</p>
              <p>ملاحظات: {session.notes || "-"}</p>
            </div>
          ))
        )}
      </div>

      {/* إضافة جلسة جديدة */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
              <button
                onClick={() => navigate("/add-session")}
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                إضافة جلسة
              </button>
      </div>
    </div>
  );
}
