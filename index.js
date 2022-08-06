/* --------------------------------- IMPORTS --------------------------------- */

const fs = require("fs");
const P = require("pino");

const {
  default: makeWASocket,
  DisconnectReason,
  AnyMessageContent,
  delay,
  useMultiFileAuthState,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
} = require("@adiwajshing/baileys");

/* --------------------------------- MAIN METHOD --------------------------------- */

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: P({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("Closed");

      let shouldReconnect =
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );

      if (shouldReconnect) {
        shouldReconnect = false;
        await connectToWhatsApp();
      }
    }
  });
}

/* --------------------------------- PROGRAM STARTS HERE --------------------------------- */

connectToWhatsApp();
