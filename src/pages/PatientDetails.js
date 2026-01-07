/* ----------- PATIENT DETAILS MODERN UI -------------- */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function PatientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSection, setActiveSection] = useState("info");

  useEffect(() => {
    if (!patientId) {
      navigate("/customers");
      return;
    }

    const patientRef = ref(db, `patients/${patientId}`);
    const unsubscribePatient = onValue(patientRef, (snapshot) => {
      setPatient(snapshot.val());
    });

    const sessionsRef = ref(db, `sessions/${patientId}`);
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sessionsArray = Object.entries(data).map(([id, session]) => ({
        id,
        ...session,
      }));

      // ترتيب الجلسات من الأحدث إلى الأقدم
      sessionsArray.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
      setSessions(sessionsArray);
    });

    return () => {
      unsubscribePatient();
      unsubscribeSessions();
    };
  }, [patientId, navigate]);

  const getAreaNameInArabic = (area) => {
    const areaNames = {
      face: "الوجه",
      neck: "الرقبة",
      arm: "الذراع",
      hand: "اليد",
      elbow: "الكوع",
      armpit: "الإبط",
      abdomen: "البطن",
      back: "الظهر",
      thighs: "الفخذين",
      shin: "الساق",
      feet: "القدمين",
      bikiniArea: "البكيني",
      fullbody: "كامل الجسم",
      body: "الجسم",
    };
    return areaNames[area] || area;
  };

  const getSessionAreas = (session) => {
    if (session.parts && Array.isArray(session.parts)) {
      return session.parts;
    }
    if (session.partName) {
      return [session.partName];
    }
    return ["غير محدد"];
  };

  const renderYesNo = (value) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        value === true || value === "true"
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-gray-200 text-gray-600 border border-gray-300"
      }`}
    >
      {value === true || value === "true" ? "نعم" : "لا"}
    </span>
  );

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
        <div className="text-white text-center">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جارٍ تحميل البيانات.!!!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* HEADER */}
      <div className="bg-white shadow-md rounded-b-3xl pb-6">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            {/* زر إضافة جلسة */}
            <button
              onClick={() => navigate("/add-session", { state: { patient: { ...patient, idNumber: patientId } } })}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2"
            >
              <span>➕</span>
              <span>إضافة جلسة</span>
            </button>
            
            {/* زر التعديل */}
            <button
              onClick={() => navigate("/edit-patient", { state: { patientId, patient } })}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition"
            >
              تعديل المريض
            </button>
          </div>
        </div>

        {/* Patient Card */}
        <div className="px-4 mt-3">
          <div className="flex items-center gap-4 bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-4 rounded-2xl shadow-xl text-white">
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

        {/* Tabs */}
        <div className="mt-4 px-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "info", label: "البيانات" },
              { id: "health", label: "الصحة" },
              { id: "sessions", label: "الجلسات" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition ${
                  activeSection === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* INFO */}
        {activeSection === "info" && (
          <div className="space-y-4">
            <GlassCard title="المعلومات الشخصية">
              <Info label="الاسم الكامل" value={patient.fullName || "غير محدد"} />
              <Info label="رقم الهوية" value={patient.idNumber || "غير محدد"} />
              <Info label="رقم الهاتف" value={patient.phone || "غير محدد"} />
              <Info label="تاريخ الميلاد" value={patient.birthDate || "غير محدد"} />
              <Info label="تاريخ التسجيل" value={patient.date || "غير محدد"} />
            </GlassCard>

            <GlassCard title="الحساسية">
              <Info label="حساسية الخبز" value={renderYesNo(patient.allergyBread)} />
              <Info label="حساسية الحليب" value={renderYesNo(patient.allergyMilk)} />
              <Info 
                label="حساسيات أخرى" 
                value={patient.allergiesText || "لا توجد حساسيات أخرى"} 
              />
            </GlassCard>
          </div>
        )}

        {/* HEALTH */}
        {activeSection === "health" && (
          <div className="space-y-4">
            {/* الصحة العامة */}
            <GlassCard title="الصحة العامة">
              <Info label="الحالة الصحية" value={patient.healthStatus || "غير محددة"} />
              <Info label="ممارسة الرياضة" value={renderYesNo(patient.exercise)} />
              <Info label="الحمل" value={renderYesNo(patient.pregnancy)} />
              <Info label="الدورة الشهرية" value={renderYesNo(patient.menstrualCycle)} />
              <Info label="التدخين" value={renderYesNo(patient.smoking)} />
              <Info label="مشروبات الطاقة" value={renderYesNo(patient.energyDrinks)} />
              <Info label="المكملات الغذائية" value={renderYesNo(patient.supplements)} />
              {patient.supplements && (
                <Info 
                  label="نوع المكملات" 
                  value={patient.supplementsType || "غير محدد"} 
                />
              )}
            </GlassCard>

            {/* الأمراض المزمنة */}
            <GlassCard title="الأمراض المزمنة">
              {patient.chronicConditions ? (
                <div className="space-y-2">
                  {Object.entries({
                    diabetes: "السكري",
                    bloodPressure: "ضغط الدم",
                    heartDisease: "أمراض القلب",
                    thyroid: "الغدة الدرقية",
                    anemia: "فقر الدم",
                    epilepsy: "الصرع",
                    cancer: "السرطان",
                    kidney: "أمراض الكلى",
                    headache: "الصداع المزمن",
                    pcod: "متلازمة تكيس المبايض",
                    shortBreath: "ضيق التنفس",
                    hormoneDisorder: "اضطرابات هرمونية",
                    immuneDisease: "أمراض المناعة",
                    bloodClot: "تجلط الدم"
                  }).map(([key, label]) => (
                    <Info 
                      key={key}
                      label={label} 
                      value={renderYesNo(patient.chronicConditions[key])} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">لا توجد بيانات للأمراض المزمنة</p>
              )}
            </GlassCard>

            {/* الأمراض الجلدية */}
            <GlassCard title="الأمراض الجلدية">
              <Info label="أمراض جلدية" value={renderYesNo(patient.skinDiseases)} />
              <Info 
                label="تفاصيل الجلد" 
                value={patient.skinDetails || "لا توجد تفاصيل"} 
              />
              <Info 
                label="العلاجات السابقة" 
                value={patient.previousTreatments || "لا توجد علاجات سابقة"} 
              />
            </GlassCard>

            {/* الأدوية اليومية */}
            <GlassCard title="الأدوية اليومية">
              <Info 
                label="أدوية يومية" 
                value={renderYesNo(patient.dailyMedications?.medications)} 
              />
              {patient.dailyMedications?.medications && patient.dailyMedications?.type && (
                <Info 
                  label="نوع الأدوية" 
                  value={patient.dailyMedications.type} 
                />
              )}
            </GlassCard>

            {/* الأدوية الإضافية */}
            {(patient.dailyMedicationsExtra && Object.keys(patient.dailyMedicationsExtra).length > 0) ? (
              <GlassCard title="الأدوية الإضافية">
                <div className="space-y-2">
                  {Object.entries({
                    roaccutane: "روأكيوتان",
                    contraceptive: "مانع الحمل",
                    antidepressant: "مضاد الاكتئاب",
                    sedative: "مهدئ",
                    sleepingPill: "حبوب نوم",
                    biotica: "مضاد حيوي"
                  }).map(([key, label]) => (
                    patient.dailyMedicationsExtra[key] !== undefined && (
                      <Info 
                        key={key}
                        label={label} 
                        value={renderYesNo(patient.dailyMedicationsExtra[key])} 
                      />
                    )
                  ))}
                  {patient.dailyMedicationsExtra.other && (
                    <Info 
                      label="أدوية أخرى" 
                      value={patient.dailyMedicationsExtra.other} 
                    />
                  )}
                </div>
              </GlassCard>
            ) : null}

            {/* منتجات العناية */}
            {patient.cosmetics ? (
              <GlassCard title="منتجات العناية المستخدمة">
                <div className="space-y-2">
                  {Object.entries({
                    moisturizer: "مرطب",
                    sunscreen: "واقي شمس",
                    serum: "سيروم",
                    soap: "صابون",
                    exfoliation: "مقشر",
                    roaccutane: "روأكيوتان (عناية)",
                    biotica: "مضاد حيوي (عناية)"
                  }).map(([key, label]) => (
                    patient.cosmetics[key] !== undefined && (
                      <Info 
                        key={key}
                        label={label} 
                        value={renderYesNo(patient.cosmetics[key])} 
                      />
                    )
                  ))}
                  {patient.cosmetics.otherMedications && (
                    <Info 
                      label="أدوية عناية أخرى" 
                      value={patient.cosmetics.otherMedications} 
                    />
                  )}
                </div>
              </GlassCard>
            ) : null}
          </div>
        )}

        {/* SESSIONS */}
        {activeSection === "sessions" && (
          <SessionsCalendar 
            sessions={sessions} 
            getAreaNameInArabic={getAreaNameInArabic}
            getSessionAreas={getSessionAreas}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- SESSIONS CALENDAR COMPONENT ----------- */
function SessionsCalendar({ sessions, getAreaNameInArabic, getSessionAreas }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);

  // أسماء الأشهر بالعربية
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // أسماء أيام الأسبوع بالعربية
  const arabicDays = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  // الحصول على تواريخ الجلسات
  const getSessionDates = () => {
    const dates = {};
    sessions.forEach(session => {
      let dateKey;
      
      if (session.gregorianDate) {
        dateKey = session.gregorianDate;
      } else if (session.timestamp) {
        dateKey = new Date(session.timestamp).toISOString().split('T')[0];
      } else if (session.date) {
        // تحويل من DD/MM/YYYY إلى YYYY-MM-DD
        const parts = session.date.split('/');
        if (parts.length === 3) {
          dateKey = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      if (dateKey) {
        if (!dates[dateKey]) {
          dates[dateKey] = [];
        }
        dates[dateKey].push(session);
      }
    });
    return dates;
  };

  const sessionDates = getSessionDates();

  // الحصول على أيام الشهر
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // أيام فارغة في البداية
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // أيام الشهر
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);

  // التنقل بين الأشهر
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedSession(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedSession(null);
  };

  // التحقق إذا كان اليوم فيه جلسة
  const hasSession = (day) => {
    if (!day) return false;
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionDates[dateKey] && sessionDates[dateKey].length > 0;
  };

  // الحصول على جلسات يوم معين
  const getSessionsForDay = (day) => {
    if (!day) return [];
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionDates[dateKey] || [];
  };

  // عند الضغط على يوم
  const handleDayClick = (day) => {
    const daySessions = getSessionsForDay(day);
    if (daySessions.length > 0) {
      setSelectedSession({ day, sessions: daySessions });
    }
  };

  return (
    <div className="space-y-4">
      {/* التقويم */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        {/* رأس التقويم */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition text-xl"
          >
            ←
          </button>
          <h3 className="text-lg font-bold text-gray-800">
            {arabicMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition text-xl"
          >
            →
          </button>
        </div>

        {/* أيام الأسبوع */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {arabicDays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* أيام الشهر */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => day && handleDayClick(day)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition cursor-pointer
                ${!day ? 'bg-transparent' : 'hover:bg-gray-100'}
                ${hasSession(day) 
                  ? 'bg-red-500 text-white font-bold hover:bg-red-600 shadow-md' 
                  : 'text-gray-700'}
                ${selectedSession?.day === day ? 'ring-2 ring-purple-500' : ''}
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* مفتاح الألوان */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">يوم فيه جلسة</span>
          </div>
        </div>
      </div>

      {/* تفاصيل الجلسة المحددة */}
      {selectedSession && (
        <div className="bg-white rounded-2xl shadow-lg p-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-700">
              📅 جلسات يوم {selectedSession.day} {arabicMonths[currentDate.getMonth()]}
            </h3>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {selectedSession.sessions.map((session, idx) => {
              const areas = getSessionAreas(session);
              
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  {/* المناطق */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">المناطق:</div>
                    <div className="flex flex-wrap gap-2">
                      {areas.map((area, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {getAreaNameInArabic(area)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* المعالج */}
                  {session.therapist && (
                    <div className="flex items-center gap-2 mb-3 bg-blue-50 p-2 rounded-lg">
                      <span className="text-blue-600">👨‍⚕️</span>
                      <span className="text-gray-700 font-medium">المعالج: {session.therapist}</span>
                    </div>
                  )}

                  {/* الملاحظات */}
                  {session.notes && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500">📝</span>
                        <span className="text-xs text-gray-500">ملاحظات:</span>
                      </div>
                      <p className="text-gray-700 text-sm">{session.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* رسالة إذا لم توجد جلسات */}
      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-500">لا توجد جلسات مسجلة بعد</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ---------- COMPONENTS ----------- */

function GlassCard({ title, children }) {
  return (
    <div className="bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl border border-white/40 p-4">
      <h3 className="text-purple-700 font-bold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between bg-gray-50 rounded-lg p-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-gray-800 text-sm">{value}</span>
    </div>
  );
}