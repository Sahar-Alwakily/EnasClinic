// BodyMap3D.js - الإصدار المصحح بالكامل
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

// خريطة أسماء المناطق - مصححة وموسعة
const areaNameMap = {
  'Abdomen': 'abdomen',
  'BikiniArea': 'bikiniArea', 
  'Thighs': 'thighs',
  'Back': 'back',
  'Elbow': 'elbow',
  'Arm': 'arm',
  'Armpit': 'armpit',
  'Neck': 'neck',
  'Face': 'face',
  'Hand': 'hand',
  'Feet': 'feet',
  'Shin': 'shin',
  'Fullbody': 'fullbody',
  'body': 'fullbody'
};

// خريطة الأسعار العكسية للبحث
const reverseAreaMap = {
  'abdomen': 'Abdomen',
  'bikiniarea': 'BikiniArea',
  'thighs': 'Thighs',
  'back': 'Back',
  'elbow': 'Elbow',
  'arm': 'Arm',
  'armpit': 'Armpit',
  'neck': 'Neck',
  'face': 'Face',
  'hand': 'Hand',
  'feet': 'Feet',
  'shin': 'Shin',
  'fullbody': 'Fullbody'
};

/* ----------------- WomanModel (3D) ----------------- */
function WomanModel({ selectedParts = [], togglePart }) {
  const { scene } = useGLTF("/model.glb");
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        const isSelected = selectedParts.includes(child.name);
        const color = isSelected ? COLORS.primary : "#eeeeee";
        try {
          child.material.color.set(color);
          child.material.needsUpdate = true;
        } catch {}
      }
    });
  }, [scene, selectedParts]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const name = e.object?.name;
      if (name) togglePart(name);
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
    const dateKey =
      s.date ||
      (s.timestamp
        ? new Date(s.timestamp).toLocaleDateString("ar-SA")
        : "بدون تاريخ");
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  });
  return Object.keys(grouped)
    .map((d) => ({ date: d, sessions: grouped[d] }))
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db - da;
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

  return (
    <div className="timeline">
      {groupedDates.map((group) => (
        <div key={group.date} className="timeline-item">
          <div className="timeline-left">
            <div className="date-badge">{group.date}</div>
            <div className="vline" />
          </div>
          <div className="timeline-right">
            {group.sessions.map((s) => (
              <div key={s.id || s.timestamp} className="session-card">
                <div className="session-row">
                  <div className="session-parts">
                    {(s.partName ? [s.partName] : s.parts || []).map((p, i) => (
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
                {s.notes && <div className="notes">📝 {s.notes}</div>}
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

  // دالة محسنة للحصول على السعر الصحيح
  const getPartPrice = useCallback((part) => {
    if (!prices || Object.keys(prices).length === 0) {
      console.log('No prices available');
      return 0;
    }

    // جميع المفاتيح المحتملة للبحث
    const possibleKeys = [
      part, // الاسم الأصلي
      areaNameMap[part], // الاسم المعرب
      part.toLowerCase(), // بالأحرف الصغيرة
      areaNameMap[part]?.toLowerCase(), // المعرب بالأحرف الصغيرة
      reverseAreaMap[part?.toLowerCase()], // البحث العكسي
      // محاولة مطابقة جزئية
      ...Object.keys(prices).filter(key => 
        key.toLowerCase().includes(part.toLowerCase()) || 
        part.toLowerCase().includes(key.toLowerCase())
      )
    ].filter(Boolean); // إزالة القيم الفارغة

    console.log(`🔍 Searching price for: "${part}"`);
    console.log('🔑 Possible keys:', possibleKeys);
    console.log('💰 Available prices:', prices);

    for (const key of possibleKeys) {
      if (prices[key] !== undefined && prices[key] !== null && prices[key] !== "") {
        const priceValue = parseInt(prices[key]);
        if (!isNaN(priceValue) && priceValue > 0) {
          console.log(`✅ Found price for "${part}": ${priceValue} ₪ (key: ${key})`);
          return priceValue;
        }
      }
    }

    console.log(`❌ No valid price found for: "${part}"`);
    return 0;
  }, [prices]);

  const totalPrice = useMemo(() => {
    if (!prices || selectedParts.length === 0) return 0;
    
    const calculatedTotal = selectedParts.reduce((total, part) => {
      const price = getPartPrice(part);
      console.log(`🧮 ${part}: ${price} ₪`);
      return total + price;
    }, 0);

    console.log(`🏷️ Total calculated: ${calculatedTotal} ₪`);
    return calculatedTotal;
  }, [selectedParts, prices, getPartPrice]);

  // حساب السعر بعد التخفيضات
  const discountedPrice = useMemo(() => {
    if (selectedDiscounts.length === 0) return totalPrice;

    let finalPrice = totalPrice;
    
    selectedDiscounts.forEach(discountKey => {
      const discount = applicableDiscounts.find(d => d && d.area === discountKey);
      if (discount) {
        if (discount.type === 'percentage') {
          finalPrice = finalPrice * (1 - discount.value / 100);
        } else {
          finalPrice = finalPrice - discount.value;
        }
      }
    });

    const final = Math.max(0, Math.round(finalPrice));
    console.log(`🎯 Discounted price: ${final} ₪ (from ${totalPrice} ₪)`);
    return final;
  }, [totalPrice, selectedDiscounts, applicableDiscounts]);

  const remainingAmount = useMemo(() => {
    const paid = parseInt(paidAmount || "0");
    return Math.max(0, discountedPrice - paid);
  }, [discountedPrice, paidAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sessionData = {
      notes,
      paymentType,
      amount: discountedPrice.toString(),
      paidAmount: paidAmount || "0",
      remainingAmount: remainingAmount.toString(),
      paymentStatus: paidAmount >= discountedPrice ? "كامل" : paymentStatus,
      parts: selectedParts,
      date: new Date().toLocaleDateString('ar-SA'),
      appliedDiscounts: selectedDiscounts,
      originalPrice: totalPrice.toString(),
      discountedPrice: discountedPrice.toString()
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
                        {discount.areaName} - {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
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

  // جلب الأسعار من Firebase - محسن
  useEffect(() => {
    const pricesRef = ref(db, 'prices');
    console.log('🔄 Fetching prices from Firebase...');
    const unsub = onValue(pricesRef, (snap) => {
      const pricesData = snap.val() || {};
      console.log('✅ PRICES LOADED FROM FIREBASE:', pricesData);
      console.log('📊 Price keys:', Object.keys(pricesData));
      setPrices(pricesData);
    }, (error) => {
      console.error('❌ Error loading prices:', error);
    });
    return () => unsub();
  }, []);

  // جلب التخفيضات من Firebase
  useEffect(() => {
    const discountsRef = ref(db, 'discounts');
    const unsub = onValue(discountsRef, (snapshot) => {
      if (snapshot.exists()) {
        const discountsData = snapshot.val();
        console.log('🎁 Discounts loaded:', discountsData);
        setDiscounts(discountsData);
      } else {
        console.log('No discounts found');
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
      
      // التحقق من أن المنطقة مطابقة
      const discountArea = discount.area;
      const hasMatchingArea = selectedParts.some(part => {
        const partKey = areaNameMap[part] || part.toLowerCase();
        return partKey === discountArea;
      });
      
      if (hasMatchingArea) {
        availableDiscounts.push(discount);
      }
    });

    console.log('🎯 Available discounts:', availableDiscounts);
    setApplicableDiscounts(availableDiscounts);
    setSelectedDiscounts([]);
  }, [selectedParts, discounts]);

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
    (name) => {
      setSelectedParts((prev) =>
        prev.includes(name)
          ? prev.filter((p) => p !== name)
          : [...prev, name]
      );
    },
    []
  );

const addSession = async (sessionData) => {
  if (!client?.idNumber)
    return { success: false, message: "client id missing" };
  setIsProcessing(true);
  try {
    // إنشاء جلسة واحدة تشمل جميع المناطق
    const refSessions = ref(db, `sessions/${client.idNumber}`);
    const newRef = push(refSessions);
    
    // توليد ID فريد للجلسة
    const sessionId = newRef.key;
    
    const toSave = {
      ...sessionData,
      // حفظ جميع المناطق في جلسة واحدة
      parts: selectedParts, // جميع المناطق المحددة
      partName: selectedParts.join(' + '), // أسماء المناطق مجتمعة
      clientId: client.idNumber,
      clientName: client.fullName,
      timestamp: new Date().toISOString(),
      sessionId: sessionId, // إضافة ID الجلسة
      // إضافة حقول الدفع الأساسية
      paidAmount: sessionData.paidAmount || "0",
      remainingAmount: sessionData.remainingAmount || sessionData.amount,
      paymentStatus: sessionData.paymentStatus || "غير مدفوع",
      // معلومات إضافية
      areasCount: selectedParts.length, // عدد المناطق
      areas: selectedParts // قائمة المناطق
    };
    
    await set(newRef, toSave);
    onSaveSession?.(toSave);
    
    setSelectedParts([]);
    setShowSessionModal(false);
    setSelectedDiscounts([]);
    return { success: true, message: `تمت إضافة جلسة واحدة تشمل ${selectedParts.length} منطقة` };
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
            >
              إلغاء التحديد
            </button>
            <button
              className={`btn primary ${selectedParts.length === 0 ? "disabled" : ""}`}
              disabled={selectedParts.length === 0}
              onClick={() => setShowSessionModal(true)}
            >
              حفظ جلسات ({selectedParts.length})
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
          <div className="section-title">الجلسات (Timeline)</div>
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