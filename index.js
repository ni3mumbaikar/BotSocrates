require('dotenv').config();
/* --------------------------------- IMPORTS --------------------------------- */
const P = require("pino");
const qrcode = require("qrcode-terminal");
const commandsHandler = require("./utils/commandsHandler");
const setUpCrons = require("./utils/crons").setUpCrons;

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

/* --------------------------------- MAIN METHOD --------------------------------- */

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
  });

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

  try {
    await setUpCrons(sock);
  } catch (err) {
    console.log("err :>> ", err);
  }
}

/* --------------------------------- PROGRAM STARTS HERE --------------------------------- */

console.log("--------------------------------- BOT SOCRATES INITIALIZED ---------------------------------");
connectToWhatsApp();
