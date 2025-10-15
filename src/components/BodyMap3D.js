import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ref, set, get, push, onValue } from 'firebase/database'
import { db } from '../firebaseConfig'

// 🔹 نموذج الجسم
function WomanModel({ selectedPart, togglePart, setPanelPos, sessions, client }) {
  const { scene, camera } = useThree()
  const [meshData, setMeshData] = useState([])

  // 🔹 استخدام useGLTF لتحميل النموذج مرة واحدة
  const { scene: modelScene } = useGLTF('/model.glb')

  // 🔹 إعداد الـ meshes مرة واحدة
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

  // 🔹 تغيير اللون عند تحديد جزء
  useEffect(() => {
    meshData.forEach(({ mesh, name }) => {
      mesh.material.color.set(selectedPart === name ? '#ff69b4' : '#ffffff')
    })
  }, [selectedPart, meshData])

  const handleClick = (e) => {
    e.stopPropagation()
    const partName = e.object.name
    
    // 🔹 حساب موقع الفورم بناءً على موقع النقر
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    // 🔹 ضمان ظهور الفورم داخل الشاشة
    const panelWidth = 320
    const panelHeight = 400
    const x = Math.min(mouseX, window.innerWidth - panelWidth - 20)
    const y = Math.min(mouseY, window.innerHeight - panelHeight - 20)
    
    setPanelPos({ x, y })
    togglePart(partName)
  }

  return (
    <>
      <primitive 
        object={modelScene} 
        onClick={handleClick} 
        scale={0.5} 
        position={[0, -2, 0]} 
      />

      {/* 🔹 نص العدادات */}
      {meshData.map(({ mesh, name }) => {
        const pos = mesh.getWorldPosition(new THREE.Vector3())
        const sessionCount = sessions[name]?.length || 0
        return (
          sessionCount > 0 && (
            <Text
              key={name}
              position={[pos.x, pos.y + 0.1, pos.z]}
              fontSize={0.08}
              color="red"
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

// 🔹 النافذة الجانبية
function SessionPanel({ partName, sessions, addSession, onClose, client, panelPos }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentType: 'نقدي',
    amount: '',
    therapist: ''
  })

  const handleAdd = async () => {
    if (!formData.date) return alert('اختاري تاريخ الجلسة')
    
    const sessionData = {
      ...formData,
      partName,
      clientId: client.idNumber,
      clientName: client.fullName,
      timestamp: new Date().toISOString()
    }
    
    await addSession(partName, sessionData)
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      notes: '', 
      paymentType: 'نقدي', 
      amount: '', 
      therapist: '' 
    })
    onClose() // إغلاق الفورم بعد الإضافة
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: `${panelPos.y}px`,
        left: `${panelPos.x}px`,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        padding: '20px',
        width: '300px',
        maxHeight: '80vh',
        direction: 'rtl',
        zIndex: 1000,
        border: '2px solid #ff69b4',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#ff69b4', fontSize: '18px' }}>💆‍♀️ {partName}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#999',
            width: '25px',
            height: '25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            hover: { background: '#f5f5f5' }
          }}
        >
          ✕
        </button>
      </div>
      
      <p style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#666', fontSize: '14px' }}>
        عدد الجلسات: {sessions?.length || 0}
      </p>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
            تاريخ الجلسة *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>
      
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
            ملاحظات إضافية
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              minHeight: '60px',
              resize: 'vertical',
              fontSize: '14px'
            }}
            placeholder="أدخل ملاحظات إضافية"
          />
        </div>
        
        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            background: '#ff69b4',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background 0.3s'
          }}
          onMouseOver={(e) => e.target.style.background = '#e0559c'}
          onMouseOut={(e) => e.target.style.background = '#ff69b4'}
        >
          إضافة جلسة
        </button>
      </div>
    </div>
  )
}

// 🔹 التطبيق الرئيسي
export default function BodyMap3D({ client, onSaveSession }) {
  const [selectedPart, setSelectedPart] = useState(null)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [sessions, setSessions] = useState({})
  const [showAllSessions, setShowAllSessions] = useState(false)

  // 🔹 جلب الجلسات من Firebase
  useEffect(() => {
    if (!client?.idNumber) return

    const sessionsRef = ref(db, `sessions/${client.idNumber}`)
    
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionsData = snapshot.val()
        // تنظيم الجلسات حسب المنطقة
        const organizedSessions = {}
        
        Object.values(sessionsData).forEach(session => {
          const part = session.partName || 'غير محدد'
          if (!organizedSessions[part]) {
            organizedSessions[part] = []
          }
          organizedSessions[part].push(session)
        })
        
        setSessions(organizedSessions)
      } else {
        setSessions({})
      }
    })

    return () => unsubscribe()
  }, [client.idNumber])

  const togglePart = (partName) => {
    setSelectedPart(selectedPart === partName ? null : partName)
  }

  const addSession = async (part, sessionData) => {
    try {
      const sessionRef = ref(db, `sessions/${client.idNumber}`)
      const newSessionRef = push(sessionRef)
      
      await set(newSessionRef, {
        ...sessionData,
        id: newSessionRef.key,
        clientId: client.idNumber,
        clientName: client.fullName
      })

      if (onSaveSession) {
        onSaveSession({
          ...sessionData,
          id: newSessionRef.key
        })
      }

      alert('تم حفظ الجلسة بنجاح!')
    } catch (error) {
      console.error('Error saving session:', error)
      alert('حدث خطأ أثناء حفظ الجلسة')
    }
  }

  // 🔹 جمع جميع الجلسات
  const allSessions = Object.values(sessions).flat()
  // ترتيب الجلسات من الأحدث إلى الأقدم
  const sortedSessions = allSessions.sort((a, b) => new Date(b.date) - new Date(a.date))
  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 5)

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8f9fa', position: 'relative' }}>
      
      {/* 🔹 معلومات العميل */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <h4 style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>عميل رقم {client.idNumber}</h4>
          <h2 style={{ color: '#2c3e50', margin: '5px 0', fontSize: '24px' }}>{client.fullName}</h2>
          <p style={{ color: '#666', margin: '5px 0' }}>📞 {client.phone}</p>
          <p style={{ color: '#666', margin: '5px 0' }}>🩺 عدد الجلسات: {allSessions.length}</p>
        </div>
      </div>

      {/* 🔹 خريطة الجسم */}
      <div style={{ 
        height: '500px', 
        background: 'white', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        position: 'relative' 
      }}>
        <Canvas camera={{ position: [0, 1.4, 5], fov: 40 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[3, 3, 3]} intensity={2} />
          <WomanModel
            selectedPart={selectedPart}
            togglePart={togglePart}
            setPanelPos={setPanelPos}
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

      {/* 🔹 الفورم يظهر بجانب المنطقة المختارة */}
      {selectedPart && (
        <SessionPanel
          partName={selectedPart}
          sessions={sessions[selectedPart]}
          addSession={addSession}
          onClose={() => setSelectedPart(null)}
          client={client}
          panelPos={panelPos}
        />
      )}

      {/* 🔹 جدول الجلسات */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>📋 سجل الجلسات</h3>
        
        {allSessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>لا توجد جلسات مسجلة بعد</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>التاريخ</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>المنطقة</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSessions.map((session, index) => (
                    <tr key={session.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{session.date}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{session.partName || 'غير محدد'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{session.notes || 'لا توجد'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allSessions.length > 5 && (
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                style={{
                  marginTop: '15px',
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {showAllSessions ? 'عرض أقل' : 'عرض المزيد'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}