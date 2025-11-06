const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// تقديم ملفات build
app.use(express.static(path.join(__dirname, "build")));

// للـ React Router - يخدم index.html لجميع المسارات غير الموجودة
app.get("*", (req, res, next) => {
  // إذا كان الطلب لملف (يملك امتداد) فانتقل لل middleware التالي
  if (req.path.includes('.')) {
    return next();
  }
  // وإلا فخدم index.html
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));