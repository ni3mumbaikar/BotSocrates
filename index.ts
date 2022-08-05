/* --------------------------------- SERVER --------------------------------- */
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8080;
app.get("/", (req, res) => {
    res.send("Bot is running fine... no tension :)");
});

app.listen(port, () => {
    // console.clear();
    console.log("\nWeb-server running!\n");
});

/* --------------------------------- BAILEYS AND LOGGER IMPORTS --------------------------------- */

const {
    default: makeWASocket,
    DisconnectReason,
    AnyMessageContent,
    delay,
    useSingleFileAuthState,
    makeInMemoryStore,
    fetchLatestBaileysVersion,
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");

let MAIN_LOGGER = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` });
let noLogs = P({ level: "silent" }); //to hide the chat logs
const logger = MAIN_LOGGER.child({});
logger.level = "warn";

const { state, saveState } = useSingleFileAuthState("./auth_info_multi.json");

/* --------------------------------- CREATING SOCKET CONNECTION --------------------------------- */


const sock = makeWASocket({
    logger: noLogs,
    defaultQueryTimeoutMs: undefined,
    printQRInTerminal: true,
    auth: state,
});

sock.ev.on("creds.update", () => {
    // console.log("Creds updated!");
    saveState();
});
