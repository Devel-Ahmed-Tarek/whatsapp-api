const crypto = require("crypto");
const axios = require("axios");

const number = "01013237805"; // غيره برقم حقيقي عليه واتساب
const message = "السلام عليكم 👋";
const secretKey = "s@a3&29fJv3W9d#4K"; // نفس المفتاح السري

const payload = `${number}:${message}`;
const signature = crypto
  .createHmac("sha256", secretKey)
  .update(payload)
  .digest("hex");

// إرسال الطلب للسيرفر
axios
  .post("http://localhost:3000/send", {
    number,
    message,
    signature,
  })
  .then((res) => console.log("✅", res.data))
  .catch((err) => console.error("❌", err.response?.data || err.message));
