// BodyMap3D.js (مع تحسينات واجهة حفظ الجلسات ونظام الأسعار)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { ref, set, push, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

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

      <style jsx>{`
        .health-panel {
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.06);
          margin-bottom: 12px;
        }
        .health-header {
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${COLORS.gradient};
          color: white;
          cursor: pointer;
        }
        .health-header .title {
          display: flex;
          align-items: center;
          font-weight: 700;
        }
        .health-body {
          padding: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
        }
        .health-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
        }
        .health-row:last-child {
          border-bottom: none;
        }
        .health-row-label {
          min-width: 130px;
          color: ${COLORS.primary};
          font-weight: 600;
        }
        .health-row-tags {
          color: ${COLORS.text};
          flex: 1;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .health-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .health-row-label {
            min-width: 0;
            margin-bottom: 6px;
          }
        }
      `}</style>
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
        <style jsx>{`
          .empty-timeline {
            text-align: center;
            padding: 24px;
            color: ${COLORS.muted};
          }
          .emoji {
            font-size: 36px;
            margin-bottom: 8px;
          }
        `}</style>
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

      <style jsx>{`
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .timeline-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .timeline-left {
          width: 110px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          padding-top: 6px;
        }
        .date-badge {
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.12),
            rgba(37, 99, 235, 0.12)
          );
          color: ${COLORS.primary};
          font-weight: 700;
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 13px;
        }
        .vline {
          width: 2px;
          height: 100%;
          background: linear-gradient(
            180deg,
            ${COLORS.primary},
            ${COLORS.secondary}
          );
          margin-top: 4px;
          border-radius: 4px;
          opacity: 0.9;
        }
        .timeline-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .session-card {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.04);
        }
        .session-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .session-parts {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          background: rgba(124, 58, 237, 0.12);
          color: ${COLORS.primary};
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
        }
        .session-meta {
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .meta {
          margin-left: 8px;
          color: ${COLORS.text};
          font-weight: 600;
        }
        .notes {
          margin-top: 8px;
          color: ${COLORS.text};
          background: rgba(0, 0, 0, 0.02);
          padding: 8px;
          border-radius: 8px;
          font-size: 13px;
        }
        @media (max-width: 700px) {
          .timeline-left {
            width: 90px;
          }
        }
        @media (max-width: 480px) {
          .timeline-item {
            flex-direction: column;
          }
          .timeline-left {
            align-items: flex-start;
            width: 100%;
            order: 2;
          }
          .timeline-right {
            order: 1;
          }
        }
      `}</style>
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
  isProcessing 
}) {
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState("نقدي");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("جزئي");
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
  'Fullbody': 'fullbody'
};

// ثم غير حساب السعر ليصبح:
const totalPrice = useMemo(() => {
  if (!prices || selectedParts.length === 0) return 0;
  return selectedParts.reduce((total, part) => {
    const priceKey = areaNameMap[part] || part.toLowerCase();
    const price = parseInt(prices[priceKey] || "0");
    return total + price;
  }, 0);
}, [selectedParts, prices]);


  // حساب المبلغ المتبقي
  const remainingAmount = useMemo(() => {
    const paid = parseInt(paidAmount || "0");
    return Math.max(0, totalPrice - paid);
  }, [totalPrice, paidAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sessionData = {
      notes,
      paymentType,
      amount: totalPrice.toString(),
      paidAmount: paidAmount || "0",
      remainingAmount: remainingAmount.toString(),
      paymentStatus: paidAmount >= totalPrice ? "كامل" : paymentStatus,
      parts: selectedParts,
      date: new Date().toLocaleDateString('ar-SA')
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
          {/* ملخص المناطق المحددة */}
          <div className="form-section">
            <label className="section-label">المناطق المحددة:</label>
            <div className="selected-parts-list">
              {selectedParts.map((part, index) => (
                <div key={index} className="part-item">
                  <span className="part-name">{part}</span>
                  <span className="part-price">{prices?.[part] || "0"} ₪</span>
                </div>
              ))}
            </div>
          </div>

          {/* ملخص السعر */}
          <div className="price-summary">
            <div className="price-row">
              <span>المجموع:</span>
              <span className="total-price">{totalPrice} ₪</span>
            </div>
          </div>
{/* قسم التخفيضات */}
<div className="form-section">
  <label className="section-label">التخفيضات</label>
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
          </span>
        </label>
      </div>
    ))}
    {applicableDiscounts.length === 0 && (
      <div className="no-discounts">لا توجد تخفيضات متاحة</div>
    )}
  </div>
