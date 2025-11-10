// AddSession.js
import { useState, useMemo } from 'react';
import BodyMap3D from '../components/BodyMap3D';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddSession() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const patient = location.state?.patient || { 
    fullName: 'عميل تجريبي', 
    idNumber: '0000',
    phone: '0000000000'
  };

  const [sessions, setSessions] = useState([]);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const handleSaveSession = (sessionData) => {
    setSessions(prev => [...prev, sessionData]);
  };

  const sortedSessions = useMemo(() => 
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date)), 
    [sessions]
  );

  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 3);

  return (
    <div className="add-session-container">
      <div className="header">
        <h2>إضافة جلسة لعميلة: {patient.fullName}</h2>
        <button onClick={() => navigate(-1)} className="back-btn">
          العودة
        </button>
      </div>
      
      <BodyMap3D
        client={patient}
        onSaveSession={handleSaveSession}
      />

      {/* سجل الجلسات */}
      <div className="sessions-panel">
        <h3>📋 سجل الجلسات</h3>
        
        {sessions.length === 0 ? (
          <p className="no-sessions">لا توجد جلسات مسجلة بعد</p>
        ) : (
          <>
            <div className="sessions-list">
              {displayedSessions.map((session, index) => (
                <div key={session.id || index} className="session-item">
                  <div className="session-info">
                    <div className="session-part">{session.partName || 'غير محدد'}</div>
                    <div className="session-meta">
                      {session.date} - {session.therapist}
                    </div>
                  </div>
                  <div className="session-amount">
                    {session.amount} ش
                  </div>
                </div>
              ))}
            </div>

            {sessions.length > 3 && (
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                className="toggle-sessions-btn"
              >
                {showAllSessions ? 'عرض أقل' : `عرض الكل (${sessions.length})`}
              </button>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .add-session-container {
          padding: 16px;
          background: #F8FAFF;
          min-height: 100vh;
          direction: rtl;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header h2 {
          color: #2D3748;
          margin: 0;
        }
        .back-btn {
          padding: 8px 16px;
          background: #718096;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .back-btn:hover {
          background: #4A5568;
        }
        .sessions-panel {
          background: white;
          border-radius: 10px;
          padding: 16px;
          margin-top: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .sessions-panel h3 {
          color: #8B5FBF;
          margin-bottom: 12px;
          text-align: center;
        }
        .no-sessions {
          text-align: center;
          color: #718096;
          padding: 20px;
        }
        .sessions-list {
          max-height: 200px;
          overflow-y: auto;
        }
        .session-item {
          padding: 8px;
          border-bottom: 1px solid #8B5FBF20;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .session-part {
          font-size: 12px;
          font-weight: bold;
          color: #2D3748;
        }
        .session-meta {
          font-size: 10px;
          color: #718096;
        }
        .session-amount {
          font-size: 12px;
          font-weight: bold;
          color: #8B5FBF;
        }
        .toggle-sessions-btn {
          width: 100%;
          padding: 8px;
          background: linear-gradient(135deg, #8B5FBF 0%, #6A82FB 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          margin-top: 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}