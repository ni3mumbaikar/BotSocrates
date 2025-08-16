const fs = require("fs");
const P = require("pino");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const { exec } = require("child_process");
const os = require('os');

const magickPath = os.platform() === 'linux' ? 'convert' : 'magick'; // Use 'convert' for Linux (Ubuntu-like) and 'magick' for others

const getRandomName = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

async function getImageDimensions(imagePath) {
  return new Promise((resolve, reject) => {
    exec(`"${magickPath}" identify -format "%w,%h" "${imagePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error("Error getting image dimensions:", error);
        return reject(error);
      }
      const [width, height] = stdout.trim().split(',').map(Number);
      resolve({ width, height });
    });
  });
}

module.exports.reply = async function (sock, msg) {
  const id = msg.key.remoteJid;
  const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  
  // Extract caption: remove command prefix and command name
  let rawCaption = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const prefix = process.env.PREFIX || ''; // Assuming PREFIX is available, otherwise default to empty
  const commandName = (rawCaption.startsWith(prefix + 'textoverlay')) ? prefix + 'textoverlay' : (rawCaption.startsWith(prefix + 'to')) ? prefix + 'to' : '';

  let caption = rawCaption.substring(commandName.length).trim();

  if (!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.stickerMessage)) {
    await sock.sendMessage(id, { text: 'Please quote an image or a sticker to add text overlay.' }, { quoted: msg });
    return;
  }

  if (!caption) {
    await sock.sendMessage(id, { text: 'Please provide the text to overlay in the command caption.' }, { quoted: msg });
    return;
  }

  let buffer;
  let inputPath;
  let outputPath;

  try {
    if (quotedMessage.imageMessage) {
      buffer = await downloadMediaMessage(
        { message: { imageMessage: quotedMessage.imageMessage } },
        "buffer",
        {},
        {
          logger: P({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        }
      );
      inputPath = getRandomName(".png"); // Assuming input image will be PNG for simplicity
      outputPath = getRandomName(".png");
    } else if (quotedMessage.stickerMessage) {
      // Convert sticker to image first
      buffer = await downloadMediaMessage(
        { message: { stickerMessage: quotedMessage.stickerMessage } },
        "buffer",
        {},
        {
          logger: P({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        }
      );
      const tempStickerPath = getRandomName(".webp");
      inputPath = getRandomName(".png");
      outputPath = getRandomName(".png");

      await writeFile(tempStickerPath, buffer);

      const stickerConvertCommand = `"${magickPath}" "${tempStickerPath}" "${inputPath}"`;
      await new Promise((resolve, reject) => {
        exec(stickerConvertCommand, (error) => {
          if (error) {
            console.error("Error converting sticker to image:", error);
            fs.unlinkSync(tempStickerPath);
            reject(new Error("Failed to convert sticker to image."));
          } else {
            fs.unlinkSync(tempStickerPath);
            resolve();
          }
        });
      });
    }

    await writeFile(inputPath, buffer);

    const { width: imageWidth, height: imageHeight } = await getImageDimensions(inputPath); // Reintroduce getting image dimensions
    const bottomPadding = Math.floor(imageHeight * 0.02); // 2% of image height

    const fontSize = 240; // Increased font size to 240px
    const textColor = 'white';
    const gravity = 'south'; // Bottom-aligned and horizontally centered

    // Escape special characters in caption for shell and ImageMagick annotate
    const escapedCaption = caption.replace(/['\"]/g, '\\$&');

    const tempTextPath = getRandomName(".png");

    // Create text image with gravity south and no explicit size to allow natural wrapping
    const textCommand = `"${magickPath}" -background none -fill ${textColor} -pointsize ${fontSize} -gravity ${gravity} label:\"${escapedCaption}\" "${tempTextPath}"`;

    await new Promise((resolve, reject) => {
      exec(textCommand, (error) => {
        if (error) {
          console.error("Error creating text image:", error);
          return reject(error);
        }
        resolve();
      });
    });

    // Calculate the Y offset for bottom padding
    const yOffset = bottomPadding; // With gravity south, this is the offset from the bottom edge

    const command = `"${magickPath}" composite -gravity ${gravity} -geometry +0+${yOffset} "${tempTextPath}" "${inputPath}" "${outputPath}"`;

    exec(command, async (error) => {
      if (error) {
        console.error("Error adding text overlay:", error);
        await sock.sendMessage(id, { text: "Error adding text overlay." }, { quoted: msg });
      } else {
        await sock.sendMessage(id, { image: fs.readFileSync(outputPath) }, { quoted: msg });
      }

      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(tempTextPath); // Clean up temp text image
      } catch (e) {
        console.error("Error cleaning up files:", e);
      }
    });
  } catch (err) {
    console.error("General error in text overlay command:", err);
    await sock.sendMessage(id, { text: "An unexpected error occurred while processing your request." }, { quoted: msg });
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};
