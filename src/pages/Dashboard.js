import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import admin from "./admin.jpeg"

export default function Dashboard({ user }) {
  const [manager, setManager] = useState({ name: user?.name || "أيناس كلينك", avatar: admin });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    todaySessions: 0,
    totalSessions: 0,
    satisfactionRate: "0%",
    activeClients: 0
  });
  const [clientSessions, setClientSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // جلب بيانات المستخدم
        const userRef = ref(db, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const data = userSnapshot.val();
          setManager({ 
            name: data.name || user.displayName || "أيناس كلينك", 
            avatar: admin 
          });
        }

        // جلب بيانات المرضى
        const patientsRef = ref(db, 'patients');
        const patientsSnapshot = await get(patientsRef);
        const totalClients = patientsSnapshot.exists() ? Object.keys(patientsSnapshot.val()).length : 0;

        // جلب بيانات التقييمات
        const reviewsRef = ref(db, 'reviews');
        const reviewsSnapshot = await get(reviewsRef);
        
        let totalRating = 0;
        let reviewCount = 0;
        
        if (reviewsSnapshot.exists()) {
          const reviewsData = reviewsSnapshot.val();
          Object.values(reviewsData).forEach(review => {
            if (review.rating) {
              totalRating += parseInt(review.rating);
              reviewCount++;
            }
          });
        }

        // حساب معدل الرضا
        const satisfactionRate = reviewCount > 0 
          ? Math.round((totalRating / (reviewCount * 5)) * 100) 
          : 0;

        // جلب بيانات الجلسات
        const sessionsRef = ref(db, 'sessions');
        const sessionsSnapshot = await get(sessionsRef);
        
        let todaySessions = 0;
        let totalSessions = 0;
        let clientsData = [];
        
        // الحصول على تاريخ اليوم بصيغ مختلفة للمقارنة
        const today = new Date();
        const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const todayGB = today.toLocaleDateString('en-GB'); // DD/MM/YYYY

        if (sessionsSnapshot.exists()) {
          const sessionsData = sessionsSnapshot.val();

          Object.entries(sessionsData).forEach(([clientId, patientSessions]) => {
            const clientSessionsList = Object.values(patientSessions);
            let clientName = "";
            let clientTherapists = new Set();
            let clientAreas = new Set();
            let totalClientSessions = 0;
            let lastSessionTimestamp = null;
            let lastSessionDate = "";
            let clientPhone = "";
            let lastSession = null;

            clientSessionsList.forEach(session => {
              // جلسات اليوم - التحقق من جميع التنسيقات
              const sessionDate = session.gregorianDate || session.date;
              if (sessionDate === todayISO || sessionDate === todayGB) {
                todaySessions++;
              }
              
              totalSessions++;
              
              // جمع بيانات العميل
              if (session.clientName) clientName = session.clientName;
              if (session.therapist) clientTherapists.add(session.therapist);
              if (session.partName) clientAreas.add(session.partName);
              if (session.phone) clientPhone = session.phone;
              
              totalClientSessions++;
              
              // أحدث جلسة - استخدام timestamp للمقارنة
              const sessionTimestamp = session.timestamp ? new Date(session.timestamp).getTime() : null;
              if (sessionTimestamp && (!lastSessionTimestamp || sessionTimestamp > lastSessionTimestamp)) {
                lastSessionTimestamp = sessionTimestamp;
                lastSessionDate = session.gregorianDate || session.date || "";
                lastSession = session;
              } else if (!lastSessionTimestamp && session.date) {
                // إذا لم يكن هناك timestamp، استخدم date
                const sessionDateStr = session.gregorianDate || session.date;
                if (!lastSessionDate || sessionDateStr > lastSessionDate) {
                  lastSessionDate = sessionDateStr;
                  lastSession = session;
                }
              }
            });

            if (clientName) {
              // ترتيب جلسات العميل من الأحدث إلى الأقدم
              const sortedSessions = [...clientSessionsList].sort((a, b) => {
                const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timestampB - timestampA;
              });

              clientsData.push({
                clientId,
                clientName,
                phone: clientPhone,
                totalSessions: totalClientSessions,
                therapists: Array.from(clientTherapists),
                areas: Array.from(clientAreas),
                lastSessionDate,
                lastSession, // إضافة آخر جلسة كاملة
                sessions: sortedSessions // الجلسات مرتبة من الأحدث إلى الأقدم
              });
            }
          });
        }

        // ترتيب العملاء من الأحدث إلى الأقدم بناءً على timestamp
        clientsData.sort((a, b) => {
          const timestampA = a.lastSession?.timestamp ? new Date(a.lastSession.timestamp).getTime() : 0;
          const timestampB = b.lastSession?.timestamp ? new Date(b.lastSession.timestamp).getTime() : 0;
          return timestampB - timestampA;
        });

        setStats({
          totalClients,
          todaySessions,
          totalSessions,
          satisfactionRate: `${satisfactionRate}%`,
          activeClients: totalClients
        });

        setClientSessions(clientsData);
        setError(null);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("خطأ في تحميل بيانات Dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // دالة للذهاب لصفحة تفاصيل العميل
  const handleViewDetails = (client) => {
    navigate("/patient-details", { state: { patientId: client.clientId  } })
  };

  // دالة للذهاب لصفحة إضافة جلسة جديدة للعميل
  const handleAddSession = (clientId, clientName) => {
    navigate("/SelectClient", { 
      state: { 
        preselectedClient: { id: clientId, name: clientName } 
      } 
    });
  };

  // دالة لتنسيق التاريخ للعرض
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'غير محدد';
    
    try {
      // إذا كان بصيغة YYYY-MM-DD
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // إذا كان بصيغة DD/MM/YYYY
      if (dateStr.includes('/')) {
        return dateStr;
      }
      
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        <Header manager={manager} />

        {/* الإحصائيات في الأعلى - تصميم متجاوب */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* إجمالي العملاء */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.totalClients}</div>
              <div className="text-xs sm:text-sm opacity-90 mt-1 sm:mt-2">إجمالي العملاء</div>
            </div>
          </div>
          
          {/* جلسات اليوم */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.todaySessions}</div>
              <div className="text-xs sm:text-sm opacity-90 mt-1 sm:mt-2">جلسات اليوم</div>
            </div>
          </div>
          
          {/* إجمالي الجلسات */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.totalSessions}</div>
              <div className="text-xs sm:text-sm opacity-90 mt-1 sm:mt-2">إجمالي الجلسات</div>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* العمود الجانبي - الإجراءات السريعة */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            
            {/* بطاقة الإجراءات السريعة */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-white/50">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">⚡ إجراءات سريعة</h3>
              
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => navigate("/SelectClient")}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xs sm:text-sm">➕</span>
                  </div>
                  <div className="text-right flex-1">
                    <div className="font-bold text-xs sm:text-sm">إضافة جلسة</div>
                    <div className="text-xs opacity-90">بدء جلسة علاج جديدة</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/add-client")}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xs sm:text-sm">👤</span>
                  </div>
                  <div className="text-right flex-1">
                    <div className="font-bold text-xs sm:text-sm">عميل جديد</div>
                    <div className="text-xs opacity-90">إضافة عميل جديد للنظام</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/customers")}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xs sm:text-sm">👥</span>
                  </div>
                  <div className="text-right flex-1">
                    <div className="font-bold text-xs sm:text-sm">العملاء</div>
                    <div className="text-xs opacity-90">عرض جميع العملاء</div>
                  </div>
                </button>
              </div>
            </div>

            {/* موجز سريع */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-white/50">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">📈 النظرة العامة</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">معدل الرضا</span>
                  <span className="text-sm sm:text-lg font-bold text-green-600">{stats.satisfactionRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">العملاء النشطين</span>
                  <span className="text-sm sm:text-lg font-bold text-purple-600">{stats.activeClients}</span>
                </div>
              </div>
            </div>

          </div>

          {/* العمود الرئيسي - جميع الجلسات */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-white/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">📋 جميع الجلسات</h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>🔄</span>
                  <span>آخر التحديثات</span>
                </div>
              </div>

              {/* كروت العملاء */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {clientSessions.length > 0 ? (
                  clientSessions.map((client, index) => (
                    <div key={client.clientId || index} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      
                      {/* معلومات العميل */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs sm:text-sm">
                            {client.clientName.charAt(0)}
                          </span>
                        </div>
                        <div className="text-right flex-1">
                          <div className="font-bold text-sm sm:text-base text-gray-800">{client.clientName}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{client.totalSessions} جلسة</div>
                          {client.phone && (
                            <div className="text-xs text-gray-500 mt-1">{client.phone}</div>
                          )}
                        </div>
                      </div>

                      {/* المعالجين */}
                      <div className="mb-2 sm:mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-1 sm:mb-2">المعالجين:</div>
                        <div className="flex flex-wrap gap-1">
                          {client.therapists.map((therapist, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {therapist}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* المناطق */}
                      <div className="mb-3 sm:mb-4">
                        <div className="text-xs font-semibold text-gray-700 mb-1 sm:mb-2">المناطق:</div>
                        <div className="flex flex-wrap gap-1">
                          {client.areas.map((area, idx) => (
                            <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* آخر جلسة */}
                      {client.lastSession && (
                        <div className="mb-2 sm:mb-3 p-2 bg-gray-50 rounded-lg">
                          <div className="text-xs font-semibold text-gray-700 mb-1">آخر جلسة:</div>
                          <div className="text-xs text-gray-600">
                            📅 {formatDateForDisplay(client.lastSessionDate)}
                          </div>
                          {client.lastSession.therapist && client.lastSession.therapist !== "غير محدد" && (
                            <div className="text-xs text-gray-600 mt-1">
                              👨‍⚕️ {client.lastSession.therapist}
                            </div>
                          )}
                          {client.lastSession.parts && client.lastSession.parts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {client.lastSession.parts.slice(0, 3).map((part, idx) => (
                                <span key={idx} className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded">
                                  {part}
                                </span>
                              ))}
                              {client.lastSession.parts.length > 3 && (
                                <span className="text-xs text-gray-500">+{client.lastSession.parts.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* أزرار الإجراءات */}
                      <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-100 gap-2">
                        <div className="text-xs text-gray-500 flex-1">
                          {client.lastSessionDate ? `آخر جلسة: ${formatDateForDisplay(client.lastSessionDate)}` : 'لا توجد جلسات'}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleAddSession(client.clientId, client.clientName)}
                            className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-lg transition-colors"
                            title="إضافة جلسة جديدة"
                          >
                            ﹢
                          </button>
                          <button 
                            onClick={() => handleViewDetails(client)}
                            className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 sm:px-3 py-1 rounded-lg transition-colors"
                          >
                            التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 sm:py-12 text-gray-500">
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📋</div>
                    <div className="text-sm sm:text-base">لا توجد جلسات مسجلة</div>
                    <button 
                      onClick={() => navigate("/add-client")}
                      className="mt-3 sm:mt-4 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
                    >
                      إضافة عميل جديد
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}