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
          <div className="p-4 flex items-center justify-between">
  
  {/* أضف زر التعديل هنا */}
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
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500">لا توجد جلسات مسجلة بعد</p>
              </div>
            ) : (
              <MonthlyCalendar 
                sessions={sessions}
                getAreaNameInArabic={getAreaNameInArabic}
                getSessionAreas={getSessionAreas}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- MONTHLY CALENDAR COMPONENT ----------- */
function MonthlyCalendar({ sessions, getAreaNameInArabic, getSessionAreas }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // تحويل الجلسات إلى خريطة بالتواريخ
  const sessionsByDate = {};
  sessions.forEach(session => {
    let dateStr = session.gregorianDate || session.date || (session.timestamp ? new Date(session.timestamp).toISOString().split('T')[0] : null);
    
    if (!dateStr) return;
    
    // تحويل من DD/MM/YYYY إلى YYYY-MM-DD إذا لزم الأمر
    let formattedDate = dateStr;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        formattedDate = `${year}-${month}-${day}`;
      }
    } else if (dateStr.includes('-') && dateStr.length === 10) {
      // إذا كان بصيغة YYYY-MM-DD بالفعل
      formattedDate = dateStr;
    } else if (session.timestamp) {
      // محاولة استخدام timestamp
      try {
        const date = new Date(session.timestamp);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error parsing timestamp:', e);
        return;
      }
    }
    
    if (formattedDate && formattedDate.length === 10) {
      if (!sessionsByDate[formattedDate]) {
        sessionsByDate[formattedDate] = [];
      }
      sessionsByDate[formattedDate].push(session);
    }
  });

  // الحصول على معلومات الشهر الحالي
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = الأحد, 6 = السبت

  // أسماء الأيام بالعربية
  const weekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // تغيير الشهر
  const changeMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  // التحقق إذا كان التاريخ يحتوي على جلسة
  const hasSession = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionsByDate[dateStr] && sessionsByDate[dateStr].length > 0;
  };

  // الحصول على جلسات يوم معين
  const getDaySessions = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionsByDate[dateStr] || [];
  };

  // فتح modal لعرض معلومات الجلسة
  const handleDateClick = (day) => {
    const daySessions = getDaySessions(day);
    if (daySessions.length > 0) {
      // إذا كان هناك عدة جلسات في نفس اليوم، نعرض آخر واحدة
      setSelectedSession(daySessions[daySessions.length - 1]);
      setShowModal(true);
    }
  };

  // إنشاء مصفوفة الأيام
  const days = [];
  // إضافة الأيام الفارغة في البداية
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // إضافة أيام الشهر
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4">
        {/* رأس التقويم */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            ←
          </button>
          <h3 className="text-lg font-bold text-gray-800">
            {months[month]} {year}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            →
          </button>
        </div>

        {/* أيام الأسبوع */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* الأيام */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                day === null
                  ? ''
                  : hasSession(day)
                  ? 'bg-red-500 text-white font-bold hover:bg-red-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => day && handleDateClick(day)}
            >
              {day}
            </div>
          ))}
        </div>

        {/* مفتاح الألوان */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">جلسة موجودة</span>
          </div>
        </div>
      </div>

      {/* Modal لعرض معلومات الجلسة */}
      {showModal && selectedSession && (
        <SessionModal
          session={selectedSession}
          getAreaNameInArabic={getAreaNameInArabic}
          getSessionAreas={getSessionAreas}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/* ---------- SESSION MODAL COMPONENT ----------- */
function SessionModal({ session, getAreaNameInArabic, getSessionAreas, onClose }) {
  const areas = getSessionAreas(session);
  const sessionDate = session.date || new Date(session.timestamp).toLocaleDateString("ar-SA");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* العنوان */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">معلومات الجلسة</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* التاريخ */}
        <div className="mb-4 pb-4 border-b">
          <div className="text-gray-600 text-sm mb-1">تاريخ الجلسة</div>
          <div className="text-lg font-bold text-purple-700">{sessionDate}</div>
        </div>

        {/* اسم المعالج */}
        {session.therapist && (
          <div className="mb-4 pb-4 border-b">
            <div className="text-gray-600 text-sm mb-2">👨‍⚕️ المعالج</div>
            <div className="text-lg font-medium text-gray-800">{session.therapist}</div>
          </div>
        )}

        {/* المناطق */}
        <div className="mb-4 pb-4 border-b">
          <div className="text-gray-600 text-sm mb-2">المناطق المعالجة</div>
          <div className="flex flex-wrap gap-2">
            {areas.map((area, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* الملاحظات */}
        {session.notes && (
          <div className="mb-4">
            <div className="text-gray-600 text-sm mb-2">📝 الملاحظات</div>
            <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">
              {session.notes}
            </div>
          </div>
        )}

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition mt-4"
        >
          إغلاق
        </button>
      </div>
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