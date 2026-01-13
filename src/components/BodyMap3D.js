// BodyMap3D.js - الإصدار النهائي مع إمكانية اختيار التاريخ وإضافة الحزم
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, set, push, onValue, update } from "firebase/database"; // أضف update هنا
import { db } from "../firebaseConfig";
import "./BodyMap3D.css";

/* ---------- DESIGN COLORS ---------- */
const COLORS = {
  primary: "#7C3AED",
  secondary: "#2563EB",
  gradient: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  bg: "#0f172a10",
  text: "#0f172a",
  muted: "#6b7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

// خريطة أسماء المناطق بالعربي والإنجليزي مع تصحيح للأسماء
const areaMaps = {
  // العربية ← الإنجليزية
  arToEn: {
    'البطن': 'abdomen',
    'منطقة البيكيني': 'bikiniArea',
    'الفخذين': 'thighs',
    'الظهر': 'back',
    'الإبط': 'armpit',
    'الرقبة': 'neck',
    'الوجه': 'face',
    'نص اليد': 'hand',
    'القدمين': 'feet',
    'الايد كامل': 'fullHand'
  },
  
  // الإنجليزية ← العربية
  enToAr: {
    'abdomen': 'البطن',
    'bikiniArea': 'منطقة البيكيني',
    'thighs': 'الفخذين',
    'back': 'الظهر',
    'armpit': 'الإبط',
    'neck': 'الرقبة',
    'face': 'الوجه',
    'hand': 'نص اليد',
    'hands': 'نص اليد',
    'fullHand': 'الايد كامل',
    'feet': 'القدمين',
    'foot': 'القدمين',
    'stomach': 'البطن',
    'elbow': 'نص اليد',
    'arm': 'الايد كامل',
    'arms': 'الايد كامل',
    'Thighs': 'الفخذين',
    'Back': 'الظهر',
    'Abdomen': 'البطن',
    'Armpit': 'الإبط',
    'Neck': 'الرقبة',
    'Face': 'الوجه'
  }
};

// قائمة جميع المناطق المتاحة
const allBodyParts = [
  'البطن',
  'منطقة البيكيني',
  'الفخذين',
  'الظهر',
  'الإبط',
  'الرقبة',
  'الوجه',
  'نص اليد',
  'القدمين',
  'الايد كامل',
];

// دالة لتحويل أسماء المناطق في الجلسات إلى عربية
const convertSessionPartsToArabic = (parts) => {
  if (!parts) return [];
  
  if (Array.isArray(parts)) {
    return parts.map(part => {
      // تنظيف النص من المسافات الزائدة
      const cleanPart = part.trim();
      
      // إذا كان الجزء بالفعل عربي، إرجاعه كما هو
      if (Object.keys(areaMaps.arToEn).some(arabicName => 
          cleanPart.includes(arabicName) || arabicName.includes(cleanPart))) {
        return cleanPart;
      }
      
      // إذا كان إنجليزي، تحويله إلى عربي
      // البحث في جميع الأشكال المحتملة
      for (const [en, ar] of Object.entries(areaMaps.enToAr)) {
        if (cleanPart.toLowerCase().includes(en.toLowerCase()) || 
            en.toLowerCase().includes(cleanPart.toLowerCase())) {
          return ar;
        }
      }
      
      // إذا لم يتم العثور على ترجمة، إرجاع النص كما هو
      return cleanPart;
    });
  }
  
  // إذا كان نص واحد
  if (typeof parts === 'string') {
    const cleanPart = parts.trim();
    
    // تحقق إذا كان النص بالفعل عربي
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(cleanPart)) {
      return [cleanPart];
    }
    
    // إذا كان إنجليزي، حاول تحويله
    for (const [en, ar] of Object.entries(areaMaps.enToAr)) {
      if (cleanPart.toLowerCase().includes(en.toLowerCase()) || 
          en.toLowerCase().includes(cleanPart.toLowerCase())) {
        return [ar];
      }
    }
    
    return [cleanPart];
  }
  
  return [];
};

