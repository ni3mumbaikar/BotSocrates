require('dotenv').config();
/* --------------------------------- IMPORTS --------------------------------- */
const P = require("pino");
const qrcode = require("qrcode-terminal");
const commandsHandler = require("./utils/commandsHandler");
const express = require("express");

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

let whatsappSock = null;

/* --------------------------------- MAIN METHOD --------------------------------- */

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
  });

  whatsappSock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      let shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect
      );

      if (shouldReconnect) {
        await connectToWhatsApp();
      }
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = JSON.parse(JSON.stringify(m)).messages[0];
    if (!msg.message) return; // skip if no actual message (group events)
    await commandsHandler.handler(sock, msg);
  });


}

/* --------------------------------- PROGRAM STARTS HERE --------------------------------- */

console.log("Starting Bot Socrates...");
connectToWhatsApp();

/* --------------------------------- EXPRESS SERVER --------------------------------- */

const app = express();
app.use(express.json());

app.post('/send-message', async (req, res) => {
  try {
    const text = req.body.text || "";
    const formattedText = `${text.trim()}`;

    if (!whatsappSock) {
      return res.status(503).json({ error: "WhatsApp connection not established yet" });
    }

    const groupIdsEnv = process.env.GROUP_IDS || "120363430135287154@g.us";
    const targetGroups = groupIdsEnv.split(",").map(id => id.trim()).filter(id => id.length > 0);

    if (targetGroups.length === 0) {
      return res.status(400).json({ error: "No target groups configured in GROUP_IDS environment variable" });
    }

    const results = [];
    for (const group of targetGroups) {
      try {
        await whatsappSock.sendMessage(group, { text: formattedText });
        results.push({ group, status: "success" });
      } catch (err) {
        console.error(`Failed to send message to group ${group}:`, err);
        results.push({ group, status: "failed", error: err.message });
      }
    }

    const allSuccessful = results.every(r => r.status === "success");
    const anySuccessful = results.some(r => r.status === "success");

    if (allSuccessful) {
      return res.status(200).json({ 
        status: "success", 
        message: "Messages sent successfully to all groups", 
        text: formattedText,
        results 
      });
    } else if (anySuccessful) {
      return res.status(207).json({ 
        status: "partial_success", 
        message: "Messages sent to some groups, but failed for others", 
        text: formattedText,
        results 
      });
    } else {
      return res.status(500).json({ 
        status: "failed", 
        message: "Failed to send messages to all target groups", 
        text: formattedText,
        results 
      });
    }
  } catch (error) {
    console.error("Error sending message through API:", error);
    return res.status(500).json({ error: "Failed to send message", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

