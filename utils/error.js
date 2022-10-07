module.exports.InternalServerError = async function InternalServerError(id, msg, sock) {
    let sentMsg = await sock.sendMessage(id, {
        text: "500 Internal Server Error"
    }, { quoted: msg });
}