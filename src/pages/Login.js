import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "../firebaseConfig";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("الرجاء ملء جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      // تسجيل الدخول باستخدام Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // جلب بيانات المستخدم الإضافية من Realtime Database
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      let userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "مدير النظام"
      };

      if (snapshot.exists()) {
        // إذا وجدت بيانات إضافية في Realtime Database
        const dbData = snapshot.val();
        userData = {
          ...userData,
          ...dbData,
          name: dbData.name || user.displayName || "مدير النظام"
        };
      } else {
        // إذا لم توجد بيانات، إنشاء سجل جديد للمستخدم
        await set(userRef, {
          name: user.displayName || "مدير النظام",
          email: user.email,
          role: "admin",
          createdAt: new Date().toISOString()
        });
      }

      // تمرير بيانات المستخدم إلى App.js
      onLogin(userData);
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "البريد الإلكتروني غير صحيح";
          break;
        case "auth/user-not-found":
          errorMessage = "المستخدم غير موجود";
          break;
        case "auth/wrong-password":
          errorMessage = "كلمة المرور خاطئة";
          break;
        case "auth/too-many-requests":
          errorMessage = "محاولات تسجيل دخول كثيرة، حاول لاحقاً";
          break;
        default:
          errorMessage = "حدث خطأ غير متوقع";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">تسجيل الدخول</h2>
          <p className="text-gray-600">مرحباً بعودتك إلى نظام إدارة العيادة</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              placeholder="example@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              كلمة المرور
            </label>
            <input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                جاري تسجيل الدخول...
              </div>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            نظام إدارة عيادة ايناس كلينك
          </p>
        </div>
      </div>
    </div>
  );
}