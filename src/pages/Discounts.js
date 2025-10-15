import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Discounts() {
  const [discounts, setDiscounts] = useState({});
  const [selectedArea, setSelectedArea] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [minSessions, setMinSessions] = useState(1);
  const [loading, setLoading] = useState(false);

  // قائمة مناطق الجسم
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

  // جلب التخفيضات من Firebase
  useEffect(() => {
    const discountsRef = ref(db, 'discounts');
    
    const unsubscribe = onValue(discountsRef, (snapshot) => {
      if (snapshot.exists()) {
        setDiscounts(snapshot.val());
      } else {
        setDiscounts({});
      }
    });

    return () => unsubscribe();
  }, []);

  const addDiscount = async () => {
    if (!selectedArea || !discountValue || !validUntil) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    setLoading(true);

    try {
      const discountData = {
        area: selectedArea,
        areaName: bodyAreas.find(a => a.key === selectedArea)?.name || selectedArea,
        type: discountType,
        value: parseInt(discountValue),
        validUntil: validUntil,
        minSessions: parseInt(minSessions),
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const discountRef = ref(db, `discounts/${selectedArea}`);
      await set(discountRef, discountData);

      // تفريغ الحقول
      setSelectedArea('');
      setDiscountValue('');
      setValidUntil('');
      setMinSessions(1);

      alert('تم إضافة التخفيض بنجاح!');

    } catch (error) {
      console.error('Error adding discount:', error);
      alert('حدث خطأ أثناء إضافة التخفيض');
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscount = async (areaKey) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التخفيض؟')) return;

    try {
      const discountRef = ref(db, `discounts/${areaKey}`);
      await remove(discountRef);
      alert('تم حذف التخفيض بنجاح!');
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('حدث خطأ أثناء حذف التخفيض');
    }
  };

  const toggleDiscountStatus = async (areaKey, currentStatus) => {
    try {
      const discountRef = ref(db, `discounts/${areaKey}/isActive`);
      await set(discountRef, !currentStatus);
    } catch (error) {
      console.error('Error toggling discount status:', error);
      alert('حدث خطأ أثناء تغيير حالة التخفيض');
    }
  };

  const getDiscountText = (discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}% خصم`;
    } else {
      return `${discount.value} شيقل خصم`;
    }
  };

  const isDiscountExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const validDate = new Date(validUntil);
    const diffTime = validDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">إدارة التخفيضات</h1>
          <p className="text-gray-600">إدارة عروض التخفيضات لمناطق الجسم المختلفة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نموذج إضافة تخفيض */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">إضافة تخفيض جديد</h2>
            
            <div className="space-y-4">
              {/* اختيار المنطقة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  منطقة الجسم *
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">اختر منطقة الجسم</option>
                  {bodyAreas.map(area => (
                    <option key={area.key} value={area.key}>
                      {area.icon} {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع التخفيض وقيمته */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع التخفيض
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قيمة التخفيض *
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'النسبة المئوية' : 'المبلغ بالشيقل'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* تاريخ الانتهاء وعدد الجلسات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    صالح حتى *
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    أقل عدد جلسات
                  </label>
                  <input
                    type="number"
                    value={minSessions}
                    onChange={(e) => setMinSessions(e.target.value)}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* زر الإضافة */}
              <button
                onClick={addDiscount}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  'إضافة التخفيض'
                )}
              </button>
            </div>
          </div>

          {/* قائمة التخفيضات */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">التخفيضات الحالية</h2>
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              {Object.keys(discounts).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🎫</div>
                  <p>لا توجد تخفيضات حالية</p>
                  <p className="text-sm mt-1">قم بإضافة تخفيض جديد للبدء</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {Object.entries(discounts).map(([areaKey, discount]) => {
                    const area = bodyAreas.find(a => a.key === areaKey);
                    const isExpired = isDiscountExpired(discount.validUntil);
                    const daysRemaining = getDaysRemaining(discount.validUntil);
                    
                    return (
                      <div key={areaKey} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{area?.icon || '📍'}</span>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {discount.areaName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getDiscountText(discount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {discount.minSessions > 1 ? `لـ ${discount.minSessions} جلسات فأكثر` : 'لأي عدد جلسات'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* حالة التخفيض */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isExpired 
                                ? 'bg-red-100 text-red-800'
                                : discount.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isExpired ? 'منتهي' : discount.isActive ? 'نشط' : 'غير نشط'}
                            </span>

                            {/* الأزرار */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleDiscountStatus(areaKey, discount.isActive)}
                                className={`p-2 rounded-lg ${
                                  discount.isActive 
                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                                title={discount.isActive ? 'تعطيل' : 'تفعيل'}
                              >
                                {discount.isActive ? '⏸️' : '▶️'}
                              </button>
                              
                              <button
                                onClick={() => deleteDiscount(areaKey)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                title="حذف"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* معلومات إضافية */}
                        <div className="mt-2 text-xs text-gray-500">
                          <div>📅 ينتهي في: {new Date(discount.validUntil).toLocaleDateString('ar-SA')}</div>
                          {!isExpired && daysRemaining > 0 && (
                            <div>⏳ متبقي: {daysRemaining} يوم</div>
                          )}
                          <div>🕒 أضيف: {new Date(discount.createdAt).toLocaleDateString('ar-SA')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(discounts).length}</div>
            <div className="text-sm text-gray-600">إجمالي التخفيضات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(discounts).filter(d => d.isActive && !isDiscountExpired(d.validUntil)).length}
            </div>
            <div className="text-sm text-gray-600">التخفيضات النشطة</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(discounts).filter(d => isDiscountExpired(d.validUntil)).length}
            </div>
            <div className="text-sm text-gray-600">التخفيضات المنتهية</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(discounts).filter(d => d.type === 'percentage').length}
            </div>
            <div className="text-sm text-gray-600">تخفيضات بنسبة مئوية</div>
          </div>
        </div>
      </div>
    </div>
  );
}