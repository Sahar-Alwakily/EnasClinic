/**
 * دوال مساعدة للتعامل مع الأرقام والتواريخ
 */

/**
 * تحويل الأرقام العربية (٠-٩) إلى أرقام إنجليزية (0-9)
 * @param {string|number} str - النص أو الرقم المراد تحويله
 * @returns {string} - النص بأرقام إنجليزية
 */
export const toEnglishNumbers = (str) => {
  if (!str && str !== 0) return str;
  return str.toString().replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660);
};

/**
 * تنسيق التاريخ بصيغة DD/MM/YYYY بأرقام إنجليزية
 * @param {string|Date} date - التاريخ المراد تنسيقه
 * @returns {string} - التاريخ المنسق
 */
export const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * تنسيق التاريخ والوقت بأرقام إنجليزية
 * @param {string|Date} date - التاريخ والوقت المراد تنسيقه
 * @returns {string} - التاريخ والوقت المنسق
 */
export const formatDateTime = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};

/**
 * تنسيق الوقت فقط بأرقام إنجليزية
 * @param {string|Date} date - الوقت المراد تنسيقه
 * @returns {string} - الوقت المنسق
 */
export const formatTime = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--:--';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};


