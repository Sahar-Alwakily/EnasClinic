// BodyMap3D.js
import React, { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { ref, set, push, onValue } from 'firebase/database'
import { db } from '../firebaseConfig'

// 🎨 تدرجات الألوان
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
  gradient: 'linear-gradient(135deg, #8B5FBF 0%, #6A82FB 100%)'
}

// 🔹 نموذج الجسم
function WomanModel({ selectedParts, togglePart, sessions }) {
  const [meshData, setMeshData] = useState([])
  const { scene: modelScene } = useGLTF('/model.glb')

  useEffect(() => {
    const meshes = []
    modelScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        meshes.push({ mesh: child, name: child.name })
      }
    })
    setMeshData(meshes)
  }, [modelScene])

  useEffect(() => {
    meshData.forEach(({ mesh, name }) => {
      mesh.material.color.set(selectedParts.includes(name) ? colors.primary : '#ffffff')
    })
  }, [selectedParts, meshData])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    togglePart(e.object.name)
  }, [togglePart])

  return (
    <primitive 
      object={modelScene} 
      onClick={handleClick} 
      scale={0.35}
      position={[0, -1.2, 0]} 
    />
  )
}

// 🔹 لوحة المعلومات الصحية
function HealthInfoPanel({ client, isOpen, onToggle }) {
  const healthInfo = useCallback(() => {
    if (!client) return {}
    
    const info = {
      allergies: [],
      conditions: [],
      medications: [],
      supplements: [],
      cosmetics: [],
      habits: []
    }

    // الحساسية
    if (client.allergyMilk) info.allergies.push('حليب')
    if (client.allergyBread) info.allergies.push('خبز')
    if (client.allergiesText && client.allergiesText !== 'لا') info.allergies.push(client.allergiesText)
    
    // الأمراض المزمنة
    const conditionMap = {
      diabetes: 'سكري',
      bloodPressure: 'ضغط الدم',
      heartDisease: 'أمراض القلب',
      thyroid: 'الغدة الدرقية',
      anemia: 'فقر الدم',
      pcod: 'تكيس المبايض'
    }

    if (client.chronicConditions) {
      Object.entries(client.chronicConditions).forEach(([condition, hasCondition]) => {
        if (hasCondition && conditionMap[condition]) {
          info.conditions.push(conditionMap[condition])
        }
      })
    }

    // المكملات والأدوية
    if (client.supplements && client.supplementsType) {
      info.supplements.push(client.supplementsType)
    }

    if (client.dailyMedications?.type) {
      info.medications.push(client.dailyMedications.type)
    }

    // العادات
    if (client.smoking) info.habits.push('🚬 مدخن')
    if (client.pregnancy) info.habits.push('🤰 حامل')
    if (client.exercise) info.habits.push('💪 يمارس الرياضة')

    return info
  }, [client])()

  const hasInfo = Object.values(healthInfo).some(arr => arr.length > 0)
  if (!hasInfo) return null

  const sections = [
    { key: 'allergies', title: '🔴 الحساسية', color: colors.error },
    { key: 'conditions', title: '🟠 الأمراض', color: colors.warning },
    { key: 'medications', title: '💊 الأدوية', color: colors.secondary },
    { key: 'supplements', title: '💊 المكملات', color: colors.primary },
    { key: 'habits', title: '📝 العادات', color: colors.warning }
  ]

  return (
    <div className="health-panel">
      <div className="health-header" onClick={onToggle}>
        <h3>🩺 المعلومات الصحية</h3>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="health-content">
          {sections.map(({ key, title, color }) => 
            healthInfo[key]?.length > 0 && (
              <div key={key} className="health-section" style={{ borderColor: color }}>
                <div className="section-title" style={{ color }}>{title}</div>
                <div className="section-content">{healthInfo[key].join('، ')}</div>
              </div>
            )
          )}
        </div>
      )}

      <style jsx>{`
        .health-panel {
          background: ${colors.card};
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .health-header {
          padding: 12px;
          background: ${colors.gradient};
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .health-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: bold;
        }
        .health-content {
          padding: 12px;
          background: ${colors.background};
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .health-section {
          padding: 8px;
          background: ${colors.card};
          border-radius: 8px;
          border-right: 3px solid;
        }
        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .section-content {
          font-size: 11px;
          color: ${colors.text};
          line-height: 1.4;
        }

        @media (max-width: 480px) {
          .health-header {
            padding: 10px;
          }
          .health-header h3 {
            font-size: 13px;
          }
          .health-content {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  )
}

// 🔹 التطبيق الرئيسي
export default function BodyMap3D({ client, onSaveSession }) {
  const [selectedParts, setSelectedParts] = useState([])
  const [sessions, setSessions] = useState({})
  const [showPanel, setShowPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthInfoOpen, setHealthInfoOpen] = useState(false)

  // جلب الجلسات من Firebase
  useEffect(() => {
    if (!client?.idNumber) return
    
    const sessionsRef = ref(db, `sessions/${client.idNumber}`)
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSessions({})
        return
      }

      const sessionsData = snapshot.val()
      const organized = {}
      
      Object.entries(sessionsData).forEach(([sessionId, session]) => {
        if (session?.partName && session.date) {
          const part = session.partName
          if (!organized[part]) organized[part] = []
          organized[part].push({ ...session, id: sessionId })
        }
      })
      
      setSessions(organized)
    })

    return () => unsubscribe()
  }, [client.idNumber])

  const togglePart = useCallback((partName) => {
    setSelectedParts(prev => 
      prev.includes(partName) 
        ? prev.filter(part => part !== partName)
        : [...prev, partName]
    )
  }, [])

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
        const sessionRef = ref(db, `sessions/${client.idNumber}`)
        const newSessionRef = push(sessionRef)
        
        const sessionToSave = {
          ...sessionData,
          partName,
          id: newSessionRef.key,
          clientId: client.idNumber,
          clientName: client.fullName,
          timestamp: new Date().toISOString()
        }
        
        await set(newSessionRef, sessionToSave)
        onSaveSession?.(sessionToSave)
        successCount++
      }
      
      return { success: true, message: `تم إضافة ${successCount} جلسة بنجاح!` }
    } catch (error) {
      console.error('Error adding sessions:', error)
      return { success: false, message: 'حدث خطأ أثناء حفظ الجلسات' }
    } finally {
      setIsLoading(false)
    }
  }

  const allSessions = Object.values(sessions).flat()

  return (
    <div className="body-map-container">
      {/* المعلومات الصحية */}
      <HealthInfoPanel 
        client={client}
        isOpen={healthInfoOpen}
        onToggle={() => setHealthInfoOpen(!healthInfoOpen)}
      />

      {/* الإحصائيات والأزرار */}
      <div className="stats-panel">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">إجمالي الجلسات</div>
            <div className="stat-value">{allSessions.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">المناطق المحددة</div>
            <div className="stat-value">{selectedParts.length}</div>
          </div>
        </div>

        <button
          onClick={openSessionPanel}
          disabled={selectedParts.length === 0 || isLoading}
          className={`add-session-btn ${selectedParts.length === 0 ? 'disabled' : ''}`}
        >
          {isLoading ? 'جاري المعالجة...' : `إضافة جلسات (${selectedParts.length})`}
        </button>
        
        {selectedParts.length > 0 && (
          <>
            <button
              onClick={() => setSelectedParts([])}
              className="cancel-btn"
            >
              إلغاء التحديد
            </button>

            <div className="selected-parts">
              {selectedParts.map(part => (
                <span key={part} className="part-tag">
                  {part}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* خريطة الجسم */}
      <div className="body-map">
        <Canvas camera={{ position: [0, 1, 3.5], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          <WomanModel
            selectedParts={selectedParts}
            togglePart={togglePart}
            sessions={sessions}
          />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>
      </div>

      <style jsx>{`
        .body-map-container {
          width: 100%;
          background: ${colors.background};
          border-radius: 16px;
          padding: 12px;
          direction: rtl;
        }
        .stats-panel {
          background: ${colors.card};
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stats-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .stat-card {
          flex: 1;
          background: ${colors.gradient};
          color: white;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
        }
        .add-session-btn {
          width: 100%;
          padding: 14px;
          background: ${colors.gradient};
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .add-session-btn:not(.disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 95, 191, 0.3);
        }
        .add-session-btn.disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
        .cancel-btn {
          width: 100%;
          padding: 10px;
          background: ${colors.textLight};
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .selected-parts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .part-tag {
          background: ${colors.primary};
          color: white;
          padding: 6px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: bold;
        }
        .body-map {
          height: 320px;
          background: ${colors.card};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* تصميم متجاوب للجوال */
        @media (max-width: 480px) {
          .body-map-container {
            padding: 8px;
          }
          .stats-panel {
            padding: 12px;
          }
          .stats-grid {
            gap: 8px;
          }
          .stat-card {
            padding: 10px;
          }
          .stat-label {
            font-size: 11px;
          }
          .stat-value {
            font-size: 18px;
          }
          .add-session-btn {
            padding: 12px;
            font-size: 14px;
          }
          .body-map {
            height: 280px;
          }
        }

        @media (max-width: 360px) {
          .stat-value {
            font-size: 16px;
          }
          .add-session-btn {
            font-size: 13px;
            padding: 10px;
          }
          .body-map {
            height: 250px;
          }
        }
      `}</style>
    </div>
  )
}