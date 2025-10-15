import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">مرحبا بك في مركز الجمال</h1>
      <p className="mb-6 text-gray-600">تحكم في الأسعار والمناطق بسهولة.</p>
      <button
        onClick={() => navigate("/login")}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
      >
        تسجيل الدخول
      </button>
    </div>
  );
}
