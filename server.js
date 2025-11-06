const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware للتعامل مع المسارات
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// تقديم ملفات build بشكل ثابت
app.use(express.static(path.join(__dirname, "build"), {
  index: false, // منع auto-index
  dotfiles: 'allow' // السماح بملفات مثل .htaccess
}));

// معالجة جميع المسارات
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, "build");
  const fileExt = path.extname(req.path);
  
  // إذا كان الطلب لملف مع امتداد (مثل .js, .css, .png)
  if (fileExt && fileExt !== '.html') {
    const filePath = path.join(buildPath, req.path);
    
    // تحقق من وجود الملف
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else {
      console.log(`File not found: ${filePath}`);
      return res.status(404).send('File not found');
    }
  }
  
  // لجميع المسارات الأخرى، خدم index.html
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Build directory: ${path.join(__dirname, "build")}`);
});