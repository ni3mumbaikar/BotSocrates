module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    if (id === '918692933741@s.whatsapp.net') {
        if (msg.message && msg.message.conversation) {
            let sentMsg = await sock.sendMessage(
                id,
                { text: 'No message attahced' },
                { quoted: msg }
            );
        } else if (msg.message && msg.message.extendedTextMessage) {

            console.log(msg.message.extendedTextMessage);
            let key = {
                remoteJid: id,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                fromMe: true,
                participant: msg.message.extendedTextMessage.contextInfo.participant
            }
            await sock.sendMessage(id, { delete: key })
        }
    } else {
        let sentMsg = await sock.sendMessage(
            id,
            { text: 'Unauthorized ⚠️' },
            { quoted: msg }
        );
    }
};

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: 'No options available for this commands \ntry /del only without any options 🗑️' },
        { quoted: msg }
    );
}