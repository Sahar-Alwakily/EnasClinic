// BodyMap3D.js - الإصدار النهائي مع إمكانية اختيار التاريخ
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { ref, set, push, onValue } from "firebase/database";
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
  setSelectedDiscounts
}) {
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState("نقدي");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("جزئي");
  const [therapist, setTherapist] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // التاريخ الافتراضي هو اليوم

  // دالة للحصول على السعر الصحيح بناءً على المنطقة بالعربية
  const getPartPrice = useCallback((arabicPart) => {
    if (!prices || Object.keys(prices).length === 0) {
      console.log('No prices available');
      return 0;
    }

    // تحويل المنطقة من العربية إلى الإنجليزية للبحث في الأسعار
    const englishPart = areaMaps.arToEn[arabicPart] || arabicPart;
    
    // جميع المفاتيح المحتملة للبحث
    const possibleKeys = [
      englishPart, // الاسم الإنجليزي المباشر
      englishPart.toLowerCase(), // بالإحرف الصغيرة
      arabicPart, // الاسم العربي الأصلي
      // البحث في جميع الأشكال المحتملة
      ...Object.keys(prices).filter(key => 
        key.toLowerCase() === englishPart.toLowerCase() ||
        key.toLowerCase().includes(englishPart.toLowerCase()) || 
        englishPart.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(arabicPart.toLowerCase()) ||
        arabicPart.toLowerCase().includes(key.toLowerCase())
      )
    ].filter(Boolean);

    console.log(`🔍 البحث عن سعر المنطقة: "${arabicPart}" (إنجليزي: "${englishPart}")`);
    console.log('🔑 المفاتيح المحتملة:', possibleKeys);
    console.log('💰 الأسعار المتاحة:', prices);

    for (const key of possibleKeys) {
      if (prices[key] !== undefined && prices[key] !== null && prices[key] !== "") {
        const priceValue = parseInt(prices[key]);
        if (!isNaN(priceValue) && priceValue > 0) {
          console.log(`✅ تم العثور على سعر المنطقة "${arabicPart}": ${priceValue} ₪ (مفتاح: ${key})`);
          return priceValue;
        }
      }
    }

    // محاولة البحث بالاسم الإنجليزي من خرائط النموذج
    const modelEnglishNames = Object.entries(modelPartNames)
      .filter(([en, ar]) => ar === arabicPart)
      .map(([en, ar]) => en);
    
    for (const modelName of modelEnglishNames) {
      for (const key of Object.keys(prices)) {
        if (key.toLowerCase() === modelName.toLowerCase()) {
          const priceValue = parseInt(prices[key]);
          if (!isNaN(priceValue) && priceValue > 0) {
            console.log(`✅ تم العثور على السعر عبر اسم النموذج: "${arabicPart}": ${priceValue} ₪`);
            return priceValue;
          }
        }
      }
    }

    console.log(`❌ لم يتم العثور على سعر صالح للمنطقة: "${arabicPart}"`);
    return 0;
  }, [prices]);

  const totalPrice = useMemo(() => {
    if (!prices || selectedParts.length === 0) return 0;
    
    const calculatedTotal = selectedParts.reduce((total, part) => {
      const price = getPartPrice(part);
      console.log(`🧮 ${part}: ${price} ₪`);
      return total + price;
    }, 0);

    console.log(`🏷️ المجموع الكلي: ${calculatedTotal} ₪`);
    return calculatedTotal;
  }, [selectedParts, prices, getPartPrice]);

  // حساب السعر بعد التخفيضات
  const discountedPrice = useMemo(() => {
    if (selectedDiscounts.length === 0) return totalPrice;

    let finalPrice = totalPrice;
    
    // تفريق بين تخفيضات الجسم كامل وتخفيضات المناطق
    const fullBodyDiscount = selectedDiscounts.find(d => d === 'fullbody');
    const areaDiscounts = selectedDiscounts.filter(d => d !== 'fullbody');

    // أولاً: تطبيق تخفيضات المناطق المحددة على أسعارها فقط
    if (areaDiscounts.length > 0) {
      let areaTotal = 0;
      
      selectedParts.forEach(part => {
        let partPrice = getPartPrice(part);
        
        // البحث عن تخفيض لهذه المنطقة بالتحديد
        const partDiscount = areaDiscounts.find(discountKey => {
          const discount = applicableDiscounts.find(d => d && d.area === discountKey);
          if (!discount) return false;
          
          // تحويل اسم المنطقة في التخفيض إلى عربي للمقارنة
          const discountAreaAr = areaMaps.enToAr[discount.area] || discount.area;
          return discountAreaAr === part;
        });
        
        if (partDiscount) {
          const discount = applicableDiscounts.find(d => d && d.area === partDiscount);
          if (discount) {
            if (discount.type === 'percentage') {
              partPrice = partPrice * (1 - discount.value / 100);
            } else {
              partPrice = Math.max(0, partPrice - discount.value);
            }
            console.log(`🎯 تطبيق تخفيض ${discount.type === 'percentage' ? discount.value + '%' : discount.value + '₪'} على منطقة ${part}: ${partPrice} ₪`);
          }
        }
        
        areaTotal += partPrice;
      });
      
      finalPrice = areaTotal;
    }

    // ثانياً: تطبيق تخفيض الجسم كامل على المجموع النهائي
    if (fullBodyDiscount) {
      const discount = applicableDiscounts.find(d => d && d.area === 'fullbody');
      if (discount) {
        if (discount.type === 'percentage') {
          finalPrice = finalPrice * (1 - discount.value / 100);
        } else {
          finalPrice = Math.max(0, finalPrice - discount.value);
        }
        console.log(`👤 تطبيق تخفيض الجسم كامل ${discount.type === 'percentage' ? discount.value + '%' : discount.value + '₪'}: ${finalPrice} ₪`);
      }
    }

    const final = Math.max(0, Math.round(finalPrice));
    console.log(`💰 السعر النهائي بعد كل التخفيضات: ${final} ₪ (من ${totalPrice} ₪)`);
    return final;
  }, [totalPrice, selectedDiscounts, applicableDiscounts, selectedParts, getPartPrice]);

  const remainingAmount = useMemo(() => {
    const paid = parseInt(paidAmount || "0");
    return Math.max(0, discountedPrice - paid);
  }, [discountedPrice, paidAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // تحويل التاريخ المحدد إلى تنسيقات مختلفة
    const selectedDateObj = new Date(selectedDate);
    const formattedDate = selectedDateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const gregorianDate = selectedDate; // YYYY-MM-DD
    
    const sessionData = {
      notes,
      paymentType,
      amount: discountedPrice.toString(),
      paidAmount: paidAmount || "0",
      remainingAmount: remainingAmount.toString(),
      paymentStatus: paidAmount >= discountedPrice ? "كامل" : "جزئي",
      parts: selectedParts,
      date: formattedDate,
      gregorianDate: gregorianDate,
      therapist: therapist.trim(),
      appliedDiscounts: selectedDiscounts,
      originalPrice: totalPrice.toString(),
      discountedPrice: discountedPrice.toString(),
      timestamp: selectedDateObj.toISOString() // استخدام التاريخ المحدد للوقت
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
            <div className="selected-parts-list">
              {selectedParts.map((part, index) => {
                const price = getPartPrice(part);
                return (
                  <div key={index} className="part-item">
                    <span className="part-name">{part}</span>
                    <span className="part-price">{price} ₪</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* قسم التخفيضات */}
          {applicableDiscounts.length > 0 && (
            <div className="form-section">
              <label className="section-label">التخفيضات المتاحة</label>
              <div className="discounts-list">
                {applicableDiscounts.map(discount => (
                  <div key={discount.area} className="discount-item">
                    <label className="discount-label">
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(discount.area)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDiscounts(prev => [...prev, discount.area]);
                          } else {
                            setSelectedDiscounts(prev => prev.filter(d => d !== discount.area));
                          }
                        }}
                      />
                      <span className="discount-text">
                        {discount.area === 'fullbody' ? (
                          <>
                            <strong>👤 الجسم كامل</strong> - {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
                            <span className="discount-note"> (على المجموع الكلي)</span>
                          </>
                        ) : (
                          <>
                            {areaMaps.enToAr[discount.area] || discount.area} - {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
                            <span className="discount-note"> (على المنطقة فقط)</span>
                          </>
                        )}
                        {discount.minSessions > 1 && ` (لـ ${discount.minSessions} جلسات فأكثر)`}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ملخص السعر مع التخفيضات */}
          <div className="price-summary">
            <div className="price-row">
              <span>المجموع:</span>
              <span className="total-price">{totalPrice} ₪</span>
            </div>
            
            {selectedDiscounts.length > 0 && (
              <>
                <div className="price-row discount">
                  <span>التخفيضات:</span>
                  <span className="discount-amount">-{totalPrice - discountedPrice} ₪</span>
                </div>
                <div className="price-row final">
                  <span>السعر النهائي:</span>
                  <span className="final-price">{discountedPrice} ₪</span>
                </div>
              </>
            )}
          </div>

          <div className="form-section">
            <label className="section-label">معلومات الدفع</label>
            
            <div className="input-group">
              <label>نوع الدفع:</label>
              <select 
                value={paymentType} 
                onChange={(e) => setPaymentType(e.target.value)}
                className="form-input"
              >
                <option value="نقدي">نقدي</option>
                <option value="بطاقة">بطاقة</option>
                <option value="تحويل">تحويل بنكي</option>
              </select>
            </div>

            <div className="input-group">
              <label>المبلغ المدفوع:</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                className="form-input"
                min="0"
                max={discountedPrice}
              />
            </div>

            {paidAmount > 0 && (
              <div className="payment-status">
                <div className="status-row">
                  <span>المبلغ المتبقي:</span>
                  <span className={`amount ${remainingAmount > 0 ? 'remaining' : 'paid'}`}>
                    {remainingAmount} ₪
                  </span>
                </div>
                <div className="status-row">
                  <span>حالة الدفع:</span>
                  <span className={`status ${remainingAmount === 0 ? 'success' : 'warning'}`}>
                    {remainingAmount === 0 ? 'مدفوع بالكامل' : 'مدفوع جزئياً'}
                  </span>
                </div>
              </div>
            )}
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
                max={new Date().toISOString().split('T')[0]} // لا يمكن اختيار تاريخ في المستقبل
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
              className="btn primary"
              disabled={isProcessing || selectedParts.length === 0}
            >
              {isProcessing ? "جاري الحفظ..." : `حفظ الجلسات (${selectedParts.length})`}
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
    console.log('🔄 جلب الأسعار من Firebase...');
    const unsub = onValue(pricesRef, (snap) => {
      const pricesData = snap.val() || {};
      console.log('✅ تم تحميل الأسعار:', pricesData);
      console.log('📊 مفاتيح الأسعار:', Object.keys(pricesData));
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
        console.log('🎁 التخفيضات المحملة:', discountsData);
        setDiscounts(discountsData);
      } else {
        console.log('لا توجد تخفيضات');
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
      
      // تخفيض الجسم كامل - متاح دائماً إذا كان هناك مناطق محددة
      if (discount.area === 'fullbody') {
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

    console.log('🎯 التخفيضات المتاحة:', availableDiscounts);
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
      
      const toSave = {
        ...sessionData,
        parts: selectedParts,
        partName: selectedParts.join(' + '),
        clientId: client.idNumber,
        clientName: client.fullName,
        timestamp: sessionData.timestamp || new Date().toISOString(), // استخدام وقت الجلسة المحدد
        date: sessionData.date,
        gregorianDate: sessionData.gregorianDate,
        sessionId: sessionId,
        paidAmount: sessionData.paidAmount || "0",
        remainingAmount: sessionData.remainingAmount || sessionData.amount,
        paymentStatus: sessionData.paymentStatus || "غير مدفوع",
        areasCount: selectedParts.length,
        areas: selectedParts,
        therapist: sessionData.therapist || "غير محدد",
        appliedDiscounts: selectedDiscounts, // حفظ بالإنجليزية للبحث
        appliedDiscountsArabic: arabicDiscounts, // حفظ بالعربية للعرض
        originalPrice: sessionData.originalPrice || "0",
        discountedPrice: sessionData.discountedPrice || sessionData.amount || "0"
      };
      
      await set(newRef, toSave);
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
      />
    </div>
  );
}