// BodyMap3D.js - الإصدار النهائي مع إمكانية اختيار التاريخ وإضافة الحزم
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
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
    'الكوع': 'elbow',
    'الذراع': 'arm',
    'الإبط': 'armpit',
    'الرقبة': 'neck',
    'الوجه': 'face',
    'اليد': 'hand',
    'القدمين': 'feet',
    'الساق': 'shin',
    'الجسم كامل': 'fullbody',
    'العانة': 'bikiniArea'
  },
  
  // الإنجليزية ← العربية
  enToAr: {
    'abdomen': 'البطن',
    'bikiniArea': 'منطقة البيكيني',
    'thighs': 'الفخذين',
    'back': 'الظهر',
    'elbow': 'الكوع',
    'arm': 'الذراع',
    'armpit': 'الإبط',
    'neck': 'الرقبة',
    'face': 'الوجه',
    'hand': 'اليد',
    'feet': 'القدمين',
    'shin': 'الساق',
    'fullbody': 'الجسم كامل',
    'body': 'الجسم كامل',
    'stomach': 'البطن',
    'leg': 'الساق',
    'arms': 'الذراع',
    'hands': 'اليد',
    'foot': 'القدمين',
    'Thighs': 'الفخذين',
    'Shin': 'الساق',
    'Back': 'الظهر',
    'Abdomen': 'البطن'
  }
};

// أسماء المناطق المستخدمة في النموذج 3D (يجب أن تتطابق مع أسماء الـ meshes في model.glb)
const modelPartNames = {
  // منطقة البطن
  'Abdomen': 'البطن',
  'abdomen': 'البطن',
  'stomach': 'البطن',
  
  // منطقة البيكيني
  'BikiniArea': 'منطقة البيكيني',
  'bikiniArea': 'منطقة البيكيني',
  'bikini': 'منطقة البيكيني',
  
  // الفخذين
  'Thighs': 'الفخذين',
  'thighs': 'الفخذين',
  'thigh': 'الفخذين',
  
  // الظهر
  'Back': 'الظهر',
  'back': 'الظهر',
  
  // الكوع
  'Elbow': 'الكوع',
  'elbow': 'الكوع',
  
  // الذراع
  'Arm': 'الذراع',
  'arm': 'الذراع',
  'arms': 'الذراع',
  
  // الإبط
  'Armpit': 'الإبط',
  'armpit': 'الإبط',
  'underarm': 'الإبط',
  
  // الرقبة
  'Neck': 'الرقبة',
  'neck': 'الرقبة',
  
  // الوجه
  'Face': 'الوجه',
  'face': 'الوجه',
  
  // اليد
  'Hand': 'اليد',
  'hand': 'اليد',
  'hands': 'اليد',
  
  // القدمين
  'Feet': 'القدمين',
  'feet': 'القدمين',
  'foot': 'القدمين',
  
  // الساق
  'Shin': 'الساق',
  'shin': 'الساق',
  'legs': 'الساق',
  
  // الجسم كامل
  'Fullbody': 'الصدر ',
  'fullbody': ' الصدر',
  'body': ' الصدر'
};

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

