var helpDescription =
  "🖐️🤩 Hello Bot Socrates here \n\n" +
  "Following are the commands that you can use for now !" +
  "\n\n*/alive* : To check I am dead or alive 😨" +
  "\n\n*/help* : To get this menu 📝\n" +
  "Available Options : _admin_ \n" +
  "Alias : _h_" +
  "\n\n*/sticker* : Create stickers from any Image/GIF/Video 🖼️\n" +
  "Available Options : _default_, _crop_, _full_ " +
  "\n\n*/image* : Convert stickers to GIF or Image 🖼️\n" +
  "Alias : _img_" +
  "\n\n*/insta* : Download any public Image/Video from instagram ⬇️\n" +
  "Parameter : _Instagram content link_\n" +
  "Alias : _igd_" +
  "\n\n*/tts* : Convert text to speech 🔊\n" +
  "Parameter : _Text to convert_\n" +
  "Alias : _speak_" +
  "\n\n*/shortener* : Shorten any URL 🔗\n" +
  "Parameter : _URL to shorten_\n" +
  "Alias : _short_" +
  /*
  "\n\ntextoverlay* : Add text to an image or sticker 📝🖼️\n" +
  "Parameter : _Quote an image/sticker and provide text in caption_\n" +
  "Alias : _to_" +
  */
  "\n\n*/instadp* : Download profile picture from instagram by username or profile link 📷\n" +
  "Parameter : _Instagram username or profile link_\n" +
  "Alias : _idp_";


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
