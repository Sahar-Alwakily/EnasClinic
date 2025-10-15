import { useState, useEffect } from "react";
import { ref, get, set, remove, onValue, off } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";

export default function Helpers() {
  const [helpers, setHelpers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [helperToDelete, setHelperToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // جلب بيانات المساعدات من Firebase
  useEffect(() => {
    const helpersRef = ref(db, 'helpers');
    
    const unsubscribe = onValue(helpersRef, (snapshot) => {
      if (snapshot.exists()) {
        const helpersData = snapshot.val();
        const helpersList = Object.keys(helpersData).map(key => ({
          id: key,
          ...helpersData[key]
        }));
        setHelpers(helpersList);
      } else {
        setHelpers([]);
      }
    });

    return () => off(helpersRef, 'value', unsubscribe);
  }, []);

  const addHelper = async () => {
    if (!name || !email || !password) {
      alert("يرجى تعبئة كل الحقول");
      return;
    }

    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      // 1. إنشاء حساب في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. حفظ بيانات المساعدة في Realtime Database
      const helperData = {
        name,
        email,
        uid: user.uid,
        role: "helper",
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid // المديرة التي أنشأت الحساب
      };

      const helperRef = ref(db, `helpers/${user.uid}`);
      await set(helperRef, helperData);

      // 3. إضافة بيانات المستخدم في جدول users أيضًا للوصول السهل
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, {
        name,
        email,
        role: "helper",
        createdAt: new Date().toISOString()
      });

      // تفريغ الحقول
      setName("");
      setEmail("");
      setPassword("");

      alert("تم إضافة المساعدة بنجاح!");

    } catch (error) {
      console.error("Error adding helper:", error);
      
      let errorMessage = "حدث خطأ أثناء إضافة المساعدة";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "البريد الإلكتروني مستخدم بالفعل";
          break;
        case "auth/invalid-email":
          errorMessage = "البريد الإلكتروني غير صحيح";
          break;
        case "auth/weak-password":
          errorMessage = "كلمة المرور ضعيفة جداً";
          break;
        default:
          errorMessage = "حدث خطأ غير متوقع";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (helper) => {
    setHelperToDelete(helper);
    setModalOpen(true);
  };

  const deleteHelper = async () => {
    if (!helperToDelete) return;

    try {
      // 1. حذف من Firebase Authentication
      // ملاحظة: هذا يتطلب صلاحيات خاصة في Firebase، يمكن تخطيه إذا لم يكن متاحاً
      
      // 2. حذف من Realtime Database
      const helperRef = ref(db, `helpers/${helperToDelete.uid}`);
      await remove(helperRef);

      // 3. حذف من جدول users
      const userRef = ref(db, `users/${helperToDelete.uid}`);
      await remove(userRef);

      setModalOpen(false);
      setHelperToDelete(null);
      
      alert("تم حذف المساعدة بنجاح!");

    } catch (error) {
      console.error("Error deleting helper:", error);
      alert("حدث خطأ أثناء حذف المساعدة");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addHelper();
    }
  };

  return (
    <div className="container-max p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">إدارة المساعدات</h2>

      {/* إضافة مساعدة جديدة */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">إضافة مساعدة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="أدخل الاسم الكامل"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="example@clinic.com"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="6 أحرف على الأقل"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          onClick={addHelper}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              جاري الإضافة...
            </>
          ) : (
            "إضافة مساعدة"
          )}
        </button>
      </div>

      {/* قائمة المساعدات */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">قائمة المساعدات</h3>
        </div>
        
        {helpers.length > 0 ? (
          <ul>
            {helpers.map((helper) => (
              <li
                key={helper.id}
                className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {helper.name?.charAt(0) || "م"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{helper.name}</div>
                      <div className="text-sm text-gray-500">{helper.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    مساعدة
                  </span>
                  <button
                    onClick={() => confirmDelete(helper)}
                    className="px-3 py-1.5 text-sm border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>لا يوجد مساعدات مسجلين بعد</p>
            <p className="text-sm mt-1">قم بإضافة مساعدات جديدة للبدء</p>
          </div>
        )}
      </div>

      {/* Modal تأكيد الحذف */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">تأكيد الحذف</h3>
            <p className="mb-4 text-gray-600">
              هل أنت متأكد من حذف المساعدة{" "}
              <span className="font-semibold text-red-600">{helperToDelete?.name}</span>؟
            </p>
            <p className="text-sm text-gray-500 mb-4">
              لن يتمكن هذا المستخدم من تسجيل الدخول بعد الآن
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={deleteHelper}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex-1"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition flex-1"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}