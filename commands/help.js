var helpDescription =
  "🖐️🤩 Hello Bot Socrates here \n\n" +
  "Following are the commands that you can use for now !\n\n" +
  "*/alive* : To check I am dead or alive 😨\n\n" +
  "*/help* : To get this menu 📝\n" +
  "Available Options : _admin_ ";


module.exports.reply = async function (sock, msg) {
  let id = msg.key.remoteJid;
  let sentMsg = await sock.sendMessage(
    id,
    { text: helpDescription },
    { quoted: msg }
  );
};

commandOptionsList = ["admin"];

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
  let id = msg.key.remoteJid;
  if (commandOptionsList.includes(option)) {
    if (option === "admin") {
      // TODO : Check for admin or not
      let sentMsg = await sock.sendMessage(id, {
        text: "Admin options will display here",
      }, { quoted: msg });
    }
  } else {
    let sentMsg = await sock.sendMessage(id, {
      text: "At least ask for help properly sensei !"
        + "\nNo command option found like " + option,
    }, { quoted: msg });
  }
};
