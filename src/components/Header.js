export default function Header({ manager }) {
return (
<header className="bg-white shadow-sm p-4 flex items-center justify-between">
<div>
<h1 className="text-2xl font-bold text-gray-800">مرحباً، {manager.name}</h1>
<p className="text-sm text-gray-500">تابع آخر الجلسات وإدارة العملاء</p>
</div>


<div className="flex items-center gap-3">
<div className="text-right">
<div className="text-sm text-gray-500">المديرة</div>
<div className="font-medium text-gray-800">{manager.name}</div>
</div>
<img src={manager.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border" />
</div>
</header>
);
}