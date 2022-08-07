/* --------------------------------- IMPORTS --------------------------------- */

const fs = require("fs");
const P = require("pino");
const commandsHandler = require("./utils/commandsHandler");

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

  sock.ev.on("messages.upsert", async (m) => {
    const msg = JSON.parse(JSON.stringify(m)).messages[0];
    if (!msg.message) return; //when demote, add, remove, etc happen then msg.message is not there
    commandsHandler.handler(msg);
  });
}

/* --------------------------------- PROGRAM STARTS HERE --------------------------------- */

connectToWhatsApp();
