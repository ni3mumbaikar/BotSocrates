let aliveDescription =
    "Aye aye captain !"

module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: aliveDescription },
        { quoted: msg }
    );
};