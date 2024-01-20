const { checkAdmin, isGroupChat } = require("../../../utils/common");

module.exports.reply = async function (sock, msg) {
  let id = msg.key.remoteJid;
  console.log("reply" + id && isGroupChat(id));
  if (id && isGroupChat(id)) {
    let userJid = msg.key.participant;
    if (checkAdmin(sock, id, userJid)) {
      let sentMsg = await sock.sendMessage(
        id,
        { text: "X and Zero is enabled for this group" },
        { quoted: msg }
      );
    } else {
      let sentMsg = await sock.sendMessage(
        id,
        { text: "✖️ only group admins can enable this game" },
        { quoted: msg }
      );
    }
  } else {
    let sentMsg = await sock.sendMessage(
      id,
      { text: "✖️ Group Command only, please use it in a group" },
      { quoted: msg }
    );
  }
};

module.exports.replyForCommandWithOption = async function (
  sock,
  msg,
  option
) {};
