import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب جميع التقييمات من Firebase
  useEffect(() => {
    const reviewsRef = ref(db, 'reviews');
    
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const reviewsData = snapshot.val();
        const reviewsList = Object.values(reviewsData)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setReviews(reviewsList);
      } else {
        setReviews([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // عرض النجوم حسب التقييم
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-gray-300"}>
          ⭐
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التقييمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تقيمات العملاء</h2>
        <div className="text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full">
          {reviews.length} تقييم
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-500 text-lg">لا توجد تقييمات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* رأس البطاقة */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {review.clientName}
                  </h3>
                  <p className="text-sm text-gray-600">{review.service}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {new Date(review.date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>

              {/* النجوم */}
              <div className="flex mb-3">
                {renderStars(parseInt(review.rating))}
                <span className="text-sm text-gray-600 mr-2">
                  ({review.rating}/5)
                </span>
              </div>

              {/* التعليق */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{review.comment}"
                </p>
              </div>

              {/* الوقت */}
              <div className="mt-3 text-xs text-gray-500 text-left">
                {new Date(review.timestamp).toLocaleString('ar-SA')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}