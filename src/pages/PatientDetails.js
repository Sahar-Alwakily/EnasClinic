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
      
      // تجميع الجلسات حسب التاريخ
      const groupedSessions = groupSessionsByDate(sessionsArray);
      setSessions(groupedSessions);
    });

    return () => {
      unsubscribePatient();
      unsubscribeSessions();
    };
  }, [patientId, navigate]);

  // دالة لتجميع الجلسات حسب التاريخ
  const groupSessionsByDate = (sessionsArray) => {
    const grouped = {};
    
    sessionsArray.forEach(session => {
      const sessionDate = session.date || new Date(session.timestamp).toLocaleDateString('ar-SA');
      
      if (!grouped[sessionDate]) {
        grouped[sessionDate] = {
          date: sessionDate,
          areas: [],
          therapist: session.therapist,
          amount: session.amount,
          paymentType: session.paymentType,
          notes: session.notes,
          sessions: []
        };
      }
      
      // إضافة المناطق لهذا التاريخ
      const areas = getSessionAreas(session);
      grouped[sessionDate].areas = [...new Set([...grouped[sessionDate].areas, ...areas])];
      grouped[sessionDate].sessions.push(session);
    });

    // تحويل إلى مصفوفة وترتيب من الأحدث إلى الأقدم
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const renderYesNo = (value) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      value 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }`}>
      {value ? "✅ نعم" : "❌ لا"}
    </span>
  );

  // دالة لتحويل أسماء المناطق من الإنجليزية إلى العربية
  const getAreaNameInArabic = (area) => {
    const areaNames = {
      'face': 'الوجه',
      'neck': 'الرقبة',
      'arm': 'الذراع',
      'hand': 'اليد',
      'elbow': 'الكوع',
      'armpit': 'الإبط',
      'abdomen': 'البطن',
      'back': 'الظهر',
      'thighs': 'الفخذين',
      'shin': 'الساق',
      'feet': 'القدمين',
      'bikiniArea': 'منطقة البكيني',
      'fullbody': 'كامل الجسم',
      'Arm': 'الذراع',
      'Leg': 'الساق',
      'Face': 'الوجه',
      'Neck': 'الرقبة',
      'Elbow': 'الكوع'
    };
    return areaNames[area] || area;
  };

  // دالة لاستخراج المناطق من الجلسة
  const getSessionAreas = (session) => {
    // إذا كان partName موجوداً كنص عادي
    if (session.partName) {
      return [session.partName];
    }
    
    // إذا كانت البيانات مخزنة كأحرف (مثل البيانات القديمة)
    const areaKeys = Object.keys(session).filter(key => 
      !['id', 'clientId', 'clientName', 'date', 'timestamp', 'amount', 'notes', 'paymentType', 'therapist', 'partName'].includes(key)
    );
    
    if (areaKeys.length > 0) {
      // محاولة استخراج اسم المنطقة من الأحرف
      const areaString = areaKeys.map(key => session[key]).join('');
      return [areaString];
    }
    
    return ['غير محدد'];
  };

  // الحصول على الأمراض المزمنة بشكل آمن
  const getChronicConditions = () => {
    if (!patient?.chronicConditions) return [];
    
    const conditions = [
      { key: 'bloodPressure', label: 'ضغط الدم', value: patient.chronicConditions.bloodPressure },
      { key: 'diabetes', label: 'سكري', value: patient.chronicConditions.diabetes },
      { key: 'heartDisease', label: 'أمراض قلب', value: patient.chronicConditions.heartDisease },
      { key: 'anemia', label: 'فقر دم', value: patient.chronicConditions.anemia },
      { key: 'thyroid', label: 'غدة درقية', value: patient.chronicConditions.thyroid },
      { key: 'pcod', label: 'تكيس مبايض', value: patient.chronicConditions.pcod },
      { key: 'shortBreath', label: 'ضيق نفس', value: patient.chronicConditions.shortBreath },
      { key: 'bloodClot', label: 'تخثر الدم', value: patient.chronicConditions.bloodClot },
      { key: 'hormoneDisorder', label: 'اضطرابات هرمونية', value: patient.chronicConditions.hormoneDisorder },
      { key: 'immuneDisease', label: 'أمراض جهاز المناعة', value: patient.chronicConditions.immuneDisease },
      { key: 'headache', label: 'صداع / أوجاع رأس', value: patient.chronicConditions.headache },
      { key: 'epilepsy', label: 'صرع', value: patient.chronicConditions.epilepsy },
      { key: 'cancer', label: 'سرطان', value: patient.chronicConditions.cancer }
    ];
    
    return conditions.filter(condition => condition.value !== undefined);
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">جارٍ تحميل بيانات المريض...</p>
        </div>
      </div>
    );
  }

  const chronicConditions = getChronicConditions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر - متوافق مع الموبايل */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-3">
          {/* الصف العلوي */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => navigate("/add-session", { state: { patientId } })}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + جلسة
            </button>
          </div>

          {/* معلومات المريض */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">
                {patient.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{patient.fullName || 'غير معروف'}</h1>
              <p className="text-gray-500 text-xs truncate">
                الهوية: {patient.idNumber || 'غير معروف'} • الهاتف: {patient.phone || 'غير معروف'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* التنقل - تصميم مناسب للموبايل */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-3 py-2">
          <div className="flex gap-1 min-w-max">
            {[
              { id: "info", label: "البيانات", icon: "👤" },
              { id: "health", label: "الصحة", icon: "❤️" },
              { id: "sessions", label: `الجلسات (${sessions.length})`, icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === tab.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="p-3">
        {/* البيانات الأساسية */}
        {activeSection === "info" && (
          <div className="space-y-3">
            {/* المعلومات الشخصية */}
            <SectionCard title="المعلومات الشخصية" icon="👤">
              <div className="space-y-3">
                <MobileInfoCard label="الاسم الكامل" value={patient.fullName || 'غير معروف'} />
                <MobileInfoCard label="رقم الهوية" value={patient.idNumber || 'غير معروف'} />
                <MobileInfoCard label="رقم الهاتف" value={patient.phone || 'غير معروف'} />
                <MobileInfoCard label="تاريخ الميلاد" value={patient.birthDate || 'غير معروف'} />
              </div>
            </SectionCard>

            {/* الحساسية */}
            <SectionCard title="الحساسية" icon="⚠️">
              <div className="space-y-3">
                <MobileInfoCard label="أنواع الحساسية" value={patient.allergiesText || "لا يوجد"} />
                <MobileInfoCard label="حساسية الخبز" value={renderYesNo(patient.allergyBread)} />
                <MobileInfoCard label="حساسية الحليب" value={renderYesNo(patient.allergyMilk)} />
              </div>
            </SectionCard>

            {/* الأدوية */}
            <SectionCard title="الأدوية والمكملات" icon="💊">
              <div className="space-y-3">
                <MobileInfoCard label="مكملات غذائية" value={renderYesNo(patient.supplements)} />
                <MobileInfoCard label="نوع المكملات" value={patient.supplementsType || "لا يوجد"} />
                <MobileInfoCard label="أدوية يومية" value={renderYesNo(patient.dailyMedications?.medications)} />
                <MobileInfoCard label="نوع الأدوية" value={patient.dailyMedications?.type || "لا يوجد"} />
                <MobileInfoCard label="مشروبات الطاقة" value={renderYesNo(patient.energyDrinks)} />
                <MobileInfoCard label="تدخين" value={renderYesNo(patient.smoking)} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* الوضع الصحي */}
        {activeSection === "health" && (
          <div className="space-y-3">
            {/* الصحة العامة */}
            <SectionCard title="الصحة العامة" icon="❤️">
              <div className="space-y-3">
                <MobileInfoCard label="الحالة الصحية" value={patient.healthStatus || "غير محدد"} />
                <MobileInfoCard label="ممارسة الرياضة" value={renderYesNo(patient.exercise)} />
                <MobileInfoCard label="الحمل" value={renderYesNo(patient.pregnancy)} />
              </div>
            </SectionCard>

            {/* الأمراض الجلدية */}
            <SectionCard title="الأمراض الجلدية" icon="🔬">
              <div className="space-y-3">
                <MobileInfoCard label="أمراض جلدية" value={renderYesNo(patient.skinDiseases)} />
                <MobileInfoCard label="تفاصيل الأمراض" value={patient.skinDetails || "لا يوجد"} />
              </div>
            </SectionCard>

            {/* الأمراض المزمنة */}
            <SectionCard title="الأمراض المزمنة" icon="📋">
              <div className="grid grid-cols-2 gap-2">
                {chronicConditions.map((condition) => (
                  <MobileInfoCard 
                    key={condition.key}
                    compact 
                    label={condition.label} 
                    value={renderYesNo(condition.value)} 
                  />
                ))}
              </div>
            </SectionCard>

            {/* العلاجات السابقة */}
            <SectionCard title="العلاجات السابقة" icon="🩺">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {patient.previousTreatments || "لا توجد علاجات سابقة مسجلة"}
                </p>
              </div>
            </SectionCard>
          </div>
        )}

        {/* الجلسات */}
        {activeSection === "sessions" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">سجل جلسات إزالة الشعر</h2>
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {sessions.length} يوم
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500 text-sm mb-4">لا توجد جلسات مسجلة بعد</p>
                  <button
                    onClick={() => navigate("/add-session", { state: { patientId } })}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
                  >
                    إضافة أول جلسة
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((sessionGroup, index) => (
                    <div
                      key={sessionGroup.date}
                      className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      {/* رأس البطاقة - التاريخ ورقم الجلسة */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                            {sessionGroup.date}
                          </span>
                          {sessionGroup.therapist && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {sessionGroup.therapist}
                            </span>
                          )}
                        </div>
                        <span className="bg-white text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-purple-200">
                          {sessions.length - index}
                        </span>
                      </div>
                      
                      {/* المناطق المعالجة */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 block mb-2">🩺 المناطق المعالجة:</label>
                        <div className="flex flex-wrap gap-2">
                          {sessionGroup.areas.map((area, areaIndex) => (
                            <span 
                              key={areaIndex}
                              className="bg-white text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-200"
                            >
                              {getAreaNameInArabic(area)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* المعلومات الإضافية */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {sessionGroup.amount && (
                          <div>
                            <label className="text-gray-500 block mb-1">💵 المبلغ:</label>
                            <span className="text-green-600 font-medium">{sessionGroup.amount} ₪ </span>
                          </div>
                        )}
                        
                        {sessionGroup.paymentType && (
                          <div>
                            <label className="text-gray-500 block mb-1">💳 طريقة الدفع:</label>
                            <span className="text-gray-700">{sessionGroup.paymentType}</span>
                          </div>
                        )}
                      </div>

                      {/* الملاحظات */}
                      {sessionGroup.notes && (
                        <div className="mt-3 pt-3 border-t border-purple-100">
                          <label className="text-xs text-gray-500 block mb-1">📝 ملاحظات:</label>
                          <p className="text-gray-600 text-xs leading-relaxed bg-white/60 rounded-lg p-2">
                            {sessionGroup.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// مكون البطاقة للأقسام
function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// مكون البطاقة للموبايل
function MobileInfoCard({ label, value, compact = false }) {
  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-2 text-center">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <div className="text-gray-900 font-medium text-sm">{value}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="text-gray-900 font-medium text-sm text-left max-w-[60%]">
        {value}
      </div>
    </div>
  );
}