const fs = require('fs')
const { Sticker } = require('wa-sticker-formatter');
const path = require('path')

module.exports.reply = async function (sock, msg) {
    let id = msg.key.remoteJid;
    const sticker = new Sticker(fs.readFileSync(path.join(__dirname, '../assets/stickers/naughty.webp')), { quality: 50 }).setAuthor('BotSocrates').setPack('Socrates');
    const stickerPath = path.join(__dirname, 'naughty.webp');
    let sentMsg = await sock.sendMessage(id, { sticker: await sticker.build() });
};