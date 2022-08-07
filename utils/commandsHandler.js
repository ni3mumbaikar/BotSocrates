require("dotenv").config();

let PREFIX = process.env.PREFIX;

module.exports.handler = function handleMessage(msg) {
  // checks for in-reply messages and enforces group only policy
  if (msg.message && msg.key.remoteJid.endsWith("@g.us")) {
    if (
      msg.message.extendedTextMessage &&
      msg.message.extendedTextMessage.text &&
      msg.message.extendedTextMessage.text.startsWith(PREFIX)
    ) {
      switchMaster(msg.message.extendedTextMessage.text);
    }
    // checks for simple conversations in group and personal
    else if (
      msg.message.conversation &&
      msg.message.conversation.startsWith(PREFIX)
    ) {
      switchMaster(msg.message.conversation);
    }
  }
};

/* --------------------------------- Multi module calling function --------------------------------- */

function switchMaster(command) {
  console.log(command);
}
