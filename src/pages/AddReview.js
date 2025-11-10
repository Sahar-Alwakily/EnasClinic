import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, push, set, get } from "firebase/database";
import { db } from "../firebaseConfig";

// 🎨 ألوان التصميم الجديد
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

export default function AddReview() {
  const navigate = useNavigate();
  const [review, setReview] = useState({
    clientName: "",
    service: "",
    rating: "",
    comment: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // جلب قائمة المرضى من Firebase
  useEffect(() => {
    const fetchPatients = async () => {
      const patientsRef = ref(db, 'patients');
      const snapshot = await get(patientsRef);
      if (snapshot.exists()) {
        const patientsData = snapshot.val();
        const patientsList = Object.values(patientsData).map(patient => ({
          id: patient.idNumber,
          name: patient.fullName
        }));
        setPatients(patientsList);
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (field, value) => {
    setReview((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!review.clientName || !review.service || !review.rating || !review.comment) {
      alert("❗ الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);

    try {
      const reviewsRef = ref(db, 'reviews');
      const newReviewRef = push(reviewsRef);
      
      await set(newReviewRef, {
        id: newReviewRef.key,
        clientName: review.clientName,
        service: review.service,
        rating: review.rating,
        comment: review.comment,
        date: review.date,
        timestamp: new Date().toISOString()
      });

      alert(`✅ تم حفظ تقييم العميل: ${review.clientName}`);
      
      // إعادة تعيين الحقول
      setReview({
        clientName: "",
        service: "",
        rating: "",
        comment: "",
        date: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error("Error saving review:", error);
      alert("❌ حدث خطأ أثناء حفظ التقييم");
    } finally {
      setLoading(false);
    }
  };

  // دالة للحصول على النجوم بناءً على التقييم
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ 
          color: i <= rating ? '#FFD700' : '#E2E8F0',
          fontSize: '18px'
        }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      padding: '20px',
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: colors.card,
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 10px 40px rgba(139, 95, 191, 0.1)',
        border: `1px solid ${colors.primary}20`
      }}>
        
        {/* رأس الصفحة */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: `2px solid ${colors.primary}20`
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: colors.gradient,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            fontSize: '24px'
          }}>
            ⭐
          </div>
          <h2 style={{
            margin: 0,
            color: colors.primary,
            fontSize: '28px',
            fontWeight: 'bold',
            background: colors.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            إضافة رأي العميل
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            color: colors.textLight,
            fontSize: '16px'
          }}>
            شاركنا تجربة العميل لتحسين خدماتنا
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* اختيار العميل */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.text,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: colors.primary,
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>1</span>
              اسم العميل *
            </label>
            <select
              value={review.clientName}
              onChange={(e) => handleChange("clientName", e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}30`,
                fontSize: '16px',
                background: colors.background,
                transition: 'all 0.3s ease'
              }}
              required
            >
              <option value="">اختر العميل من القائمة</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.name}>
                  {patient.name} - {patient.id}
                </option>
              ))}
            </select>
          </div>

          {/* الخدمة */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.text,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: colors.secondary,
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>2</span>
              الخدمة المقدمة *
            </label>
            <select
              value={review.service}
              onChange={(e) => handleChange("service", e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}30`,
                fontSize: '16px',
                background: colors.background,
                transition: 'all 0.3s ease'
              }}
              required
            >
              <option value="">اختر الخدمة المقدمة</option>
              <option value="إزالة شعر الذراع">إزالة شعر الذراع</option>
              <option value="إزالة شعر الساق">إزالة شعر الساق</option>
              <option value="عناية الوجه">عناية الوجه</option>
              <option value="عناية الرأس">عناية الرأس</option>
              <option value="عناية الصدر">عناية الصدر</option>
              <option value="عناية الظهر">عناية الظهر</option>
              <option value="عناية اليد">عناية اليد</option>
              <option value="عناية القدم">عناية القدم</option>
              <option value="تنظيف البشرة">تنظيف البشرة</option>
              <option value="تشكيل الجسم">تشكيل الجسم</option>
            </select>
          </div>

          {/* التقييم */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.text,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: colors.accent,
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>3</span>
              تقييم الخدمة *
            </label>
            <select
              value={review.rating}
              onChange={(e) => handleChange("rating", e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}30`,
                fontSize: '16px',
                background: colors.background,
                transition: 'all 0.3s ease'
              }}
              required
            >
              <option value="">كيف كانت تجربة العميل؟</option>
              <option value="5">⭐⭐⭐⭐⭐ ممتاز - تجربة رائعة</option>
              <option value="4">⭐⭐⭐⭐ جيد جداً - راضٍ تماماً</option>
              <option value="3">⭐⭐⭐ جيد - تجربة مرضية</option>
              <option value="2">⭐⭐ متوسط - يحتاج تحسين</option>
              <option value="1">⭐ ضعيف - غير راضٍ</option>
            </select>
            
            {/* معاينة النجوم */}
            {review.rating && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                background: colors.gradientLight,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: colors.textLight, marginBottom: '5px' }}>
                  معاينة التقييم:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                  {renderStars(parseInt(review.rating))}
                </div>
              </div>
            )}
          </div>

          {/* التاريخ */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.text,
              fontSize: '16px'
            }}>
              📅 تاريخ التقييم
            </label>
            <input
              type="date"
              value={review.date}
              onChange={(e) => handleChange("date", e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}30`,
                fontSize: '16px',
                background: colors.background,
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          {/* التعليق */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.text,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: colors.success,
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>4</span>
              تعليق العميل *
            </label>
            <textarea
              placeholder="اكتب تعليق العميل هنا... ما هي انطباعاته عن الخدمة؟"
              value={review.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}30`,
                fontSize: '16px',
                background: colors.background,
                minHeight: '120px',
                resize: 'vertical',
                transition: 'all 0.3s ease',
                lineHeight: '1.6'
              }}
              required
            />
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading ? '#ccc' : colors.gradient,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 8px 25px rgba(139, 95, 191, 0.4)',
              transition: 'all 0.3s ease',
              marginTop: '10px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 30px rgba(139, 95, 191, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(139, 95, 191, 0.4)';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                جاري حفظ التقييم...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                💾 حفظ التقييم
              </span>
            )}
          </button>
        </form>

        {/* معلومات إضافية */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          background: colors.gradientLight,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            color: colors.textLight,
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            💡 <strong>نصيحة:</strong> آراء العملاء تساعدنا على تحسين جودة خدماتنا باستمرار
          </p>
        </div>
      </div>

      {/* إضافة أنيميشن للتحميل */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 15px !important;
          }
          
          .card {
            padding: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          .container {
            padding: 10px !important;
          }
          
          .card {
            padding: 15px !important;
          }
        }
      `}</style>
    </div>
  );
}