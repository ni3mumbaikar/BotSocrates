const InstaDownloader = require('../utils/InstaDownloader');

module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: '✖️ No profile provided' },
        { quoted: msg }
    );
};

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
    let id = msg.key.remoteJid;
    InstaDownloader.iProfile(sock, id, msg, option)
}