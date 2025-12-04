import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function Discounts() {
  const [discounts, setDiscounts] = useState({});
  const [selectedArea, setSelectedArea] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed' or 'package'
  const [discountValue, setDiscountValue] = useState('');
  const [packageSessions, setPackageSessions] = useState(''); // عدد جلسات الحزمة
  const [packagePrice, setPackagePrice] = useState(''); // سعر الحزمة الكلي
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
    { key: 'back', name: 'الظهر', icon: '🔙' },
    { key: 'package', name: 'حزمة جلسات', icon: '📦' } // منطقة خاصة للحزم
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
    if (!selectedArea || !validUntil) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    // التحقق من الحقول بناءً على نوع التخفيض
    if (discountType === 'percentage' || discountType === 'fixed') {
      if (!discountValue) {
        alert('يرجى إدخال قيمة التخفيض');
        return;
      }
    } else if (discountType === 'package') {
      if (!packageSessions || !packagePrice) {
        alert('يرجى إدخال عدد الجلسات وسعر الحزمة');
        return;
      }
    }

    setLoading(true);

    try {
      const discountData = {
        area: selectedArea,
        areaName: bodyAreas.find(a => a.key === selectedArea)?.name || selectedArea,
        type: discountType,
        value: discountType === 'package' ? parseInt(packagePrice) : parseInt(discountValue),
        packageSessions: discountType === 'package' ? parseInt(packageSessions) : 0,
        remainingSessions: discountType === 'package' ? parseInt(packageSessions) : 0, // الجلسات المتبقية
        validUntil: validUntil,
        minSessions: parseInt(minSessions),
        createdAt: new Date().toISOString(),
        isActive: true,
        originalPrice: discountType === 'package' ? parseInt(packagePrice) : 0 // السعر الأصلي للحزمة
      };

      const discountRef = ref(db, `discounts/${selectedArea}`);
      await set(discountRef, discountData);

      // تفريغ الحقول
      setSelectedArea('');
      setDiscountType('percentage');
      setDiscountValue('');
      setPackageSessions('');
      setPackagePrice('');
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
    } else if (discount.type === 'fixed') {
      return `${discount.value} شيقل خصم`;
    } else if (discount.type === 'package') {
      return `${discount.packageSessions} جلسة - ${discount.value} ₪`;
    }
    return 'تخفيض';
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

  // دالة لتحديث الجلسات المتبقية في الحزمة
  const updateRemainingSessions = async (areaKey, sessionsUsed) => {
    try {
      const discountRef = ref(db, `discounts/${areaKey}`);
      onValue(discountRef, (snapshot) => {
        if (snapshot.exists()) {
          const discount = snapshot.val();
          const newRemaining = Math.max(0, (discount.remainingSessions || discount.packageSessions) - sessionsUsed);
          
          set(ref(db, `discounts/${areaKey}/remainingSessions`), newRemaining);
          
          // إذا نفذت الجلسات، تعطيل التخفيض تلقائياً
          if (newRemaining === 0) {
            set(ref(db, `discounts/${areaKey}/isActive`), false);
          }
        }
      }, { onlyOnce: true });
    } catch (error) {
      console.error('Error updating remaining sessions:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* الهيدر */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">إدارة التخفيضات والحزم</h1>
          <p className="text-gray-600">إدارة عروض التخفيضات والحزم لمناطق الجسم المختلفة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نموذج إضافة تخفيض */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">إضافة تخفيض/حزمة جديدة</h2>
            
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

              {/* نوع التخفيض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع العرض
                </label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    // تنظيف الحقول عند تغيير النوع
                    setDiscountValue('');
                    setPackageSessions('');
                    setPackagePrice('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="percentage">نسبة مئوية %</option>
                  <option value="fixed">مبلغ ثابت</option>
                  <option value="package">حزمة جلسات</option>
                </select>
              </div>

              {/* الحقول حسب نوع التخفيض */}
              {discountType === 'package' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد الجلسات *
                      </label>
                      <input
                        type="number"
                        value={packageSessions}
                        onChange={(e) => setPackageSessions(e.target.value)}
                        placeholder="مثال: 10"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        سعر الحزمة (₪) *
                      </label>
                      <input
                        type="number"
                        value={packagePrice}
                        onChange={(e) => setPackagePrice(e.target.value)}
                        placeholder="مثال: 5000"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {packageSessions && packagePrice && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💰 سعر الجلسة الواحدة: {Math.round(packagePrice / packageSessions)} ₪
                      </p>
                      <p className="text-sm text-blue-800">
                        📊 وفرت: {packageSessions * 150 - packagePrice} ₪ (بافتراض سعر الجلسة 150 ₪)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountType === 'percentage' ? 'النسبة المئوية % *' : 'المبلغ بالشيقل *'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'مثال: 20' : 'مثال: 50'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

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
                    أقل عدد مناطق
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
                  discountType === 'package' ? 'إضافة حزمة' : 'إضافة التخفيض'
                )}
              </button>
            </div>
          </div>

          {/* قائمة التخفيضات */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">التخفيضات والحزم الحالية</h2>
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
                                {discount.type === 'package' && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    📦 حزمة
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getDiscountText(discount)}
                              </p>
                              {discount.type === 'package' && discount.remainingSessions !== undefined && (
                                <p className="text-sm text-green-600 font-medium mt-1">
                                  ⏳ متبقي: {discount.remainingSessions} جلسة
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {discount.minSessions > 1 ? `لـ ${discount.minSessions} مناطق فأكثر` : 'لأي عدد مناطق'}
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
                          {discount.type === 'package' && (
                            <div>📊 إجمالي الجلسات: {discount.packageSessions}</div>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">
              {Object.values(discounts).filter(d => d.type === 'package').length}
            </div>
            <div className="text-sm text-gray-600">حزم جلسات</div>
          </div>
        </div>

        {/* إرشادات استخدام الحزم */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-3">🎯 كيفية استخدام حزم الجلسات:</h4>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>عند اختيار حزمة في صفحة إضافة الجلسة، سيتم خصم جلسة من المتبقي تلقائياً</li>
            <li>سعر الجلسة سيكون: (سعر الحزمة ÷ عدد الجلسات)</li>
            <li>سيتم حفظ الدفعة تلقائياً في صفحة المدفوعات</li>
            <li>عند انتهاء الجلسات، سيتم تعطيل الحزمة تلقائياً</li>
            <li>يمكن للعميل رؤية عدد الجلسات المتبقية في صفحة الجلسات</li>
          </ul>
        </div>
      </div>
    </div>
  );
}