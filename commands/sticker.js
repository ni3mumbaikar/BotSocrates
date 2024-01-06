const fs = require("fs");
const { Sticker, createSticker } = require("wa-sticker-formatter");
const path = require("path");
const P = require("pino");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const { writeFile } = require("fs/promises");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

ffmpeg.setFfmpegPath(ffmpegPath);

const vlen = 10;

const getRandomName = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.reply = async function (sock, msg) {
  await stickerSender(sock, msg, "crop");
};

module.exports.replyForCommandWithOption = async function (
  sock,
  msg,
  sizeOption
) {
  let id = msg.key.remoteJid;
  if (
    sizeOption === "crop" ||
    sizeOption === "full" ||
    sizeOption === "default"
  ) {
    await stickerSender(sock, msg, sizeOption);
  } else {
    let sentMsg = await sock.sendMessage(
      id,
      { text: "Invalid option" },
      { quoted: msg }
    );
  }
};

async function stickerSender(sock, msg, sizeOption) {
  let id = msg.key.remoteJid;
  let isVideo = false;
  if (msg.message.conversation) {
    let sentMsg = await sock.sendMessage(
      id,
      { text: "No Image Attached" },
      { quoted: msg }
    );
    return;
  } else if (
    msg.message.extendedTextMessage &&
    msg.message.extendedTextMessage.contextInfo.quotedMessage
  ) {
    if (
      msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage
    ) {
      if (
        msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage
          .seconds > vlen
      ) {
        let sentMsg = await sock.sendMessage(
          id,
          { text: "🎥 Trimmed video to maximum " + vlen + " seconds 🕛" },
          { quoted: msg }
        );
      }
      isVideo = true;
      await bufferMakerandSender(sock, msg, sizeOption, isVideo);
    } else if (
      msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
    ) {
      await bufferMakerandSender(sock, msg, sizeOption, isVideo);
    } else {
      let sentMsg = await sock.sendMessage(
        id,
        { text: "No Image Attached" },
        { quoted: msg }
      );
    }
  }
}

async function bufferMakerandSender(sock, msg, sizeOption, isVideo) {
  let id = msg.key.remoteJid;
  var stickerOptions = { pack: "Socrates", author: "BotSocrates" };

  outputOptions = [
    `-vcodec`,
    `libwebp`,
    `-vf`,
    `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
  ];

  if (sizeOption) {
    stickerOptions.type = sizeOption;
    if (sizeOption === "crop") {
      outputOptions = [
        `-vcodec`,
        `libwebp`,
        `-vf`,
        `crop=w='min(min(iw\,ih)\,500)':h='min(min(iw\,ih)\,500)',scale=500:500,setsar=1,fps=15`,
        `-loop`,
        `0`,
        `-ss`,
        `00:00:00.0`,
        `-t`,
        `00:00:10.0`,
        `-preset`,
        `default`,
        `-an`,
        `-vsync`,
        `0`,
        `-s`,
        `512:512`,
      ];
    }
  }

  let newmsg = {
    message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
  };
  const buffer = await downloadMediaMessage(
    newmsg,
    "buffer",
    {},
    {
      logger: P({ level: "silent" }),
      reuploadRequest: sock.updateMediaMessage,
    }
  );

  if (isVideo) {
    stickerOptions.quality = 50;
    stickerOptions.animated = true;
    stickerOptions.type = "full";

    const media = getRandomName(".mp4");
    const stream = await downloadContentFromMessage(
      msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage,
      "video"
    );

    const media1 = getRandomName(".mp4");
    await writeFile(media1, buffer);
    const ran = getRandomName(".webp");

    ffmpeg(`./${media1}`)
      .setStartTime("00:00:00")
      .setDuration(vlen.toString())
      .output(media)
      .on("end", function (err) {
        if (err) {
          fs.unlinkSync(media);
          fs.unlinkSync(ran);
          fs.unlinkSync(media1);

          return;
        }
        ffmpeg(`./${media}`)
          .inputFormat(media.split(".")[1])
          .on("error", function (err) {
            fs.unlinkSync(media);
            fs.unlinkSync(media1);
            fs.unlinkSync(ran);
            return;
          })
          .on("end", async function () {
            const sticker = new Sticker(ran, { quality: 50 })
              .setAuthor("BotSocrates")
              .setPack("Socrates");
            let sentMsg = await sock.sendMessage(id, {
              sticker: await sticker.build(),
            });
            fs.unlinkSync(media);
            fs.unlinkSync(media1);
            fs.unlinkSync(ran);
            return;
          })
          .addOutputOptions(outputOptions)
          .toFormat("webp")
          .save(ran);
      })
      .on("error", function (err) {
        reject(inofr5);
        fs.unlinkSync(media);
        fs.unlinkSync(ran);
        fs.unlinkSync(media1);

        return;
      })
      .run();
  } else {
    const stickerbuffer = await createSticker(buffer, stickerOptions).catch(
      (err) => {
        async () => {
          console.log(err);
          let sentMsg = await sock.sendMessage(
            id,
            { text: "Something broke !" },
            { quoted: msg }
          );
        };
      }
    );
    let sentMsg = await sock.sendMessage(
      id,
      { sticker: await stickerbuffer },
      { quoted: msg }
    );
  }
}
