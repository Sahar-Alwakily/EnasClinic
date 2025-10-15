import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, push, set, get } from "firebase/database";
import { db } from "../firebaseConfig";

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
      alert("املأ كل الحقول");
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

      alert(`تم حفظ تقييم العميل: ${review.clientName}`);
      
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
      alert("حدث خطأ أثناء حفظ التقييم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-center">إضافة رأي العميل</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* اختيار العميل من القائمة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم العميل *
            </label>
            <select
              value={review.clientName}
              onChange={(e) => handleChange("clientName", e.target.value)}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">اختر العميل</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.name}>
                  {patient.name} - {patient.id}
                </option>
              ))}
            </select>
          </div>

          {/* الخدمة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الخدمة *
            </label>
            <select
              value={review.service}
              onChange={(e) => handleChange("service", e.target.value)}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">اختر الخدمة</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التقييم *
            </label>
            <select
              value={review.rating}
              onChange={(e) => handleChange("rating", e.target.value)}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">اختر التقييم</option>
              <option value="5">⭐⭐⭐⭐⭐ ممتاز</option>
              <option value="4">⭐⭐⭐⭐ جيد جداً</option>
              <option value="3">⭐⭐⭐ جيد</option>
              <option value="2">⭐⭐ متوسط</option>
              <option value="1">⭐ ضعيف</option>
            </select>
          </div>

          {/* التاريخ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ التقييم
            </label>
            <input
              type="date"
              value={review.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* التعليق */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تعليق العميل *
            </label>
            <textarea
              placeholder="اكتب تعليق العميل هنا..."
              value={review.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              className="border p-2 rounded w-full min-h-[100px]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`bg-purple-600 text-white rounded w-full py-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
            }`}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التعليق'}
          </button>
        </form>
      </div>
    </div>
  );
}