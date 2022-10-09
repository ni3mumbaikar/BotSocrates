const Carbon = require("unofficial-carbon-now")

module.exports.carbonGenerator = async function (sock, msg, code) {
    let id = msg.key.remoteJid;
    const carbon = new Carbon.createCarbon();
    carbon.setPrettify(true);
    carbon.setCode(code);
    const buffer = await Carbon.generateCarbon(carbon);
    // if (msg && id) {
    let sentMsg = await sock.sendMessage(
        id,
        {
            image: buffer
        },
        { quoted: msg }
    );
}