import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Prices() {
  const [prices, setPrices] = useState({
    fullbody: '',
    bikiniArea: '',
    abdomen: '',
    arm: '',
    neck: '',
    face: '',
    shin: '',
    hand: '',
    armpit: '',
    elbow: '',
    feet: '',
    thighs: '',
    back: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب الأسعار من Firebase
  useEffect(() => {
    const pricesRef = ref(db, 'prices');
    
    const unsubscribe = onValue(pricesRef, (snapshot) => {
      if (snapshot.exists()) {
        setPrices(snapshot.val());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePriceChange = (area, value) => {
    setPrices(prev => ({
      ...prev,
      [area]: value
    }));
  };

  const saveAllPrices = async () => {
    setSaving(true);
    try {
      const pricesRef = ref(db, 'prices');
      await set(pricesRef, prices);
      alert('تم حفظ جميع الأسعار بنجاح!');
    } catch (error) {
      console.error('Error saving prices:', error);
      alert('حدث خطأ أثناء حفظ الأسعار');
    } finally {
      setSaving(false);
    }
  };

  const saveSinglePrice = async (area) => {
    if (!prices[area]) {
      alert('يرجى إدخال سعر للمنطقة أولاً');
      return;
    }
    
    try {
      const priceRef = ref(db, `prices/${area}`);
      await set(priceRef, prices[area]);
      alert(`تم حفظ سعر ${getAreaName(area)} بنجاح!`);
    } catch (error) {
      console.error('Error saving price:', error);
      alert('حدث خطأ أثناء حفظ السعر');
    }
  };

  const getAreaName = (area) => {
    const areaNames = {
      fullbody: 'الجسم كامل',
      bikiniArea: 'منطقة البيكيني',
      abdomen: 'البطن',
      arm: 'الذراع',
      neck: 'الرقبة',
      face: 'الوجه',
      shin: 'الساق',
      hand: 'اليد',
      armpit: 'تحت الإبط',
      elbow: 'الكوع',
      feet: 'القدم',
      thighs: 'الفخذين',
      back: 'الظهر'
    };
    return areaNames[area] || area;
  };

  const bodyAreas = [
    { key: 'fullbody', name: 'الجسم كامل', icon: '👤' },
    { key: 'bikiniArea', name: 'منطقة البيكيني', icon: '🩲' },
    { key: 'abdomen', name: 'البطن', icon: '🩹' },
    { key: 'arm', name: 'الذراع', icon: '💪' },
    { key: 'neck', name: 'الرقبة', icon: '👔' },
    { key: 'face', name: 'الوجه', icon: '😊' },
    { key: 'shin', name: 'الساق', icon: '🦵' },
    { key: 'hand', name: 'اليد', icon: '✋' },
    { key: 'armpit', name: 'تحت الإبط', icon: '👕' },
    { key: 'elbow', name: 'الكوع', icon: '🦾' },
    { key: 'feet', name: 'القدم', icon: '🦶' },
    { key: 'thighs', name: 'الفخذين', icon: '🦵' },
    { key: 'back', name: 'الظهر', icon: '🔙' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الأسعار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max p-6">
      <div className="max-w-6xl mx-auto">

                {/* إحصائيات */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-4 text-center">ملخص الأسعار</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(prices).filter(price => price !== '').length}
              </div>
              <div className="text-sm text-blue-800">مناطق مسعرة</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-green-600">
                {bodyAreas.length - Object.values(prices).filter(price => price !== '').length}
              </div>
              <div className="text-sm text-green-800">مناطق بانتظار التسعير</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-purple-600">
                {bodyAreas.length}
              </div>
              <div className="text-sm text-purple-800">إجمالي المناطق</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(prices).reduce((sum, price) => sum + (parseInt(price) || 0), 0)}
              </div>
              <div className="text-sm text-orange-800">إجمالي الأسعار</div>
            </div>
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">تغيير أسعار جلسات الليزر</h2>
          <p className="text-gray-600">حدد سعر كل منطقة من مناطق الجسم</p>
        </div>

        {/* زر حفظ الكل */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">حفظ جميع الأسعار</h3>
              <p className="text-sm text-gray-600">سيتم حفظ جميع الأسعار المدخلة أدناه</p>
            </div>
            <button
              onClick={saveAllPrices}
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                'حفظ جميع الأسعار'
              )}
            </button>
          </div>
        </div>

        {/* قائمة مناطق الجسم */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bodyAreas.map((area) => (
            <div
              key={area.key}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{area.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{area.name}</h3>
                    <p className="text-sm text-gray-500">سعر الجلسة</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={prices[area.key] || ''}
                    onChange={(e) => handlePriceChange(area.key, e.target.value)}
                    placeholder="أدخل السعر"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => saveSinglePrice(area.key)}
                  disabled={!prices[area.key]}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ السعر
                </button>
              </div>

              {prices[area.key] && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-800 text-sm">
                    <span className="font-semibold">السعر الحالي:</span> {prices[area.key]} شيقل
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}