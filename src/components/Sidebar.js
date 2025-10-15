import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ open, setOpen, onLogout }) {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: "📊", label: "لوحة التحكم" },
    { path: "/customers", icon: "👥", label: "العملاء" },
    { path: "/payments", icon: "💳", label: "إدارة الدفعات" }, // أضيف هذا السطر
    { path: "/reviews", icon: "⭐", label: "تقييمات العملاء" },
    { path: "/helpers", icon: "👩‍💼", label: "المساعدات" },
    { path: "/prices", icon: "💰", label: "الأسعار" },
    { path: "/discounts", icon: "🎫", label: "التخفيضات" },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${
          open ? "block" : "hidden"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform lg:translate-x-0 lg:static lg:inset-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">عيادة إناس</h2>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition ${
                    location.pathname === item.path
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* زر تسجيل الخروج */}
          <div className="mt-8 pt-4 border-t">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
            >
              <span className="text-lg">🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}