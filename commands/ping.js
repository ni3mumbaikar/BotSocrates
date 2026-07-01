module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let timestamp = msg.messageTimestamp;
    
    // msg.messageTimestamp is in seconds, Date.now() is in milliseconds.
    let latency = timestamp ? Math.max(0, Date.now() - (timestamp * 1000)) : "unknown";
    
    let text = `Pong! ⚡ Latency: ${latency}ms | Server Status: Stable.`;
    
    await sock.sendMessage(
        id,
        { text: text },
        { quoted: msg }
    );
};
