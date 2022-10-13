const { text } = require('stream/consumers');
const badWords = require('../assets/others/profanitydb');

module.exports.badWordsDetector = async function (sock, msg, textContent) {
    let id = msg.key.remoteJid;
    console.log(id, msg);
    if (msg.key.fromMe != true) {
        let found = undefined;
        for (word of textContent.split(" ")) {
            if (badWords[word.toLowerCase()] != undefined) {
                console.log('call');
                found = word;
                break;
            }
        }
        if (found != undefined) {
            let sentMsg = await sock.sendMessage(id, {
                text: `⚠️ Tu ${found}`
            },
                { quoted: msg },
            );
        }
    }

}