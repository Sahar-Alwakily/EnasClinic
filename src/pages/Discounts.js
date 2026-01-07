import { useState, useEffect } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    area: "",
    areaName: "",
    type: "percentage",
    value: "",
    minSessions: 1,
    validUntil: "",
    isActive: true,
    packageType: "regular"
  });

  useEffect(() => {
    const discountsRef = ref(db, 'discounts');
    
    const unsubscribe = onValue(discountsRef, (snapshot) => {
      if (snapshot.exists()) {
        const discountsData = snapshot.val();
        const discountsList = Object.entries(discountsData).map(([id, discount]) => ({
          id,
          ...discount
        }));
        setDiscounts(discountsList);
      } else {
        setDiscounts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddDiscount = async (e) => {
    e.preventDefault();
    
    try {
      const discountsRef = ref(db, 'discounts');
      const newDiscountRef = push(discountsRef);
      
      const discountData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        minSessions: parseInt(formData.minSessions) || 1,
        isActive: formData.isActive !== false,
        createdAt: new Date().toISOString()
      };

      // إذا كانت حزمة، أضف معلومات الحزمة
      if (formData.packageType === "package") {
        discountData.type = "package";
        discountData.packageSessions = parseInt(formData.packageSessions) || 0;
        discountData.remainingSessions = discountData.packageSessions;
      }

      await set(newDiscountRef, discountData);
      
      setFormData({
        area: "",
        areaName: "",
        type: "percentage",
        value: "",
        minSessions: 1,
        validUntil: "",
        isActive: true,
        packageType: "regular"
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding discount:", error);
      alert("حدث خطأ أثناء إضافة التخفيض");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التخفيض؟")) return;
    
    try {
      const discountRef = ref(db, `discounts/${id}`);
      await remove(discountRef);
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert("حدث خطأ أثناء حذف التخفيض");
    }
  };

  const areaNames = {
    'abdomen': 'البطن',
    'bikiniArea': 'منطقة البيكيني',
    'thighs': 'الفخذين',
    'back': 'الظهر',
    'elbow': 'الكوع',
    'arm': 'الذراع',
    'armpit': 'الإبط',
    'neck': 'الرقبة',
    'face': 'الوجه',
    'hand': 'اليد',
    'feet': 'القدمين',
    'shin': 'الساق',
    'fullbody': 'الجسم كامل'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎫 إدارة التخفيضات</h1>
          <p className="text-gray-600">إدارة التخفيضات والعروض الخاصة</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
        >
          {showAddForm ? "إلغاء" : "+ إضافة تخفيض"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddDiscount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">نوع العرض:</label>
                <select
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="regular">تخفيض عادي</option>
                  <option value="package">حزمة مدفوعة مسبقاً</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المنطقة:</label>
                <select
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">اختر المنطقة</option>
                  {Object.entries(areaNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">اسم العرض:</label>
                <input
                  type="text"
                  value={formData.areaName}
                  onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: حزمة البطن 10 جلسات"
                  required
                />
              </div>

              {formData.packageType === "regular" && (
                <>
                  <div>
                    <label className="block text-gray-700 mb-2">نوع التخفيض:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (₪)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">قيمة التخفيض:</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={formData.type === "percentage" ? "مثال: 10" : "مثال: 50"}
                      required={formData.packageType === "regular"}
                    />
                  </div>
                </>
              )}

              {formData.packageType === "package" && (
                <div>
                  <label className="block text-gray-700 mb-2">عدد الجلسات في الحزمة:</label>
                  <input
                    type="number"
                    value={formData.packageSessions || ""}
                    onChange={(e) => setFormData({ ...formData, packageSessions: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: 10"
                    required={formData.packageType === "package"}
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">تاريخ الانتهاء (اختياري):</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">نشط</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    area: "",
                    areaName: "",
                    type: "percentage",
                    value: "",
                    minSessions: 1,
                    validUntil: "",
                    isActive: true,
                    packageType: "regular"
                  });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {discounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🎫</div>
          <p className="text-gray-500 text-lg">لا توجد تخفيضات مسجلة بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {discount.areaName || areaNames[discount.area] || discount.area}
                    </h3>
                    {discount.type === 'package' && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        📦 حزمة
                      </span>
                    )}
                    {discount.isActive ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        ✓ نشط
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        ✗ غير نشط
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-600 space-y-1">
                    <p>المنطقة: {areaNames[discount.area] || discount.area}</p>
                    {discount.type === 'package' ? (
                      <p>
                        عدد الجلسات: {discount.packageSessions || 0} | 
                        المتبقي: {discount.remainingSessions || discount.packageSessions || 0}
                      </p>
                    ) : (
                      <p>
                        التخفيض: {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₪`}
                      </p>
                    )}
                    {discount.validUntil && (
                      <p>صالح حتى: {new Date(discount.validUntil).toLocaleDateString('ar-EG')}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(discount.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition mr-4"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

