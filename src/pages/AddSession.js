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
   const [sidebarOpen, setSidebarOpen] = useState(false);   // 👈 أضف هذا السطر

  const handleSaveSession = (sessionData) => {
    setSessions(prev => [...prev, sessionData]);
  };

  const sortedSessions = useMemo(() => 
    [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)), 
    [sessions]
  );

  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 5);

  return (
    <div className="add-session-page">
      {/* الهيدر */}
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← العودة
        </button>
        <h1 className="page-title">إضافة جلسة</h1>
        <div className="patient-info">
          <span className="patient-name">{patient.fullName}</span>
          <span className="patient-id">ID: {patient.idNumber}</span>
        </div>
      </div>

      {/* مكون BodyMap3D */}
      <div className="body-map-section">
        <BodyMap3D
          client={patient}
          onSaveSession={handleSaveSession}
          open={sidebarOpen} // 👈 تأكد من تمريرها

        />
      </div>



      <style jsx>{`
        .add-session-page {
          min-height: 100vh;
          background: #f8faff;
          direction: rtl;
          padding: 0;
        }

        .page-header {
          background: linear-gradient(135deg, #8B5FBF 0%, #6A82FB 100%);
          color: white;
          padding: 16px;
          position: sticky;
          top: 0;
          box-shadow: 0 2px 10px rgba(139, 95, 191, 0.3);
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 12px;
          backdrop-filter: blur(10px);
        }

        .page-title {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: bold;
        }

        .patient-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          opacity: 0.9;
        }

        .patient-name {
          font-weight: bold;
        }

        .patient-id {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .body-map-section {
          padding: 12px;
        }

        .sessions-section {
          background: white;
          margin: 12px;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .sessions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f1f1;
        }

        .sessions-title {
          margin: 0;
          font-size: 18px;
          color: #2D3748;
        }

        .sessions-count {
          background: #8B5FBF;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #718096;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 16px;
          margin: 0 0 8px 0;
          font-weight: bold;
        }

        .empty-subtext {
          font-size: 14px;
          margin: 0;
          opacity: 0.7;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-card {
          background: #f8faff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          transition: all 0.3s ease;
        }

        .session-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 95, 191, 0.15);
        }

        .session-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .session-area {
          font-weight: bold;
          color: #2D3748;
          font-size: 14px;
        }

        .session-date {
          color: #718096;
          font-size: 12px;
          background: #edf2f7;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .session-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-therapist {
          color: #4A5568;
          font-size: 13px;
        }

        .session-amount {
          color: #8B5FBF;
          font-weight: bold;
          font-size: 14px;
        }

        .session-notes {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e2e8f0;
          font-size: 12px;
          color: #718096;
        }

        .show-more-button {
          width: 100%;
          background: linear-gradient(135deg, #8B5FBF 0%, #6A82FB 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: bold;
          margin-top: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .show-more-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 95, 191, 0.3);
        }

        /* تصميم متجاوب للجوال */
        @media (max-width: 480px) {
          .add-session-page {
            padding: 0;
          }

          .page-header {
            padding: 12px;
          }

          .page-title {
            font-size: 18px;
          }

          .patient-info {
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
          }

          .body-map-section {
            padding: 8px;
          }

          .sessions-section {
            margin: 8px;
            padding: 12px;
          }

          .sessions-title {
            font-size: 16px;
          }

          .session-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .session-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .session-card {
            padding: 10px;
          }
        }

        @media (max-width: 360px) {
          .page-title {
            font-size: 16px;
          }

          .sessions-title {
            font-size: 15px;
          }

          .session-area {
            font-size: 13px;
          }

          .session-amount {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}