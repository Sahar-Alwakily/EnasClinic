import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Prices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const pricesRef = ref(db, 'prices');
    
    const unsubscribe = onValue(pricesRef, (snapshot) => {
      if (snapshot.exists()) {
        setPrices(snapshot.val());
      } else {
        setPrices({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (key) => {
    try {
      const priceRef = ref(db, `prices/${key}`);
      await set(priceRef, parseFloat(editValue) || 0);
      setEditingKey(null);
      setEditValue("");
    } catch (error) {
      console.error("Error saving price:", error);
      alert("حدث خطأ أثناء حفظ السعر");
    }
  };

  const handleEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditValue(currentValue?.toString() || "");
  };

  const areaNames = {
    'البطن': 'abdomen',
    'منطقة البيكيني': 'bikiniArea',
    'الفخذين': 'thighs',
    'الظهر': 'back',
    'الكوع': 'elbow',
    'الذراع': 'arm',
    'الإبط': 'armpit',
    'الرقبة': 'neck',
    'الوجه': 'face',
    'اليد': 'hand',
    'القدمين': 'feet',
    'الساق': 'shin',
    'الجسم كامل': 'fullbody'
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 إدارة الأسعار</h1>
        <p className="text-gray-600">تعديل أسعار المناطق المختلفة</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">المنطقة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">السعر (₪)</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(areaNames).map(([arabicName, englishKey]) => (
                <tr key={englishKey} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{arabicName}</td>
                  <td className="px-6 py-4">
                    {editingKey === englishKey ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="السعر"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {prices[englishKey] || 0} ₪
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingKey === englishKey ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSave(englishKey)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => {
                            setEditingKey(null);
                            setEditValue("");
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(englishKey, prices[englishKey])}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        تعديل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

