import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ref, set, get, push, onValue, remove } from 'firebase/database'
import { db } from '../firebaseConfig'

// 🎨 تدرجات الألوان الجديدة
const colors = {
  primary: '#8B5FBF',
  secondary: '#6A82FB',
  accent: '#FF6B8B',
  background: '#F8FAFF',
  card: '#FFFFFF',
  text: '#2D3748',
  textLight: '#718096',
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  gradient: 'linear-gradient(135deg, #8B5FBF 0%, #6A82FB 100%)',
  gradientLight: 'linear-gradient(135deg, #8B5FBF20 0%, #6A82FB20 100%)'
}

// 🔹 نموذج الجسم
function WomanModel({ selectedParts, togglePart, sessions, client }) {
  const { scene, camera } = useThree()
  const [meshData, setMeshData] = useState([])
  const { scene: modelScene } = useGLTF('/model.glb')

  useEffect(() => {
    const list = []
    modelScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        list.push({ mesh: child, name: child.name })
      }
    })
    setMeshData(list)
  }, [modelScene])

  useEffect(() => {
    meshData.forEach(({ mesh, name }) => {
      mesh.material.color.set(selectedParts.includes(name) ? colors.primary : '#ffffff')
    })
  }, [selectedParts, meshData])

  const handleClick = (e) => {
    e.stopPropagation()
    const partName = e.object.name
    togglePart(partName)
  }

  return (
    <>
      <primitive 
        object={modelScene} 
        onClick={handleClick} 
        scale={0.4} 
        position={[0, -1.5, 0]} 
      />

      {meshData.map(({ mesh, name }) => {
        const pos = mesh.getWorldPosition(new THREE.Vector3())
        const sessionCount = sessions[name]?.length || 0
        return (
          sessionCount > 0 && (
            <Text
              key={name}
              position={[pos.x, pos.y + 0.1, pos.z]}
              fontSize={0.06}
              color={colors.accent}
              anchorX="center"
              anchorY="bottom"
            >
              {sessionCount}
            </Text>
          )
        )
      })}
    </>
  )
}
function SessionPanel({ selectedParts, sessions, addSession, onClose, client }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentType: 'نقدي',
    amount: '',
    therapist: '',
    paidAmount: '', // 🔹 إضافة حقل المبلغ المدفوع
    remainingAmount: '' // 🔹 إضافة حقل المبلغ المتبقي
  })

  const [areasPrices, setAreasPrices] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)

  // 🔹 جلب أسعار المناطق من Firebase
  useEffect(() => {
    const fetchPrices = async () => {
      const pricesRef = ref(db, 'prices')
      const snapshot = await get(pricesRef)
      if (snapshot.exists()) {
        setAreasPrices(snapshot.val())
      }
    }
    fetchPrices()
  }, [])

  // 🔹 حساب السعر الكلي تلقائيًا
  useEffect(() => {
    let total = 0
    selectedParts.forEach(part => {
      if (areasPrices[part]) {
        total += parseInt(areasPrices[part])
      }
    })
    setTotalPrice(total)
    
    // 🔹 تحديث المبلغ المتبقي تلقائيًا
    if (formData.paidAmount) {
      setFormData(prev => ({
        ...prev,
        remainingAmount: total - parseInt(formData.paidAmount)
      }))
    }
  }, [selectedParts, areasPrices, formData.paidAmount])

  const handleAdd = async () => {
    if (!formData.date) return alert('اختاري تاريخ الجلسة')
    if (!formData.therapist) return alert('ادخلي اسم المعالج/ة')
    if (!formData.paidAmount) return alert('ادخلي المبلغ المدفوع')
    if (selectedParts.length === 0) return alert('لم يتم اختيار أي مناطق')
    
    try {
      setIsSubmitting(true)
      
      const sessionData = {
        date: formData.date,
        notes: formData.notes,
        paymentType: formData.paymentType,
        totalPrice: totalPrice, // 🔹 السعر الكلي
        paidAmount: parseInt(formData.paidAmount), // 🔹 المبلغ المدفوع
        remainingAmount: totalPrice - parseInt(formData.paidAmount), // 🔹 المتبقي
        therapist: formData.therapist,
        clientId: client.idNumber,
        clientName: client.fullName,
        bodyAreas: selectedParts, // 🔹 حفظ المناطق المختارة
        paymentStatus: totalPrice - parseInt(formData.paidAmount) > 0 ? 'جزئي' : 'كامل', // 🔹 حالة الدفع
        timestamp: new Date().toISOString()
      }
      
      const results = await addSession(selectedParts, sessionData)
      
      if (results.success) {
        alert(`✅ تم إضافة ${selectedParts.length} جلسة بنجاح! المبلغ المتبقي: ${sessionData.remainingAmount} ش`)
        setFormData({ 
          date: new Date().toISOString().split('T')[0], 
          notes: '', 
          paymentType: 'نقدي', 
          amount: '', 
          therapist: '',
          paidAmount: '',
          remainingAmount: ''
        })
        onClose()
      } else {
        alert(`⚠️ ${results.message}`)
      }
    } catch (error) {
      console.error('Error adding sessions:', error)
      alert('❌ حدث خطأ أثناء إضافة الجلسات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaidAmountChange = (e) => {
    const paid = e.target.value
    setFormData(prev => ({
      ...prev,
      paidAmount: paid,
      remainingAmount: totalPrice - parseInt(paid || 0)
    }))
  }
// 🔹 النافذة الجانبية

  const [isSubmitting, setIsSubmitting] = useState(false)


  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      zIndex: 1000,
      direction: 'rtl'
    }}>
      <div style={{
        background: colors.card,
        borderRadius: '12px',
        padding: '15px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: colors.primary, fontSize: '18px' }}>💆‍♀️ إضافة جلسات</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.textLight
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: colors.text }}>المناطق المحددة ({selectedParts.length}):</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
            {selectedParts.map(part => (
              <span key={part} style={{
                background: colors.gradient,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {part}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}30`,
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            name="therapist"
            value={formData.therapist}
            onChange={handleChange}
            placeholder="اسم المعالج/ة"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}30`,
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="المبلغ (شيقل)"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}30`,
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <select
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}30`,
              fontSize: '14px',
              marginBottom: '10px'
            }}
          >
            <option value="نقدي">نقدي</option>
            <option value="تحويل بنكي">تحويل بنكي</option>
            <option value="بطاقة ائتمان">بطاقة ائتمان</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="ملاحظات إضافية"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}30`,
              minHeight: '60px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: colors.gradient,
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1
          }}
        >
          {isSubmitting ? 'جاري الإضافة...' : `إضافة ${selectedParts.length} جلسة`}
        </button>
      </div>
    </div>
  )
}

// 🔹 مكون المعلومات الصحية الكامل
function HealthInfoPanel({ client, isOpen, onToggle }) {
  const getHealthInfo = () => {
    if (!client) return {};

    const healthInfo = {
      allergies: [],
      conditions: [],
      medications: [],
      supplements: [],
      cosmetics: [],
      habits: [],
      treatments: [],
      skinIssues: []
    };
    
    // الحساسية
    if (client.allergyMilk) healthInfo.allergies.push('حليب');
    if (client.allergyBread) healthInfo.allergies.push('خبز');
    if (client.allergiesText && client.allergiesText !== 'لا') healthInfo.allergies.push(client.allergiesText);
    
    // الأمراض المزمنة
    if (client.chronicConditions) {
      Object.entries(client.chronicConditions).forEach(([condition, hasCondition]) => {
        if (hasCondition) {
          const conditionNames = {
            'diabetes': 'سكري',
            'bloodPressure': 'ضغط الدم',
            'heartDisease': 'أمراض القلب',
            'thyroid': 'الغدة الدرقية',
            'anemia': 'فقر الدم',
            'pcod': 'تكيس المبايض',
            'immuneDisease': 'أمراض المناعة',
            'cancer': 'سرطان',
            'epilepsy': 'صرع',
            'bloodClot': 'تجلط الدم',
            'hormoneDisorder': 'اضطراب هرموني',
            'headache': 'صداع',
            'shortBreath': 'ضيق تنفس'
          };
          healthInfo.conditions.push(conditionNames[condition] || condition);
        }
      });
    }

    // المكملات
    if (client.supplements && client.supplementsType) {
      healthInfo.supplements.push(client.supplementsType);
    }

    // الأدوية
    if (client.dailyMedications && client.dailyMedications.medications && client.dailyMedications.type) {
      healthInfo.medications.push(client.dailyMedications.type);
    }

    // الأدوية الإضافية
    if (client.dailyMedicationsExtra) {
      if (client.dailyMedicationsExtra.antidepressant) healthInfo.medications.push('مضادات الاكتئاب');
      if (client.dailyMedicationsExtra.contraceptive) healthInfo.medications.push('مانع الحمل');
      if (client.dailyMedicationsExtra.sedative) healthInfo.medications.push('مهدئات');
      if (client.dailyMedicationsExtra.sleepingPill) healthInfo.medications.push('حبوب نوم');
      if (client.dailyMedicationsExtra.other) healthInfo.medications.push(client.dailyMedicationsExtra.other);
    }

    // مستحضرات التجميل
    if (client.cosmetics) {
      if (client.cosmetics.biotica) healthInfo.cosmetics.push('بايوتيكا');
      if (client.cosmetics.roaccutane) healthInfo.cosmetics.push('رواكيوتان');
      if (client.cosmetics.exfoliation) healthInfo.cosmetics.push('مقشرات');
      if (client.cosmetics.moisturizer) healthInfo.cosmetics.push('مرطبات');
      if (client.cosmetics.sunscreen) healthInfo.cosmetics.push('واقي شمس');
      if (client.cosmetics.soap) healthInfo.cosmetics.push('صابون');
      if (client.cosmetics.serum) healthInfo.cosmetics.push('سيروم');
      if (client.cosmetics.otherMedications) healthInfo.cosmetics.push(client.cosmetics.otherMedications);
    }

    // العادات
    if (client.smoking) healthInfo.habits.push('🚬 مدخن');
    if (client.pregnancy) healthInfo.habits.push('🤰 حامل');
    if (client.energyDrinks) healthInfo.habits.push('⚡ مشروبات طاقة');
    if (client.exercise) healthInfo.habits.push('💪 يمارس الرياضة');
    
    // العلاجات السابقة
    if (client.previousTreatments && client.previousTreatments !== 'لا') {
      healthInfo.treatments.push(client.previousTreatments);
    }

    // أمراض الجلد
    if (client.skinDiseases) {
      healthInfo.skinIssues.push(client.skinDetails || 'أمراض جلدية');
    }

    return healthInfo;
  }

  const healthInfo = getHealthInfo();
  const hasAnyInfo = Object.values(healthInfo).some(arr => arr.length > 0);

  if (!hasAnyInfo) return null;

  return (
    <div style={{ 
      background: colors.card, 
      borderRadius: '10px', 
      marginBottom: '10px', 
      overflow: 'hidden',
      border: `1px solid ${colors.primary}20`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div 
        onClick={onToggle}
        style={{
          padding: '12px',
          background: colors.gradient,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🩺 المعلومات الصحية للعميلة</h3>
        <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ padding: '10px', background: colors.background }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* الحساسية */}
            {healthInfo.allergies.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.error}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.error, marginBottom: '4px' }}>
                  🔴 الحساسية
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.allergies.join('، ')}
                </div>
              </div>
            )}

            {/* الأمراض المزمنة */}
            {healthInfo.conditions.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.warning}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.warning, marginBottom: '4px' }}>
                  🟠 الأمراض المزمنة
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.conditions.join('، ')}
                </div>
              </div>
            )}

            {/* الأدوية */}
            {healthInfo.medications.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.secondary}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.secondary, marginBottom: '4px' }}>
                  💊 الأدوية
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.medications.join('، ')}
                </div>
              </div>
            )}

            {/* المكملات */}
            {healthInfo.supplements.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.primary}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.primary, marginBottom: '4px' }}>
                  💊 المكملات الغذائية
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.supplements.join('، ')}
                </div>
              </div>
            )}

            {/* المستحضرات */}
            {healthInfo.cosmetics.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.success}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.success, marginBottom: '4px' }}>
                  🧴 المستحضرات المستخدمة
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.cosmetics.join('، ')}
                </div>
              </div>
            )}

            {/* العادات */}
            {healthInfo.habits.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.warning}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.warning, marginBottom: '4px' }}>
                  📝 العادات
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.habits.join('، ')}
                </div>
              </div>
            )}

            {/* العلاجات السابقة */}
            {healthInfo.treatments.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid #34495e`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e', marginBottom: '4px' }}>
                  🩺 العلاجات السابقة
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.treatments.join('، ')}
                </div>
              </div>
            )}

            {/* أمراض الجلد */}
            {healthInfo.skinIssues.length > 0 && (
              <div style={{
                padding: '8px',
                background: colors.card,
                borderRadius: '6px',
                borderRight: `3px solid ${colors.error}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.error, marginBottom: '4px' }}>
                  🔴 أمراض الجلد
                </div>
                <div style={{ fontSize: '11px', color: colors.text }}>
                  {healthInfo.skinIssues.join('، ')}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 التطبيق الرئيسي - متجاوب تماماً مع الموبايل
export default function BodyMap3D({ client, onSaveSession }) {
  const [selectedParts, setSelectedParts] = useState([])
  const [sessions, setSessions] = useState({})
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthInfoOpen, setHealthInfoOpen] = useState(false)

  useEffect(() => {
    if (!client?.idNumber) return
    const sessionsRef = ref(db, `sessions/${client.idNumber}`)
    
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionsData = snapshot.val()
        const organizedSessions = {}
        
        Object.entries(sessionsData).forEach(([sessionId, session]) => {
          if (typeof session === 'object' && session.partName && session.date) {
            const part = session.partName
            if (!organizedSessions[part]) organizedSessions[part] = []
            organizedSessions[part].push({ ...session, id: sessionId })
          }
        })
        
        setSessions(organizedSessions)
      } else {
        setSessions({})
      }
    })

    return () => unsubscribe()
  }, [client.idNumber])

  const togglePart = (partName) => {
    setSelectedParts(prev => prev.includes(partName) ? prev.filter(part => part !== partName) : [...prev, partName])
  }

  const openSessionPanel = () => {
    if (selectedParts.length === 0) {
      alert('يرجى تحديد منطقة واحدة على الأقل')
      return
    }
    setShowPanel(true)
  }

  const addSession = async (parts, sessionData) => {
    try {
      setIsLoading(true)
      let successCount = 0
      
      for (const partName of parts) {
        try {
          const sessionRef = ref(db, `sessions/${client.idNumber}`)
          const newSessionRef = push(sessionRef)
          
          const sessionToSave = {
            ...sessionData,
            partName: partName,
            id: newSessionRef.key,
            clientId: client.idNumber,
            clientName: client.fullName,
            timestamp: new Date().toISOString()
          }
          
          await set(newSessionRef, sessionToSave)
          if (onSaveSession) onSaveSession(sessionToSave)
          successCount++
        } catch (error) {
          console.error(`Error saving session for ${partName}:`, error)
        }
      }
      
      return { success: true, message: `تم إضافة ${successCount} جلسة بنجاح!` }
    } catch (error) {
      return { success: false, message: 'حدث خطأ أثناء حفظ الجلسات' }
    } finally {
      setIsLoading(false)
    }
  }

  const allSessions = Object.values(sessions).flat()
  const sortedSessions = allSessions.sort((a, b) => new Date(b.date) - new Date(a.date))
  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 3)

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: colors.background,
      padding: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      direction: 'rtl'
    }}>
      
      {/* 🔹 المعلومات الصحية الكاملة */}
      <HealthInfoPanel 
        client={client}
        isOpen={healthInfoOpen}
        onToggle={() => setHealthInfoOpen(!healthInfoOpen)}
      />

      {/* 🔹 الإحصائيات والأزرار */}
      <div style={{ 
        background: colors.card, 
        padding: '12px', 
        borderRadius: '10px', 
        marginBottom: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px'
        }}>
          <div style={{ 
            flex: 1, 
            background: colors.gradient, 
            color: 'white', 
            padding: '10px', 
            borderRadius: '8px', 
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>إجمالي الجلسات</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{allSessions.length}</div>
          </div>
          <div style={{ 
            flex: 1, 
            background: colors.gradient, 
            color: 'white', 
            padding: '10px', 
            borderRadius: '8px', 
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>المناطق المحددة</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedParts.length}</div>
          </div>
        </div>

        <button
          onClick={openSessionPanel}
          disabled={selectedParts.length === 0 || isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: selectedParts.length > 0 ? colors.gradient : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            cursor: selectedParts.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoading ? 'جاري المعالجة...' : `إضافة جلسات (${selectedParts.length})`}
        </button>
        
        {selectedParts.length > 0 && (
          <button
            onClick={() => setSelectedParts([])}
            style={{
              width: '100%',
              padding: '8px',
              background: colors.textLight,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            إلغاء التحديد
          </button>
        )}

        {selectedParts.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
              {selectedParts.map(part => (
                <span key={part} style={{
                  background: colors.primary,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px'
                }}>
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🔹 خريطة الجسم - مصغرة للجوال */}
      <div style={{ 
        height: '300px', 
        background: colors.card, 
        borderRadius: '10px', 
        overflow: 'hidden', 
        marginBottom: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Canvas camera={{ position: [0, 1.2, 4], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          <WomanModel
            selectedParts={selectedParts}
            togglePart={togglePart}
            sessions={sessions}
            client={client}
          />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 2.5}
          />
        </Canvas>
      </div>

      {/* 🔹 نافذة إضافة الجلسات */}
      {showPanel && (
        <SessionPanel
          selectedParts={selectedParts}
          sessions={sessions}
          addSession={addSession}
          onClose={() => setShowPanel(false)}
          client={client}
        />
      )}

      {/* 🔹 جدول الجلسات - مبسط للجوال */}
      <div style={{ 
        background: colors.card, 
        borderRadius: '10px', 
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: colors.primary, 
          marginBottom: '10px', 
          textAlign: 'center',
          fontSize: '16px'
        }}>
          📋 سجل الجلسات
        </h3>
        
        {allSessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: colors.textLight, padding: '20px', fontSize: '14px' }}>
            لا توجد جلسات مسجلة بعد
          </p>
        ) : (
          <>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {displayedSessions.map((session, index) => (
                <div key={session.id || index} style={{
                  padding: '8px',
                  borderBottom: `1px solid ${colors.primary}20`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.text }}>
                      {session.partName || 'غير محدد'}
                    </div>
                    <div style={{ fontSize: '10px', color: colors.textLight }}>
                      {session.date} - {session.therapist}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.primary }}>
                    {session.amount} ش
                  </div>
                </div>
              ))}
            </div>

            {allSessions.length > 3 && (
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: colors.gradient,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginTop: '10px',
                  cursor: 'pointer'
                }}
              >
                {showAllSessions ? 'عرض أقل' : `عرض الكل (${allSessions.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* 🔹 تذييل الصفحة */}
      <div style={{
        textAlign: 'center',
        padding: '15px',
        color: colors.textLight,
        fontSize: '12px',
        marginTop: '10px'
      }}>
        <p>نظام إدارة جلسات العلاج</p>
      </div>
    </div>
  )
}