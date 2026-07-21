function cleanJid(jid) {
    if (!jid || typeof jid !== 'string') return "";
    const parts = jid.split('@');
    if (parts.length < 2) return jid.split(':')[0];
    const user = parts[0];
    const host = parts[1];
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@${host}`;
}

module.exports.reply = async function (sock, msg) {
    const id = msg.key.remoteJid;
    if (!id) return;

    const isGroup = id.endsWith('@g.us');
    let text = "";

    if (isGroup) {
        const groupJid = cleanJid(id);
        const senderJid = cleanJid(msg.key.participant || msg.participant || (msg.key.fromMe ? (sock.user && sock.user.id) : ""));
        text = `*Group ID:* ${groupJid}\n*Sender JID:* ${senderJid}`;
    } else {
        const userJid = cleanJid(id);
        text = `*User JID:* ${userJid}`;
    }

    await sock.sendMessage(
        id,
        { text: text },
        { quoted: msg }
    );
};
