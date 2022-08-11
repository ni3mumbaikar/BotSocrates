const fs = require('fs');
const { Sticker, createSticker } = require('wa-sticker-formatter');
const path = require('path');
const P = require("pino");
const { downloadMediaMessage } = require('@adiwajshing/baileys');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports.reply = async function (sock, msg) {
    await stickerSender(sock, msg, 'crop')
};

module.exports.replyForCommandWithOption = async function (sock, msg, sizeOption) {
    let id = msg.key.remoteJid;
    if (sizeOption === 'crop' || sizeOption === 'full' || sizeOption === 'default') {
        await stickerSender(sock, msg, sizeOption)
    } else {
        let sentMsg = await sock.sendMessage(id, { text: 'Invalid option' }, { quoted: msg });
    }
}

async function stickerSender(sock, msg, sizeOption) {
    let id = msg.key.remoteJid;
    let isVideo = false;
    if (msg.message.conversation) {
        let sentMsg = await sock.sendMessage(id, { text: 'No Image Attached' }, { quoted: msg });
        return
    } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.quotedMessage) {
        if (msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage) {
            isVideo = true;
            await bufferMakerandSender(sock, msg, sizeOption, isVideo);
        } else if (msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage) {
            await bufferMakerandSender(sock, msg, sizeOption, isVideo);
        } else {
            let sentMsg = await sock.sendMessage(id, { text: 'No Image Attached' }, { quoted: msg });
        }
    }
}

async function bufferMakerandSender(sock, msg, sizeOption, isVideo) {
    let id = msg.key.remoteJid;
    var stickerOptions = { pack: 'Socrates', author: 'BotSocrates' }
    if (sizeOption)
        stickerOptions.type = sizeOption;
    if (isVideo) {
        stickerOptions.quality = 50;
        stickerOptions.animated = true;
        stickerOptions.type = 'full'
    }
    let newmsg = { message: msg.message.extendedTextMessage.contextInfo.quotedMessage }
    const buffer = await downloadMediaMessage(
        newmsg,
        'buffer',
        {},
        {
            logger: P({ level: "silent" }),
            reuploadRequest: sock.updateMediaMessage
        })
    const stickerbuffer = await createSticker(buffer, stickerOptions).catch((err) => {
        async () => {
            console.log(err);
            let sentMsg = await sock.sendMessage(id, { text: 'Something broke !' }, { quoted: msg });
        }
    });
    let sentMsg = await sock.sendMessage(id, { sticker: await stickerbuffer }, { quoted: msg });
}