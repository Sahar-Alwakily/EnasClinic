const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// تقديم ملفات build بشكل ثابت
app.use(express.static(path.join(__dirname, "build")));

// استخدام middleware بدلاً من app.get للمسار العام
app.use((req, res, next) => {
  // إذا كان الطلب لا يتوافق مع أي ملف ثابت، فخدم index.html
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});