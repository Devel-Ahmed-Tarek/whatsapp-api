const { Boom } = require("@hapi/boom");
const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

let sock; // نخزن الاتصال هنا علشان نستخدمه في API

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    "./auth_info_baileys"
  );
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === "open") {
      console.log("✅ WhatsApp connection opened");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    console.log("📩 New Message: ", JSON.stringify(m, undefined, 2));
  });
}

// ✅ API لإرسال رسالة
app.post("/send", async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ error: "number and message are required" });
    }

    const jid = number + "@s.whatsapp.net";

    await sock.sendMessage(jid, { text: message });

    res.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = process.env.PORT || 3000;

connectToWhatsApp().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
  });
});
