const carbonGenerator = require('../utils/carbonGenerator').carbonGenerator;

module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: `Paste your code after ${process.env.PREFIX}carbon command` },
        { quoted: msg }
    );
}

module.exports.replyForCommandWithOption = async function (sock, msg, code) {
    carbonGenerator(sock, msg, code)
}

module.exports.replyForCommandWithMultiOptions = async function (sock, msg, code) {
    carbonGenerator(sock, msg, code)
}