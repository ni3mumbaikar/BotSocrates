import { env } from "process";

module.exports.reply = async function (sock, msg) {
  let id = msg.key.remoteJid;
  console.log("reply" + id && isGroupChat(id));
  if (id && isGroupChat(id)) {
    if (isGameEnableForGroup(id)) {
      let userJid = msg.key.participant;
      let sentMsg = await sock.sendMessage(
        id,
        {
          text: `✖️ tag opponent with @ for Example : "
              ${env.PREFIX}startXandZero @Nitin`,
        },
        { quoted: msg }
      );
    } else {
      let sentMsg = await sock.sendMessage(
        id,
        {
          text: `✖️ Game is not enabled for this group, please ask any group admin to enable it using ${env.PREFIX}enableXandZero`,
        },
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
