import { useState, useEffect } from "react";
import { ref, onValue, set, push } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Helpers() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHelperName, setNewHelperName] = useState("");

  useEffect(() => {
    const helpersRef = ref(db, 'helpers');
    
    const unsubscribe = onValue(helpersRef, (snapshot) => {
      if (snapshot.exists()) {
        const helpersData = snapshot.val();
        const helpersList = Object.entries(helpersData).map(([id, helper]) => ({
          id,
          ...helper
        }));
        setHelpers(helpersList);
      } else {
        setHelpers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddHelper = async (e) => {
    e.preventDefault();
    if (!newHelperName.trim()) return;

    try {
      const helpersRef = ref(db, 'helpers');
      const newHelperRef = push(helpersRef);
      await set(newHelperRef, {
        name: newHelperName.trim(),
        createdAt: new Date().toISOString()
      });
      setNewHelperName("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding helper:", error);
      alert("حدث خطأ أثناء إضافة المساعد");
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👩‍💼 إدارة المساعدات</h1>
          <p className="text-gray-600">إدارة قائمة المساعدات في العيادة</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
        >
          {showAddForm ? "إلغاء" : "+ إضافة مساعد"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddHelper}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">اسم المساعد:</label>
              <input
                type="text"
                value={newHelperName}
                onChange={(e) => setNewHelperName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="أدخل اسم المساعد..."
                required
              />
            </div>
            <div className="flex gap-2">
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
                  setNewHelperName("");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {helpers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">👩‍💼</div>
          <p className="text-gray-500 text-lg">لا توجد مساعدات مسجلة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpers.map((helper) => (
            <div
              key={helper.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  👩‍💼
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {helper.name || "مساعد غير معروف"}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