/* ----------------- BodyPartsSelector - قائمة اختيار المناطق ----------------- */
function BodyPartsSelector({ selectedParts = [], togglePart }) {
  return (
    <div className="body-parts-selector">
      <div className="parts-grid">
        {allBodyParts.map((part) => {
          const isSelected = selectedParts.includes(part);
          return (
            <button
              key={part}
              type="button"
              className={`part-button ${isSelected ? 'selected' : ''}`}
              onClick={() => togglePart(part)}
            >
              <span className="part-icon">
                {isSelected ? '✓' : '○'}
              </span>
              <span className="part-label">{part}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    
    // تحويل أسماء المناطق في الجلسة إلى عربية قبل التخزين
    const sessionWithArabicParts = {
      ...s,
      parts: convertSessionPartsToArabic(s.parts),
      partName: s.partName ? convertSessionPartsToArabic([s.partName])[0] : s.partName
    };
    
    grouped[dateKey].push(sessionWithArabicParts);
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
        return `${day}/${month}/${year}`;
      }
      
      // إذا كان بصيغة YYYY-MM-DD
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  };

  // دالة لعرض الوقت بتنسيق 24 ساعة
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '--:--';
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return '--:--';
    }
  };


  return (
    <div className="timeline">
      {groupedDates.map((group) => (
        <div key={group.date} className="timeline-item">
          <div className="timeline-right">
            {group.sessions.map((s, index) => (
              <div key={s.id || s.timestamp || index} className="session-card">
                <div className="session-header">
                  <div className="session-date">
                    <span className="date-icon">📅</span>
                    {formatGregorianDate(s.date || s.gregorianDate || group.date)}
                  </div>
                </div>
                
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

/* ----------------- SessionModal ----------------- */
function SessionModal({ 
  isOpen, 
  onClose, 
  selectedParts, 
  onSave, 
  prices,
  isProcessing,
  client
}) {
  const [notes, setNotes] = useState("");
  const [therapist, setTherapist] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [packageAmount, setPackageAmount] = useState("");

  // تسجيل للتشخيص وإعادة تعيين الحقول
  useEffect(() => {
    if (isOpen) {
      console.log('المودال مفتوح - المناطق المحددة:', selectedParts);
      setPackageAmount("");
      setNotes("");
      setTherapist("");
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, selectedParts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('بدء حفظ الجلسة...', { selectedParts, therapist, notes, selectedDate });
    
    try {
      // التحقق من وجود مناطق محددة
      if (!selectedParts || selectedParts.length === 0) {
        alert('يرجى تحديد منطقة واحدة على الأقل قبل الحفظ');
        return;
      }
      
      // التحقق من اسم المعالج
      if (!therapist || therapist.trim() === '') {
        alert('يرجى إدخال اسم المعالج');
        return;
      }
      
      // تحويل التاريخ المحدد إلى تنسيقات مختلفة
      const selectedDateObj = new Date(selectedDate);
      const formattedDate = selectedDateObj.toLocaleDateString('en-GB');
      const gregorianDate = selectedDate;
      
      const sessionData = {
        notes: notes || '',
        parts: Array.isArray(selectedParts) ? [...selectedParts] : [],
        date: formattedDate,
        gregorianDate: gregorianDate,
        therapist: therapist.trim(),
        timestamp: selectedDateObj.toISOString(),
        packageAmount: client?.hasPackage && packageAmount && packageAmount.trim() !== "" ? parseFloat(packageAmount) : null
      };

      console.log('بيانات الجلسة المراد حفظها:', sessionData);

      // استدعاء دالة الحفظ
      const result = await onSave(sessionData);
      
      console.log('نتيجة الحفظ:', result);
      
      // إذا كان هناك رسالة خطأ، عرضها
      if (result && !result.success) {
        alert(result.message || 'حدث خطأ أثناء حفظ الجلسة');
      }
      // ملاحظة: addSession تقوم بإغلاق المودال تلقائياً بعد الحفظ الناجح
    } catch (error) {
      console.error('خطأ في حفظ الجلسة:', error);
      alert('حدث خطأ أثناء حفظ الجلسة. يرجى المحاولة مرة أخرى.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>حفظ الجلسات</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <label className="section-label">المناطق المحددة:</label>
            <div className="selected-parts-text">
              {selectedParts.length > 0 ? (
                <p className="parts-display">
                  {selectedParts.map((part, index) => (
                    <span key={index} className="part-tag">
                      {part}
                      {index < selectedParts.length - 1 && <span className="separator">،</span>}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="no-parts">لا توجد مناطق محددة</p>
              )}
            </div>
          </div>

          <div className="form-section">
            <label className="section-label">معلومات إضافية</label>
            
            <div className="input-group">
              <label>اسم المعالج:</label>
              <input
                type="text"
                value={therapist}
                onChange={(e) => setTherapist(e.target.value)}
                placeholder="أدخل اسم المعالج..."
                className="form-input"
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

            <div className="input-group">
              <label>المبلغ من החבילה:</label>
              {client?.hasPackage ? (
                <>
                  <input
                    type="number"
                    value={packageAmount}
                    onChange={(e) => setPackageAmount(e.target.value)}
                    placeholder="أدخل المبلغ..."
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                  <small className="date-note">
                    المبلغ المدفوع من החבילה لهذه الجلسة
                  </small>
                </>
              ) : (
                <div className="text-red-500 font-medium text-sm py-2">
                  ❌ لا توجد חבילה
                </div>
              )}
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

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="btn primary"
              disabled={isProcessing || !selectedParts || selectedParts.length === 0}
            >
              {isProcessing ? "جاري الحفظ..." : `حفظ الجلسة (${selectedParts?.length || 0} منطقة)`}
            </button>
          </div>
        </form>
      </div>
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
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    if (!client?.idNumber) return;
    const sessionsRef = ref(db, `sessions/${client.idNumber}`);
    const unsub = onValue(sessionsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([id, s]) => ({ id, ...s }));
      
      // تحويل جميع أسماء المناطق في الجلسات إلى عربية
      const arabicSessions = arr.map(session => ({
        ...session,
        parts: convertSessionPartsToArabic(session.parts),
        partName: session.partName ? convertSessionPartsToArabic([session.partName])[0] : session.partName
      }));
      
      const byPart = {};
      arabicSessions.forEach((s) => {
        const part = s.partName || "عام";
        if (!byPart[part]) byPart[part] = [];
        byPart[part].push(s);
      });
      
      setSessionsByPart(byPart);
      setGroupedSessions(groupSessionsByDateArray(arabicSessions));
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

  const addSession = async (sessionData) => {
    // التحقق من وجود client و idNumber
    if (!client) {
      console.error('Client is missing:', client);
      return { success: false, message: "بيانات المريض غير موجودة. يرجى العودة واختيار المريض مرة أخرى." };
    }
    
    if (!client.idNumber) {
      console.error('Client idNumber is missing:', client);
      return { success: false, message: "رقم هوية المريض غير موجود. يرجى العودة واختيار المريض مرة أخرى." };
    }
    
    console.log('حفظ الجلسة للمريض:', { idNumber: client.idNumber, fullName: client.fullName });
    setIsProcessing(true);
    try {
      const refSessions = ref(db, `sessions/${client.idNumber}`);
      const newRef = push(refSessions);
      
      const sessionId = newRef.key;
      
      // استخدام المناطق من sessionData بدلاً من selectedParts من الـ state
      const partsToSave = sessionData.parts || selectedParts;
      
      const toSave = {
        ...sessionData,
        parts: partsToSave,
        partName: partsToSave.join(' + '),
        clientId: client.idNumber,
        clientName: client.fullName,
        timestamp: sessionData.timestamp || new Date().toISOString(),
        date: sessionData.date,
        gregorianDate: sessionData.gregorianDate,
        sessionId: sessionId,
        areasCount: partsToSave.length,
        areas: partsToSave,
        therapist: sessionData.therapist || "غير محدد",
        packageAmount: sessionData.packageAmount !== undefined && sessionData.packageAmount !== null ? sessionData.packageAmount : null
      };
      
      console.log('حفظ الجلسة مع packageAmount:', toSave.packageAmount);
      await set(newRef, toSave);
      onSaveSession?.(toSave);
      
      setSelectedParts([]);
      setShowSessionModal(false);
      return { success: true, message: `تمت إضافة جلسة بتاريخ ${sessionData.date} تشمل ${partsToSave.length} منطقة` };
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
              onClick={() => setShowSessionModal(true)}
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
        <div className="map-card">
          <div className="parts-selector-header">
            <h3>اختر المناطق المراد علاجها</h3>
            <p className="subtitle">اضغط على المنطقة لتحديدها أو إلغاء التحديد</p>
          </div>
          <BodyPartsSelector
            selectedParts={selectedParts}
            togglePart={togglePart}
          />
          {selectedParts.length > 0 && (
            <div className="selected-parts-summary">
              <div className="summary-header">
                <span className="summary-icon">✓</span>
                <span>المناطق المحددة ({selectedParts.length})</span>
              </div>
              <div className="selected-list">
                {selectedParts.map((p) => (
                  <span key={p} className="tag selected-tag">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
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
      </div>

      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        selectedParts={selectedParts}
        onSave={addSession}
        isProcessing={isProcessing}
        client={client}
      />
    </div>
  );
}