</div>
          {/* معلومات الدفع */}
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
                max={totalPrice}
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

          {/* الملاحظات */}
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

          {/* أزرار الإجراءات */}
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

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 0;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: ${COLORS.gradient};
          color: white;
          border-radius: 16px 16px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-form {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .section-label {
          display: block;
          font-weight: 600;
          margin-bottom: 12px;
          color: ${COLORS.text};
          font-size: 14px;
        }

        .selected-parts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .part-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .part-name {
          font-weight: 600;
          color: ${COLORS.text};
        }

        .part-price {
          color: ${COLORS.primary};
          font-weight: 700;
        }

        .price-summary {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
        }

        .total-price {
          color: ${COLORS.primary};
          font-size: 18px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: ${COLORS.text};
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: ${COLORS.primary};
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .payment-status {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .status-row:last-child {
          margin-bottom: 0;
        }

        .amount.remaining {
          color: ${COLORS.warning};
          font-weight: 600;
        }

        .amount.paid {
          color: ${COLORS.success};
          font-weight: 600;
        }

        .status.success {
          color: ${COLORS.success};
          font-weight: 600;
        }

        .status.warning {
          color: ${COLORS.warning};
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn.primary {
          background: ${COLORS.gradient};
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
        }

        .btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn.secondary {
          background: #f3f4f6;
          color: ${COLORS.text};
          border: 1px solid #d1d5db;
        }

        .btn.secondary:hover {
          background: #e5e7eb;
        }
      `}</style>
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

  // جلب الأسعار من Firebase
  useEffect(() => {
    const pricesRef = ref(db, 'prices');
    const unsub = onValue(pricesRef, (snap) => {
      setPrices(snap.val() || {});
    });
    return () => unsub();
  }, []);

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
      let count = 0;
      for (const part of selectedParts) {
        const refSessions = ref(db, `sessions/${client.idNumber}`);
        const newRef = push(refSessions);
        const toSave = {
          ...sessionData,
          partName: part,
          clientId: client.idNumber,
          clientName: client.fullName,
          timestamp: new Date().toISOString(),
        };
        await set(newRef, toSave);
        onSaveSession?.(toSave);
        count++;
      }
      setSelectedParts([]);
      setShowSessionModal(false);
      return { success: true, message: `تمت إضافة ${count} جلسة` };
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
      {/* HEADER / STATS */}
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

      {/* Health panel */}
      <HealthInfoPanel
        client={client}
        open={healthOpen}
        onToggle={() => setHealthOpen((v) => !v)}
      />

      {/* Body map + right panel */}
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

      {/* Session Modal */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        selectedParts={selectedParts}
        onSave={addSession}
        prices={prices}
        isProcessing={isProcessing}
      />

      <style jsx>{`
        .container {
          direction: rtl;
          padding: 14px;
          position: relative;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", Arial;
          color: ${COLORS.text};
        }

        .top-row {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 12px;
          position: relative;
          z-index: 30;
          transition: opacity 0.3s ease;
        }

        @media (max-width: 1024px) {
          .top-row.sidebar-open {
            display: none !important;
          }
        }

        .profile {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
        }
        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${COLORS.gradient};
          color: white;
          font-weight: 700;
          font-size: 20px;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.12);
        }
        .meta .name {
          font-weight: 700;
          font-size: 18px;
        }
        .meta .sub {
          color: ${COLORS.muted};
          font-size: 13px;
          margin-top: 4px;
        }

        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .stats {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .stat {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border-radius: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          text-align: center;
        }
        .stat .label {
          font-size: 12px;
          color: ${COLORS.muted};
        }
        .stat .value {
          font-weight: 700;
          font-size: 16px;
          margin-top: 4px;
          color: ${COLORS.text};
        }

        .buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.02);
          color: ${COLORS.text};
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .btn.primary {
          background: ${COLORS.gradient};
          color: white;
          box-shadow: 0 8px 26px rgba(37, 99, 235, 0.12);
        }
        .btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 14px;
          margin-top: 8px;
          z-index: 10;
        }
        .map-card {
          border-radius: 14px;
          overflow: hidden;
          height: 420px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.06);
          display: flex;
          flex-direction: column;
        }
        .map-card :global(canvas) {
          width: 100%;
          height: 100%;
          display: block;
        }
        .map-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.01),
            transparent
          );
        }
        .legend {
          color: ${COLORS.muted};
          font-size: 13px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 99px;
          display: inline-block;
          margin-left: 6px;
        }
        .dot.selected {
          background: ${COLORS.primary};
          box-shadow: 0 6px 18px rgba(124, 58, 237, 0.18);
        }
        .dot.normal {
          background: #d1d5db;
        }
        .selected-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .tag {
          background: rgba(37, 99, 235, 0.06);
          color: ${COLORS.secondary};
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 600;
        }

        .right-card {
          border-radius: 14px;
          padding: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.04);
          height: 420px;
          overflow: auto;
        }
        .section-title {
          color: ${COLORS.primary};
          font-weight: 800;
          margin-top: 6px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        @media (max-width: 1000px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .right-card {
            height: auto;
            order: 2;
          }
          .map-card {
            height: 420px;
            order: 1;
          }
        }

        @media (max-width: 480px) {
          .avatar {
            width: 52px;
            height: 52px;
            font-size: 16px;
          }
          .stat .value {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}