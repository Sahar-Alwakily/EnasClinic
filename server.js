const express = require("express");
const path = require("path");
const app = express();

// الاستماع على المنفذ الذي يعطيه Render أو 3000 افتراضي
const PORT = process.env.PORT || 3000;

// تقديم ملفات build
app.use(express.static(path.join(__dirname, "build")));

// كل الطلبات ترجع index.html (ضروري للـ React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
