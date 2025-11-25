export default function Header({ manager }) {
  return (
    <header className="header">
      <div className="header-content">
        {/* القسم الأيسر: الترحيب */}
        <div className="welcome-section">
          <h1 className="welcome-title">مرحباً، {manager.name}</h1>
          <p className="welcome-subtitle">تابع آخر الجلسات وإدارة العملاء</p>
        </div>

        {/* القسم الأيمن: معلومات المديرة */}
        <div className="manager-info">
          <div className="manager-details">
            <div className="manager-role">المديرة</div>
            <div className="manager-name">{manager.name}</div>
          </div>
          <img 
            src={manager.avatar} 
            alt="صورة المديرة" 
            className="manager-avatar" 
          />
        </div>
      </div>

      <style jsx>{`
        .header {
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          padding: 12px 16px;
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .welcome-section {
          flex: 1;
        }

        .welcome-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .welcome-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .manager-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .manager-details {
          text-align: right;
        }

        .manager-role {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .manager-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .manager-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e5e7eb;
        }

        /* تحسينات للشاشات الصغيرة جداً */
        @media (max-width: 360px) {
          .header {
            padding: 10px 12px;
          }
          
          .welcome-title {
            font-size: 16px;
          }
          
          .welcome-subtitle {
            font-size: 12px;
          }
          
          .manager-avatar {
            width: 40px;
            height: 40px;
          }
        }

        /* تحسينات للشاشات المتوسطة والكبيرة */
        @media (min-width: 768px) {
          .header {
            padding: 16px 24px;
          }
          
          .welcome-title {
            font-size: 20px;
          }
          
          .welcome-subtitle {
            font-size: 14px;
          }
          
          .manager-avatar {
            width: 48px;
            height: 48px;
          }
        }

        /* إخفاء الهيدر في الشاشات الكبيرة حيث يوجد سايدبار */
        @media (min-width: 1024px) {
          .header {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}