/* ----------------- WomanModel (3D) ----------------- */
function WomanModel({ selectedParts = [], togglePart }) {
  const { scene } = useGLTF("/model.glb");
  
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        
        // تحويل اسم المنطقة من الإنجليزية إلى العربية
        const arabicName = modelPartNames[child.name] || child.name;
        const isSelected = selectedParts.includes(arabicName);
        const color = isSelected ? COLORS.primary : "#eeeeee";
        
        try {
          child.material.color.set(color);
          child.material.needsUpdate = true;
        } catch (e) {
          console.log("Error updating material for:", child.name, e);
        }
      }
    });
  }, [scene, selectedParts]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const name = e.object?.name;
      if (name) {
        // تحويل اسم المنطقة إلى العربية قبل إرساله
        const arabicName = modelPartNames[name] || name;
        togglePart(arabicName);
      }
    },
    [togglePart]
  );

  if (!scene) return null;
  
  return (
    <primitive
      object={scene}
      onClick={handleClick}
      scale={0.35}
      position={[0, -1.25, 0]}
    />
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

  // دالة لتحويل حالة الدفع إلى نص عربي
  const getPaymentStatusText = (status) => {
    if (!status) return 'غير محدد';
    
    const statusMap = {
      'كامل': '✅ مدفوع بالكامل',
      'full': '✅ مدفوع بالكامل',
      'paid': '✅ مدفوع بالكامل',
      'جزئي': '💰 مدفوع جزئياً',
      'partial': '💰 مدفوع جزئياً',
      'unpaid': '❌ غير مدفوع',
      'غير مدفوع': '❌ غير مدفوع'
    };
    
    return statusMap[status] || status;
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
                <div className="session-header">
                  <div className="session-time">
                    <span className="time-icon">🕐</span>
                    {formatTime(s.timestamp)}
                  </div>
                  <div className="session-status">
                    <span className={`status-badge ${s.paymentStatus === 'كامل' || s.paymentStatus === 'full' || s.paymentStatus === 'paid' ? 'paid' : 
                                     s.paymentStatus === 'جزئي' || s.paymentStatus === 'partial' ? 'partial' : 'unpaid'}`}>
                      {getPaymentStatusText(s.paymentStatus)}
                    </span>
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
                  <div className="session-meta">
                    {s.amount && <span className="meta">💵 {s.amount} ₪</span>}
                    {s.paymentType && (
                      <span className="meta">• {s.paymentType}</span>
                    )}
                  </div>
                </div>
                
                {s.appliedDiscounts && s.appliedDiscounts.length > 0 && (
                  <div className="session-discounts">
                    <span className="discount-icon">🎯</span>
                    {s.appliedDiscounts.map((discount, idx) => (
                      <span key={idx} className="discount-tag">
                        {areaMaps.enToAr[discount] || discount}
                      </span>
                    ))}
                  </div>
                )}
                
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
                  
                  {s.originalPrice && s.discountedPrice && 
                   parseInt(s.originalPrice) > parseInt(s.discountedPrice) && (
                    <div className="price-info">
                      <span className="original-price">{s.originalPrice} ₪</span>
                      <span className="discount-arrow">→</span>
                      <span className="final-price">{s.discountedPrice} ₪</span>
                    </div>
                  )}
                  
                  {s.paidAmount && parseInt(s.paidAmount) > 0 && (
                    <div className="payment-info">
                      <span className="paid-amount">💰 مدفوع: {s.paidAmount} ₪</span>
                      {s.remainingAmount && parseInt(s.remainingAmount) > 0 && (
                        <span className="remaining-amount"> | متبقي: {s.remainingAmount} ₪</span>
                      )}
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
  applicableDiscounts = [],
  selectedDiscounts = [],
  setSelectedDiscounts,
  clientId,
  updateRemainingSessions
}) {
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState("نقدي");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("كامل");
  const [therapist, setTherapist] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // إزالة الحساب التلقائي للسعر
  // سيتم إدخال المبلغ يدوياً من قبل المستخدم

  // البحث عن حزمة في التخفيضات المختارة
  const packageDiscount = useMemo(() => {
    return applicableDiscounts.find(d => 
      d.type === 'package' && selectedDiscounts.includes(d.area)
    );
  }, [applicableDiscounts, selectedDiscounts]);

  // إذا كانت هناك حزمة، المبلغ = 0 (مدفوع مسبقاً)
  // وإلا يترك للمستخدم إدخال المبلغ يدوياً
  const finalPrice = useMemo(() => {
    if (packageDiscount) {
      return 0;
    }
    // إرجاع المبلغ المدخل يدوياً
    return parseInt(paidAmount || "0");
  }, [packageDiscount, paidAmount]);

  const remainingAmount = useMemo(() => {
    // لا يوجد حساب للمبلغ المتبقي لأن السعر غير محسوب تلقائياً
    return 0;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // تحويل التاريخ المحدد إلى تنسيقات مختلفة
    const selectedDateObj = new Date(selectedDate);
    const formattedDate = selectedDateObj.toLocaleDateString('en-GB');
    const gregorianDate = selectedDate;
    
    let sessionsUsed = 0;
    let remainingPackageSessions = null;
    let packageDiscount = null;
    
    // البحث عن حزمة في التخفيضات المختارة
    selectedDiscounts.forEach(discountKey => {
      const discount = applicableDiscounts.find(d => d && d.area === discountKey);
      if (discount && discount.type === 'package') {
        packageDiscount = discount;
      }
    });
    
    // إذا كان هناك حزمة، تحديث الجلسات المتبقية
    if (packageDiscount && updateRemainingSessions) {
      sessionsUsed = 1;
      remainingPackageSessions = (packageDiscount.remainingSessions || packageDiscount.packageSessions) - 1;
      await updateRemainingSessions(packageDiscount.area, sessionsUsed);
    }
    
    // إذا كانت هناك حزمة، المبلغ المدفوع = 0
    // وإلا استخدم المبلغ المدخل يدوياً
    const actualPaidAmount = packageDiscount ? "0" : (paidAmount || "0");
    
    const sessionData = {
      notes,
      paymentType: packageDiscount ? "حزمة مدفوعة" : paymentType,
      amount: actualPaidAmount, // استخدام المبلغ المدخل يدوياً
      paidAmount: actualPaidAmount,
      remainingAmount: "0", // لا يوجد متبقي في هذا النموذج
      paymentStatus: packageDiscount ? "كامل" : (actualPaidAmount > 0 ? "كامل" : "غير مدفوع"),
      parts: selectedParts,
      date: formattedDate,
      gregorianDate: gregorianDate,
      therapist: therapist.trim(),
      appliedDiscounts: packageDiscount ? [packageDiscount.area] : selectedDiscounts,
      originalPrice: actualPaidAmount, // نفس المبلغ المدخل
      discountedPrice: actualPaidAmount, // نفس المبلغ المدخل
      timestamp: selectedDateObj.toISOString(),
      sessionsUsed: sessionsUsed,
      packageName: packageDiscount ? packageDiscount.areaName : null,
      remainingPackageSessions: remainingPackageSessions,
      isPackageSession: !!packageDiscount
    };

    onSave(sessionData);
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

          {/* قسم التخفيضات والحزم */}
          {applicableDiscounts.length > 0 && (
            <div className="form-section">
              <label className="section-label">العروض المتاحة</label>
              <div className="discounts-list">
                {applicableDiscounts.map(discount => {
                  const remainingSessions = discount.remainingSessions || discount.packageSessions;
                  
                  return (
                    <div key={discount.area} className={`discount-item ${discount.type === 'package' ? 'package-item' : ''}`}>
                      <label className="discount-label">
                        <input
                          type="checkbox"
                          checked={selectedDiscounts.includes(discount.area)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // إذا كان حزمة، لا يمكن اختياره مع تخفيضات أخرى
                              if (discount.type === 'package') {
                                setSelectedDiscounts([discount.area]);
                                setPaidAmount("0"); // تعيين المبلغ إلى 0 تلقائياً
                              } else {
                                // إذا كان تخفيض عادي، إزالة أي حزمة مختارة
                                setSelectedDiscounts(prev => 
                                  [...prev.filter(d => {
                                    const dObj = applicableDiscounts.find(ad => ad.area === d);
                                    return dObj?.type !== 'package';
                                  }), discount.area]
                                );
                              }
                            } else {
                              setSelectedDiscounts(prev => prev.filter(d => d !== discount.area));
                              // إذا كانت الحزمة هي التي تم إلغاؤها، إعادة تفعيل حقل المبلغ
                              if (discount.type === 'package') {
                                setPaidAmount("");
                              }
                            }
                          }}
                        />
                        <span className="discount-text">
                          {discount.type === 'package' ? (
                            <>
                              <strong>📦 {discount.areaName}</strong>
                              <div className="package-details-small">
                                <span>{discount.packageSessions} جلسة مدفوعة مسبقاً</span>
                                <span className="remaining-sessions">
                                  ⏳ متبقي: {remainingSessions} جلسة
                                </span>
                              </div>
                            </>
                          ) : discount.area === 'fullbody' ? (
                            <>
                              <strong>👤 الجسم كامل</strong> - {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
                              <span className="discount-note"> (تخفيض على المجموع الكلي)</span>
                            </>
                          ) : (
                            <>
                              {areaMaps.enToAr[discount.area] || discount.area} - {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
                              <span className="discount-note"> (تخفيض على المنطقة فقط)</span>
                            </>
                          )}
                          {discount.minSessions > 1 && ` (لـ ${discount.minSessions} مناطق فأكثر)`}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* عرض معلومات الحزمة إذا كانت مختارة */}
          {packageDiscount && (
            <div className="package-info-section">
              <div className="package-header">
                <span className="package-icon">📦</span>
                <h4>حزمة مدفوعة مسبقاً</h4>
              </div>
              <div className="package-details-card">
                <div className="package-row">
                  <span>اسم الحزمة:</span>
                  <strong>{packageDiscount.areaName}</strong>
                </div>
                <div className="package-row">
                  <span>إجمالي الجلسات:</span>
                  <strong>{packageDiscount.packageSessions} جلسة</strong>
                </div>
                <div className="package-row">
                  <span>الجلسات المتبقية قبل هذه الجلسة:</span>
                  <strong className="remaining-before">{packageDiscount.remainingSessions || packageDiscount.packageSessions} جلسة</strong>
                </div>
                <div className="package-row">
                  <span>سيكون المتبقي بعد هذه الجلسة:</span>
                  <strong className="remaining-after">
                    {(packageDiscount.remainingSessions || packageDiscount.packageSessions) - 1} جلسة
                  </strong>
                </div>
              </div>
              <div className="package-note">
                ✅ هذه الجلسة مدفوعة مسبقاً كجزء من الحزمة
              </div>
            </div>
          )}

          {/* قسم معلومات الدفع - يظهر دائماً */}
          <div className="form-section">
            <label className="section-label">معلومات الدفع</label>
            
            <div className="input-group">
              <label>نوع الدفع:</label>
              <select 
                value={paymentType} 
                onChange={(e) => setPaymentType(e.target.value)}
                className="form-input"
                disabled={packageDiscount} // تعطيل إذا كانت حزمة
              >
                <option value="نقدي">نقدي</option>
                <option value="بطاقة">بطاقة</option>
                <option value="تحويل">تحويل بنكي</option>
                <option value="حزمة">حزمة مدفوعة</option>
              </select>
            </div>

            <div className="input-group">
              <label>المبلغ المدفوع:</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="أدخل المبلغ المدفوع..."
                className="form-input"
                min="0"
                disabled={packageDiscount} // تعطيل إذا كانت حزمة
                required={!packageDiscount} // مطلوب إذا لم تكن حزمة
              />
              {!packageDiscount && (
                <small className="input-note">
                  أدخل المبلغ المدفوع لهذه الجلسة
                </small>
              )}
            </div>

            {!packageDiscount && paidAmount && (
              <div className="payment-status">
                <div className="status-row">
                  <span>المبلغ المدخل:</span>
                  <span className="amount">{paidAmount} ₪</span>
                </div>
                <div className="status-row">
                  <span>حالة الدفع:</span>
                  <span className={`status ${parseInt(paidAmount) > 0 ? 'success' : 'warning'}`}>
                    {parseInt(paidAmount) > 0 ? 'مدفوع' : 'غير مدفوع'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* إذا كانت هناك حزمة، إظهار رسالة بدلاً من معلومات الدفع */}
          {packageDiscount && (
            <div className="form-section">
              <div className="package-payment-info">
                <div className="payment-icon">✅</div>
                <div className="payment-message">
                  <h4>مدفوع مسبقاً</h4>
                  <p>هذه الجلسة مدفوعة كجزء من الحزمة. سيتم خصم جلسة واحدة من رصيد الجلسات المتبقية.</p>
                </div>
              </div>
            </div>
          )}

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
              className={`btn ${packageDiscount ? 'package' : 'primary'}`}
              disabled={isProcessing || selectedParts.length === 0 || (!packageDiscount && !paidAmount)}
            >
              {isProcessing ? "جاري الحفظ..." : 
               packageDiscount ? `حفظ الجلسة من الحزمة (${selectedParts.length} منطقة)` : 
               `حفظ الجلسة (${paidAmount} ₪)`}
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
  const [prices, setPrices] = useState({});
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [applicableDiscounts, setApplicableDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [discounts, setDiscounts] = useState({});

  // جلب الأسعار من Firebase
  useEffect(() => {
    const pricesRef = ref(db, 'prices');
    const unsub = onValue(pricesRef, (snap) => {
      const pricesData = snap.val() || {};
      setPrices(pricesData);
    }, (error) => {
      console.error('❌ خطأ في تحميل الأسعار:', error);
    });
    return () => unsub();
  }, []);

  // جلب التخفيضات من Firebase
  useEffect(() => {
    const discountsRef = ref(db, 'discounts');
    const unsub = onValue(discountsRef, (snapshot) => {
      if (snapshot.exists()) {
        const discountsData = snapshot.val();
        setDiscounts(discountsData);
      } else {
        setDiscounts({});
      }
    });
    return () => unsub();
  }, []);

  // حساب التخفيضات المتاحة
  useEffect(() => {
    if (!discounts || selectedParts.length === 0) {
      setApplicableDiscounts([]);
      return;
    }

    const today = new Date();
    const availableDiscounts = [];

    // تحويل discounts إلى مصفوفة
    const discountsArray = Array.isArray(discounts) ? discounts : Object.values(discounts);
    
    discountsArray.forEach(discount => {
      if (!discount) return;
      
      // التحقق من أن التخفيض نشط
      if (discount.isActive === false) return;
      
      // التحقق من تاريخ الصلاحية
      if (discount.validUntil) {
        try {
          const validDate = new Date(discount.validUntil);
          if (validDate < today) return;
        } catch (error) {
          console.error('Invalid date format:', discount.validUntil);
        }
      }
      
      // إذا كان التخفيض حزمة (package)، فهو متاح دائماً
      if (discount.type === 'package') {
        // التحقق من وجود جلسات متبقية
        const remaining = discount.remainingSessions || discount.packageSessions;
        if (remaining > 0) {
          availableDiscounts.push(discount);
        }
      }
      // تخفيض الجسم كامل - متاح دائماً إذا كان هناك مناطق محددة
      else if (discount.area === 'fullbody') {
        availableDiscounts.push(discount);
      } 
      // تخفيضات المناطق - متاحة فقط إذا كانت المنطقة مطابقة
      else {
        const hasMatchingArea = selectedParts.some(arabicPart => {
          // تحويل المنطقة المحددة (بالعربي) إلى إنجليزي للمقارنة
          const englishPart = areaMaps.arToEn[arabicPart] || arabicPart;
          const partKey = englishPart.toLowerCase();
          return partKey === discount.area;
        });
        
        if (hasMatchingArea) {
          availableDiscounts.push(discount);
        }
      }
    });

    setApplicableDiscounts(availableDiscounts);
    setSelectedDiscounts([]);
  }, [selectedParts, discounts]);

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

  // دالة لتحديث الجلسات المتبقية في الحزمة
// BodyMap3D.js - تحديث دالة updateRemainingSessions

// دالة لتحديث الجلسات المتبقية في الحزمة
const updateRemainingSessions = async (areaKey, sessionsUsed = 1) => {
  try {
    const discountRef = ref(db, `discounts/${areaKey}`);
    onValue(discountRef, (snapshot) => {
      if (snapshot.exists()) {
        const discount = snapshot.val();
        const currentRemaining = discount.remainingSessions || discount.packageSessions;
        const newRemaining = Math.max(0, currentRemaining - sessionsUsed);
        
        // تحديث عدد الجلسات المتبقية - يجب أن يكون كائنًا
        const updates = {
          remainingSessions: newRemaining
        };
        
        // إذا نفذت الجلسات، تعطيل التخفيض تلقائياً
        if (newRemaining === 0) {
          updates.isActive = false;
        }
        
        // استخدام update مع كائن التحديثات
        update(ref(db, `discounts/${areaKey}`), updates);
      }
    }, { onlyOnce: true });
  } catch (error) {
    console.error('Error updating remaining sessions:', error);
  }
};

// BodyMap3D.js - تحديث دالة addSession لإضافة دفعة للحزم

const addSession = async (sessionData) => {
  if (!client?.idNumber)
    return { success: false, message: "client id missing" };
  setIsProcessing(true);
  try {
    const refSessions = ref(db, `sessions/${client.idNumber}`);
    const newRef = push(refSessions);
    
    const sessionId = newRef.key;
    
    // تحويل أسماء التخفيضات إلى عربية للعرض
    const arabicDiscounts = selectedDiscounts.map(discount => 
      areaMaps.enToAr[discount] || discount
    );
    
    // تحقق إذا كانت هناك حزمة مختارة
    const isPackageSession = selectedDiscounts.some(discountKey => {
      const discount = applicableDiscounts.find(d => d && d.area === discountKey);
      return discount?.type === 'package';
    });
    
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
      paidAmount: sessionData.paidAmount || "0",
      remainingAmount: sessionData.remainingAmount || sessionData.amount,
      paymentStatus: sessionData.paymentStatus || "غير مدفوع",
      areasCount: selectedParts.length,
      areas: selectedParts,
      therapist: sessionData.therapist || "غير محدد",
      appliedDiscounts: selectedDiscounts,
      appliedDiscountsArabic: arabicDiscounts,
      originalPrice: sessionData.originalPrice || "0",
      discountedPrice: sessionData.discountedPrice || sessionData.amount || "0",
      sessionsUsed: sessionData.sessionsUsed || 0,
      packageName: sessionData.packageName,
      remainingPackageSessions: sessionData.remainingPackageSessions,
      isPackageSession: isPackageSession // إضافة هذه العلامة
    };
    
    await set(newRef, toSave);
    
    // إذا كانت هناك حزمة، أضف دفعة في قسم payments
    if (isPackageSession) {
      const packageDiscount = applicableDiscounts.find(d => 
        d && d.type === 'package' && selectedDiscounts.includes(d.area)
      );
      
      if (packageDiscount) {
        const paymentRef = push(ref(db, 'payments'));
        const paymentData = {
          patientId: client.idNumber,
          patientName: client.fullName,
          paidAmount: 0, // لأن الحزمة مدفوعة مسبقاً
          paymentDate: sessionData.timestamp || new Date().toISOString(),
          paymentType: 'حزمة مدفوعة مسبقاً',
          description: `جلسة من حزمة ${packageDiscount.areaName || packageDiscount.area}`,
          status: 'مكتمل',
          previousRemaining: 0,
          newRemaining: 0,
          sessionId: sessionId,
          packageName: packageDiscount.areaName,
          remainingPackageSessions: sessionData.remainingPackageSessions,
          isPackagePayment: true // علامة للتمييز
        };
        
        await set(paymentRef, paymentData);
      }
    }
    
    onSaveSession?.(toSave);
    
    setSelectedParts([]);
    setShowSessionModal(false);
    setSelectedDiscounts([]);
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
          <Canvas camera={{ position: [0, 1.8, 3.8], fov: 50 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 4, 3]} intensity={1.0} />
            <WomanModel
              selectedParts={selectedParts}
              togglePart={togglePart}
            />
            <OrbitControls
              enablePan={false}
              minPolarAngle={Math.PI / 3.4}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
          <div className="map-footer">
            <div className="legend">
              <span className="dot selected" /> : محدد
              <span className="dot normal" /> : غير محدد
            </div>
            <div className="selected-list">
              {selectedParts.map((p) => (
                <span key={p} className="tag">
                  {p}
                </span>
              ))}
            </div>
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
      </div>

      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        selectedParts={selectedParts}
        onSave={addSession}
        prices={prices}
        isProcessing={isProcessing}
        applicableDiscounts={applicableDiscounts}
        selectedDiscounts={selectedDiscounts}
        setSelectedDiscounts={setSelectedDiscounts}
        clientId={client?.idNumber}
        updateRemainingSessions={updateRemainingSessions}
      />
    </div>
  );
}