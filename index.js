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
let isConnecting = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
const BASE_RECONNECT_DELAY = 3000; // 3s initial delay
const MAX_RECONNECT_DELAY = 30000; // 30s maximum delay

function cleanupSocket(s) {
  if (!s) return;
  try {
    s.ev.removeAllListeners();
    if (s.end) {
      s.end(new Error("Cleaning up previous socket connection"));
    } else if (s.ws && s.ws.close) {
      s.ws.close();
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  if (whatsappSock === s) {
    whatsappSock = null;
  }
}

/* --------------------------------- MAIN METHOD --------------------------------- */

async function connectToWhatsApp() {
  if (isConnecting) {
    console.log("WhatsApp connection already in progress, skipping duplicate call.");
    return;
  }
  isConnecting = true;

  try {
    // Clean up any existing active socket instance before creating a new one
    if (whatsappSock) {
      cleanupSocket(whatsappSock);
    }

    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307],
      isLatest: false,
    }));
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
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        const errorMessage = lastDisconnect?.error?.message || statusCode || "Connection closed";

        console.log(
          `Connection closed: ${errorMessage} (statusCode: ${statusCode || "unknown"}). Reconnecting: ${shouldReconnect}`
        );

        cleanupSocket(sock);

        if (shouldReconnect) {
          if (!reconnectTimer) {
            const delay = Math.min(
              BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
              MAX_RECONNECT_DELAY
            );
            reconnectAttempts++;
            console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectToWhatsApp();
            }, delay);
          }
        } else {
          console.log(
            "Device was logged out from WhatsApp. Please delete auth_info_baileys and restart to scan a new QR code."
          );
        }
      } else if (connection === "open") {
        console.log("WhatsApp connection opened successfully!");
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      try {
        const msg = m.messages?.[0];
        if (!msg || !msg.message) return; // skip if no actual message (group events)
        if (msg.key?.fromMe) return; // prevent processing own messages
        await commandsHandler.handler(sock, msg);
      } catch (err) {
        console.error("Error processing incoming message:", err?.message || err);
      }
    });
  } catch (err) {
    console.error("Error establishing WhatsApp connection:", err?.message || err);
    if (!reconnectTimer) {
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY
      );
      reconnectAttempts++;
      console.log(`Retrying connection in ${delay / 1000}s (attempt ${reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectToWhatsApp();
      }, delay);
    }
  } finally {
    isConnecting = false;
  }
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

