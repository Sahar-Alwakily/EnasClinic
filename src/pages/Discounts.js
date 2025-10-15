import { useState } from 'react';
import { prices as initialPrices } from '../data';

export default function Discounts() {
  const [regions, setRegions] = useState(initialPrices.regions);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const add = () => {
    if (!name || !price) return alert('املأ الحقول');
    setRegions({ ...regions, [name]: Number(price) });
    setName('');
    setPrice('');
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">المناطق والتخفيضات</h2>

      {/* إدخال البيانات */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="اسم المنطقة"
            className="border p-2 rounded flex-1"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            placeholder="سعر المنطقة"
            type="number"
            className="border p-2 rounded flex-1"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
          <button
            onClick={add}
            className="bg-purple-600 text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            إضافة
          </button>
        </div>
      </div>

      {/* عرض المناطق */}
      <div className="bg-white rounded shadow overflow-hidden">
        <ul>
          {Object.keys(regions).map((r, idx) => (
            <li
              key={idx}
              className="p-3 border-b flex justify-between items-center"
            >
              <div className="font-medium">{r}</div>
              <div className="text-gray-600">{regions[r]}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
