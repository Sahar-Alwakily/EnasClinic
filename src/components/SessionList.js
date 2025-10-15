import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function SessionList() {
  const [allSessions, setAllSessions] = useState([]);
  const [displayedSessions, setDisplayedSessions] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const itemsPerPage = 4;

  // جلب جميع الجلسات من Firebase
  useEffect(() => {
    const sessionsRef = ref(db, 'sessions');
    
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionsData = snapshot.val();
        
        // جمع جميع الجلسات من جميع المرضى
        const allSessionsArray = [];
        
        Object.values(sessionsData).forEach(patientSessions => {
          Object.values(patientSessions).forEach(session => {
            allSessionsArray.push(session);
          });
        });
        
        // ترتيب الجلسات من الأحدث إلى الأقدم
        const sortedSessions = allSessionsArray.sort((a, b) => 
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
        );
        
        setAllSessions(sortedSessions);
      } else {
        setAllSessions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // تحديث الجلسات المعروضة
  useEffect(() => {
    if (showAll) {
      setDisplayedSessions(allSessions);
    } else {
      setDisplayedSessions(allSessions.slice(0, itemsPerPage));
    }
  }, [allSessions, showAll]);

  // تنسيق التاريخ الميلادي
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // الحصول على اسم الخدمة من اسم المنطقة
  const getServiceName = (partName) => {
    const serviceMap = {
      'Arm': 'إزالة شعر الذراع',
      'Leg': 'إزالة شعر الساق',
      'Face': 'عناية الوجه',
      'Head': 'عناية الرأس',
      'Chest': 'عناية الصدر',
      'Back': 'عناية الظهر',
      'Hand': 'عناية اليد',
      'Foot': 'عناية القدم'
    };
    
    return serviceMap[partName] || partName || 'خدمة غير محددة';
  };

  // أيقونة حسب نوع الخدمة
  const getServiceIcon = (partName) => {
    const iconMap = {
      'Arm': '💪',
      'Leg': '🦵',
      'Face': '😊',
      'Head': '👩',
      'Chest': '👗',
      'Back': '🔙',
      'Hand': '✋',
      'Foot': '🦶'
    };
    
    return iconMap[partName] || '📋';
  };

  if (allSessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">آخر الجلسات</h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-6xl mb-4">📋</div>
          <p>لا توجد جلسات مسجلة بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">آخر الجلسات</h3>
        <div className="text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full">
          {allSessions.length} جلسة
        </div>
      </div>

      {/* كروت الجلسات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedSessions.map((session, index) => (
          <div 
            key={session.id || index} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-2xl">{getServiceIcon(session.partName)}</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">
                    {session.clientName || 'غير معروف'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {getServiceName(session.partName)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {formatDate(session.date)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-purple-600">👩‍⚕️</span>
                <span className="text-sm text-gray-700">
                  {session.therapist || 'غير محدد'}
                </span>
              </div>
              
              <div className={`px-2 py-1 rounded-full text-xs ${
                session.paymentType === 'نقدي' 
                  ? 'bg-green-100 text-green-800'
                  : session.paymentType === 'بطاقة'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {session.paymentType || 'نقدي'}
              </div>
            </div>

            {session.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {session.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {allSessions.length > itemsPerPage && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            {showAll ? 'عرض أقل' : `عرض المزيد (${allSessions.length - itemsPerPage})`}
          </button>
        </div>
      )}
    </div>
  );
}