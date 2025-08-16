const fs = require("fs");
const P = require("pino");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const { exec } = require("child_process");

const magickPath = "magick"; // Ensure ImageMagick is installed
const ffmpegPath = "ffmpeg"; // Ensure ffmpeg is installed

const getRandomName = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.reply = async function (sock, msg) {
  await imageSender(sock, msg);
};

async function imageSender(sock, msg) {
  let id = msg.key.remoteJid;

  if (
    msg.message.extendedTextMessage &&
    msg.message.extendedTextMessage.contextInfo.quotedMessage &&
    msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage
  ) {
    const stickerMessage =
      msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
    const isAnimated = stickerMessage.isAnimated;

    const buffer = await downloadMediaMessage(
      { message: { stickerMessage: stickerMessage } },
      "buffer",
      {},
      {
        logger: P({ level: "silent" }),
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    if (isAnimated) {
      // Handle animated WebP → MP4
      const inputPath = getRandomName(".webp");
      const tempFrames = getRandomName("_frames_%03d.png"); // intermediate frames
      const outputPath = getRandomName(".mp4");
      await writeFile(inputPath, buffer);

      // Step 1: extract frames
      const extractCmd = `"${magickPath}" "${inputPath}" -coalesce "${tempFrames}"`;

      exec(extractCmd, (error) => {
        if (error) {
          console.error("Error extracting frames with ImageMagick:", error);
          sock.sendMessage(id, { text: "Error converting animated sticker." }, { quoted: msg });
          fs.unlinkSync(inputPath);
          return;
        }

        // Step 2: encode frames to MP4
        const ffmpegCmd = `${ffmpegPath} -y -framerate 15 -i "${tempFrames}" -vf "scale=320:-1:flags=lanczos" -pix_fmt yuv420p -c:v libx264 -preset fast -movflags +faststart "${outputPath}"`;

        exec(ffmpegCmd, async (error2) => {
          if (error2) {
            console.error("Error encoding MP4 with ffmpeg:", error2);
            await sock.sendMessage(id, { text: "Error encoding animated sticker." }, { quoted: msg });
          } else {
            await sock.sendMessage(
              id,
              { video: fs.readFileSync(outputPath), gifPlayback: true },
              { quoted: msg }
            );
          }

          // cleanup
          try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
          } catch {}

          // remove temp frames
          const frameRegex = new RegExp(tempFrames.replace("%03d", "\\d{3}"));
          fs.readdirSync(".").forEach((file) => {
            if (frameRegex.test(file)) {
              try {
                fs.unlinkSync(file);
              } catch {}
            }
          });
        });
      });
    } else {
      // Handle static WebP → PNG
      const inputPath = getRandomName(".webp");
      const outputPath = getRandomName(".png");
      await writeFile(inputPath, buffer);

      const command = `"${magickPath}" convert "${inputPath}" -resize 320x "${outputPath}"`;

      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error("Error converting static sticker to image:", error);
          await sock.sendMessage(
            id,
            { text: "Error converting static sticker to image." },
            { quoted: msg }
          );
          fs.unlinkSync(inputPath);
        } else {
          await sock.sendMessage(
            id,
            { image: fs.readFileSync(outputPath) },
            { quoted: msg }
          );
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        }
      });
    }
  } else {
    await sock.sendMessage(
      id,
      { text: "Please quote a sticker to convert." },
      { quoted: msg }
    );
  }
}
