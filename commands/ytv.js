
const ytd = require('../utils/YtDownloader');
module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: '✖️ No youtube video provided' },
        { quoted: msg }
    );
};


module.exports.replyForCommandWithOption = async function (sock, msg, option) {
    let id = msg.key.remoteJid;
    ytd(sock, msg, option, id).catch(err => async function (err) {
        console.error('Error : ' + err);
        let sentMsg = await sock.sendMessage(
            id,
            { text: '✖️ Youtube videos are not supported try with youtube shorts url' },
            { quoted: msg }
        );
    });
}
