const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// تقديم ملفات build
app.use(express.static(path.join(__dirname, "build")));

// أي مسار غير معروف يرسل index.html
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
