const InstaDownloader = require('../utils/InstaDownloader');

module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    let sentMsg = await sock.sendMessage(
        id,
        { text: '✖️ No link provided' },
        { quoted: msg }
    );
};

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
    let id = msg.key.remoteJid;
    if (option.startsWith("https://www.instagram.com")) {
        InstaDownloader.igDownload(sock, id, msg, option)
    } else {
        let sentMsg = await sock.sendMessage(
            id,
            { text: '✖️ Kindly provide instagram links 🔗 only ' },
            { quoted: msg }
        );
    }
}



// module.exports = InstaDownloader;

// items[0].video_versions.url[0];
// items[0].carousel_media[0].image_versions2.candidates[0].url;