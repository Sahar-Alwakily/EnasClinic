// BodyMap3D.js - واجهة بسيطة لاختيار المناطق
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, set, push, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { toEnglishNumbers } from "../utils/numberUtils";
import "./BodyMap3D.css";

/* --------------- Utility: group sessions by date --------------- */
function groupSessionsByDateArray(sessionsArray = []) {
  const grouped = {};
  sessionsArray.forEach((s) => {
    // استخدام التاريخ الميلادي للتجميع - تنسيق DD/MM/YYYY
    let dateKey = s.date || s.gregorianDate || "No Date";
    
    // إذا كان التاريخ يحتوي على خط مائل عكسي، نصححه
    if (dateKey.includes('-')) {
      // تنسيق YYYY-MM-DD إلى DD/MM/YYYY
      const [year, month, day] = dateKey.split('-');
      dateKey = `${day}/${month}/${year}`;
    }
    
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  });
  
  return Object.keys(grouped)
    .map((d) => ({ date: d, sessions: grouped[d] }))
    .sort((a, b) => {
      // تحويل التواريخ لمقارنتها
      const parseDate = (dateStr) => {
        if (dateStr === "No Date") return new Date(0);
        
        // تنسيق DD/MM/YYYY
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      return db - da; // ترتيب تنازلي (الأحدث أولاً)
    });
}

/* ----------------- HealthInfoPanel ----------------- */
function HealthInfoPanel({ client, open, onToggle }) {
  const info = useMemo(() => {
    if (!client) return null;
    const allergies = [];
    if (client.allergyMilk) allergies.push("حساسية حليب");
    if (client.allergyBread) allergies.push("حساسية خبز");
    if (client.allergiesText && client.allergiesText !== "لا")
      allergies.push(client.allergiesText);

    const chronic = [];
    const map = {
      bloodPressure: "ضغط الدم",
      diabetes: "سكري",
      heartDisease: "أمراض قلب",
      anemia: "فقر دم",
      thyroid: "غدة درقية",
      pcod: "تكيس مبايض",
      shortBreath: "ضيق نفس",
      bloodClot: "تخثر الدم",
      hormoneDisorder: "اضطراب هرموني",
      immuneDisease: "أمراض مناعية",
      headache: "صداع",
      epilepsy: "صرع",
      cancer: "سرطان",
    };
    if (client.chronicConditions) {
      Object.entries(client.chronicConditions).forEach(([k, v]) => {
        if (v && map[k]) chronic.push(map[k]);
      });
    }

    const meds = [];
    if (client.dailyMedications?.medications)
      meds.push(client.dailyMedications.medications);
    if (client.dailyMedications?.type)
      meds.push(client.dailyMedications.type);

    const supplements = [];
    if (client.supplements) supplements.push("يستخدم مكملات");
    if (client.supplementsType) supplements.push(client.supplementsType);

    const habits = [];
    if (client.smoking) habits.push("مدخن");
    if (client.pregnancy) habits.push("حامل");
    if (client.exercise) habits.push("يمارس رياضة");

    return { allergies, chronic, meds, supplements, habits };
  }, [client]);

  if (!info) return null;
  const hasAny = Object.values(info).some((arr) => arr.length);
  if (!hasAny) return null;

  return (
    <div className="health-panel">
      <div className="health-header" onClick={onToggle} role="button">
        <div className="title">
          <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
            <path
              fill="#fff"
              d="M12 21s-6-4.35-8.5-6.5C1.5 11.75 4 8 8.5 8 10.17 8 12 9.09 12 11s1.83 3 3.5 3C17.5 14 20 17.75 20.5 14.5 18 16.65 12 21 12 21z"
            />
          </svg>
          <span>المعلومات الصحية</span>
        </div>
        <div className="toggle">{open ? "إخفاء" : "عرض"}</div>
      </div>

      {open && (
        <div className="health-body">
          {info.allergies.length > 0 && (
            <div className="health-row">
              <div className="health-row-label">🔴 الحساسية</div>
              <div className="health-row-tags">{info.allergies.join(" • ")}</div>
            </div>
          )}
          {info.chronic.length > 0 && (
            <div className="health-row">
              <div className="health-row-label">🟠 الأمراض المزمنة</div>
              <div className="health-row-tags">{info.chronic.join(" • ")}</div>
            </div>
          )}
          {info.meds.length > 0 && (
            <div className="health-row">
              <div className="health-row-label">💊 أدوية يومية</div>
              <div className="health-row-tags">{info.meds.join(" • ")}</div>
            </div>
          )}
          {info.supplements.length > 0 && (
            <div className="health-row">
              <div className="health-row-label">🧴 مكملات</div>
              <div className="health-row-tags">{info.supplements.join(" • ")}</div>
            </div>
          )}
          {info.habits.length > 0 && (
            <div className="health-row">
              <div className="health-row-label">📝 عادات/حالات</div>
              <div className="health-row-tags">{info.habits.join(" • ")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------- SessionsTimeline ----------------- */
function SessionsTimeline({ groupedDates = [] }) {
  if (!groupedDates || groupedDates.length === 0) {
    return (
      <div className="empty-timeline">
        <div className="emoji">📭</div>
        <div className="text">لا توجد جلسات بعد</div>
      </div>
    );
  }

  // دالة لعرض التاريخ الميلادي بأرقام إنجليزية
  const formatGregorianDate = (dateStr) => {
    if (dateStr === "No Date") return "بدون تاريخ";
    
    try {
      // تحويل من DD/MM/YYYY إلى تاريخ
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        // تحويل الأرقام إلى إنجليزية
        return `${toEnglishNumbers(day)}/${toEnglishNumbers(month)}/${toEnglishNumbers(year)}`;
      }
      
      // إذا كان بصيغة YYYY-MM-DD
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${toEnglishNumbers(day)}/${toEnglishNumbers(month)}/${toEnglishNumbers(year)}`;
      }
      
      return toEnglishNumbers(dateStr);
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="timeline">
      {groupedDates.map((group) => (
        <div key={group.date} className="timeline-item">
          <div className="timeline-left">
            <div className="date-badge">
              {formatGregorianDate(group.date)}
            </div>
            <div className="vline" />
          </div>
          <div className="timeline-right">
            {group.sessions.map((s, index) => (
              <div key={s.id || s.timestamp || index} className="session-card">
                <div className="session-row">
                  <div className="session-parts">
                    {(s.parts || []).map((p, i) => (
                      <span className="chip" key={i}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                
                {s.notes && (
                  <div className="notes">
                    <span className="notes-icon">📝</span>
                    {s.notes}
                  </div>
                )}
                
                <div className="session-footer">
                  {s.therapist && s.therapist !== "غير محدد" && (
                    <div className="therapist-info">
                      <span className="therapist-icon">👨‍⚕️</span>
                      المعالج: {s.therapist}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------- Simple Session Form (بدون مودل) ----------------- */
function SimpleSessionForm({ 
  selectedParts, 
  onSave, 
  isProcessing,
  onCancel
}) {
  const [notes, setNotes] = useState("");
  const [therapist, setTherapist] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedDateObj = new Date(selectedDate);
    const formattedDate = selectedDateObj.toLocaleDateString('en-GB');
    const gregorianDate = selectedDate;
    
    const sessionData = {
      notes,
      parts: selectedParts,
      date: formattedDate,
      gregorianDate: gregorianDate,
      therapist: therapist.trim(),
      timestamp: selectedDateObj.toISOString(),
    };

    onSave(sessionData);
  };

  return (
    <div className="simple-session-form">
      <div className="form-header">
        <h3>حفظ الجلسة</h3>
      </div>

      <form onSubmit={handleSubmit} className="session-form">
        <div className="form-section">
          <label className="section-label">المناطق المحددة:</label>
          <div className="selected-parts-list">
            {selectedParts.map((part, index) => (
              <div key={index} className="part-item">
                <span className="part-name">{part}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="section-label">معلومات الجلسة</label>
          
          <div className="input-group">
            <label>اسم المعالج:</label>
            <input
              type="text"
              value={therapist}
              onChange={(e) => setTherapist(e.target.value)}
              placeholder="أدخل اسم المعالج..."
              className="form-input"
              required
            />
          </div>

          <div className="input-group">
            <label>تاريخ الجلسة:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              max={new Date().toISOString().split('T')[0]}
            />
            <small className="date-note">
              اختر تاريخ الجلسة (يمكن اختيار أي تاريخ ماضي)
            </small>
          </div>
        </div>
        
        <div className="form-section">
          <label className="section-label">ملاحظات إضافية:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف ملاحظات حول الجلسة..."
            rows="3"
            className="form-textarea"
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn secondary"
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            className="btn primary"
            disabled={isProcessing || selectedParts.length === 0}
          >
            {isProcessing ? "جاري الحفظ..." : `حفظ الجلسة (${selectedParts.length} منطقة)`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------- MAIN COMPONENT BodyMap3D ----------------- */
export default function BodyMap3D({ client, onSaveSession, open = false }) {
  const [selectedParts, setSelectedParts] = useState([]);
  const [sessionsByPart, setSessionsByPart] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    if (!client?.idNumber) return;
    const sessionsRef = ref(db, `sessions/${client.idNumber}`);
    const unsub = onValue(sessionsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([id, s]) => ({ id, ...s }));
      
      const byPart = {};
      arr.forEach((s) => {
        const part = s.partName || "عام";
        if (!byPart[part]) byPart[part] = [];
        byPart[part].push(s);
      });
      
      setSessionsByPart(byPart);
      setGroupedSessions(groupSessionsByDateArray(arr));
    });
    return () => unsub();
  }, [client?.idNumber]);

  useEffect(() => {
    if (!client) {
      setTasks([]);
      return;
    }
    const t = client.tasks || client.todos || [];
    setTasks(Array.isArray(t) ? t : []);
  }, [client]);

  const togglePart = useCallback(
    (arabicName) => {
      setSelectedParts((prev) =>
        prev.includes(arabicName)
          ? prev.filter((p) => p !== arabicName)
          : [...prev, arabicName]
      );
    },
    []
  );

  // دالة لتحديث الجلسات المتبقية في الحزمة
// BodyMap3D.js - تحديث دالة updateRemainingSessions

const addSession = async (sessionData) => {
  if (!client?.idNumber)
    return { success: false, message: "client id missing" };
  setIsProcessing(true);
  try {
    const refSessions = ref(db, `sessions/${client.idNumber}`);
    const newRef = push(refSessions);
    
    const sessionId = newRef.key;
    
    const toSave = {
      ...sessionData,
      parts: selectedParts,
      partName: selectedParts.join(' + '),
      clientId: client.idNumber,
      clientName: client.fullName,
      timestamp: sessionData.timestamp || new Date().toISOString(),
      date: sessionData.date,
      gregorianDate: sessionData.gregorianDate,
      sessionId: sessionId,
      areasCount: selectedParts.length,
      areas: selectedParts,
      therapist: sessionData.therapist || "غير محدد",
    };
    
    await set(newRef, toSave);
    
    onSaveSession?.(toSave);
    
    setSelectedParts([]);
    setShowSessionForm(false);
    return { success: true, message: `تمت إضافة جلسة بتاريخ ${sessionData.date} تشمل ${selectedParts.length} منطقة` };
  } catch (err) {
    console.error(err);
    return { success: false, message: "خطأ أثناء الحفظ" };
  } finally {
    setIsProcessing(false);
  }
};



  const allSessions = useMemo(
    () => Object.values(sessionsByPart).flat(),
    [sessionsByPart]
  );

  // قائمة المناطق المتاحة
  const availableAreas = [
    'البطن',
    'منطقة البيكيني',
    'الفخذين',
    'الظهر',
    'الكوع',
    'الذراع',
    'الإبط',
    'الرقبة',
    'الوجه',
    'اليد',
    'القدمين',
    'الساق',
    'الصدر'
  ];

  return (
    <div className="container">
      <div className={`top-row ${open ? "sidebar-open" : ""}`}>
        <div className="profile">
          <div className="avatar">
            {(client?.fullName || "؟").slice(0, 2)}
          </div>
          <div className="meta">
            <div className="name">{client?.fullName || "مريض غير معروف"}</div>
            <div className="sub">
              #{client?.idNumber || "—"} • {client?.phone || "لا يوجد هاتف"}
            </div>
          </div>
        </div>

        <div className="actions">
          <div className="stats">
            <div className="stat">
              <div className="label">إجمالي الجلسات</div>
              <div className="value">{allSessions.length}</div>
            </div>
            <div className="stat">
              <div className="label">المناطق المحددة</div>
              <div className="value">{selectedParts.length}</div>
            </div>
          </div>

          <div className="buttons">
            <button
              className="btn ghost"
              onClick={() => setSelectedParts([])}
              style={{ minHeight: '44px' }}
            >
              <span className="button-text">إلغاء التحديد</span>
            </button>
            <button
              className={`btn primary ${selectedParts.length === 0 ? "disabled" : ""}`}
              disabled={selectedParts.length === 0}
              onClick={() => setShowSessionForm(true)}
              style={{ 
                minHeight: '44px',
                minWidth: '140px'
              }}
            >
              <span className="button-text">
                حفظ جلسات ({selectedParts.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      <HealthInfoPanel
        client={client}
        open={healthOpen}
        onToggle={() => setHealthOpen((v) => !v)}
      />

      <div className="main-grid">
        {!showSessionForm ? (
          <>
            <div className="areas-selection-card">
              <div className="areas-header">
                <h3>اختر المناطق</h3>
                <p>اضغط على المنطقة لتحديدها</p>
              </div>
              <div className="areas-grid">
                {availableAreas.map((area) => (
                  <button
                    key={area}
                    className={`area-button ${selectedParts.includes(area) ? 'selected' : ''}`}
                    onClick={() => togglePart(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="right-card">
              <div className="section-title">
                <span className="timeline-icon">📅</span>
                الجلسات - الخط الزمني
              </div>
              <div className="timeline-wrap">
                <SessionsTimeline groupedDates={groupedSessions} />
              </div>
            </div>
          </>
        ) : (
          <div className="form-container">
            <SimpleSessionForm
              selectedParts={selectedParts}
              onSave={addSession}
              isProcessing={isProcessing}
              onCancel={() => setShowSessionForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}