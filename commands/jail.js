const fs = require("fs");
const P = require("pino");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const { exec } = require("child_process");
const os = require('os');

const magickPath = os.platform() === 'linux' ? 'convert' : 'magick';

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
  
  // 1. Determine if there is an image/sticker to process
  let imageMessage = null;
  let stickerMessage = null;

  // Check direct image message (sent with caption /jail)
  if (msg.message?.imageMessage) {
    imageMessage = msg.message.imageMessage;
  }
  // Check quoted message
  else {
    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quotedMessage) {
      if (quotedMessage.imageMessage) {
        imageMessage = quotedMessage.imageMessage;
      } else if (quotedMessage.stickerMessage) {
        stickerMessage = quotedMessage.stickerMessage;
      }
    }
  }

  if (!imageMessage && !stickerMessage) {
    await sock.sendMessage(id, { text: 'Please send an image with `/jail` caption, or reply to an image/sticker with `/jail`.' }, { quoted: msg });
    return;
  }

  let buffer;
  let inputPath = getRandomName(".png");
  let outputPath = getRandomName(".png");
  let tempStickerPath = null;

  try {
    if (imageMessage) {
      buffer = await downloadMediaMessage(
        { message: { imageMessage: imageMessage } },
        "buffer",
        {},
        {
          logger: P({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        }
      );
    } else if (stickerMessage) {
      buffer = await downloadMediaMessage(
        { message: { stickerMessage: stickerMessage } },
        "buffer",
        {},
        {
          logger: P({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        }
      );
      tempStickerPath = getRandomName(".webp");
      await writeFile(tempStickerPath, buffer);

      // Convert WebP sticker to PNG
      const stickerConvertCommand = `"${magickPath}" "${tempStickerPath}" "${inputPath}"`;
      await new Promise((resolve, reject) => {
        exec(stickerConvertCommand, (error) => {
          if (error) {
            console.error("Error converting sticker to image:", error);
            reject(new Error("Failed to convert sticker to image."));
          } else {
            resolve();
          }
        });
      });
      // Clean up temp WebP sticker
      try { fs.unlinkSync(tempStickerPath); } catch (e) {}
    }

    if (imageMessage) {
      await writeFile(inputPath, buffer);
    }

    // Get image dimensions to compute dynamic jail bars
    const { width, height } = await getImageDimensions(inputPath);

    // Compute jail bar drawing arguments
    const barWidth = Math.max(4, Math.floor(width * 0.025)); // 2.5% of image width
    const barSpacing = Math.floor(width / 6); // 6 vertical bars
    let drawArguments = "";

    // Draw vertical bars
    for (let x = barSpacing; x < width; x += barSpacing) {
      // Dark bar shadow/body
      drawArguments += ` -draw "stroke \\"#2a2a2a\\" stroke-width ${barWidth} line ${x},0 ${x},${height}"`;
      // Light bar 3D reflection highlight (slightly shifted to the left)
      const highlightX = x - Math.max(1, Math.floor(barWidth / 4));
      drawArguments += ` -draw "stroke \\"#8e8e8e\\" stroke-width ${Math.max(1, Math.floor(barWidth / 5))} line ${highlightX},0 ${highlightX},${height}"`;
    }

    // Draw horizontal support bars (top and bottom)
    const horizBarY1 = Math.floor(height * 0.15);
    const horizBarY2 = Math.floor(height * 0.85);
    // Top bar
    drawArguments += ` -draw "stroke \\"#2a2a2a\\" stroke-width ${barWidth} line 0,${horizBarY1} ${width},${horizBarY1}"`;
    drawArguments += ` -draw "stroke \\"#8e8e8e\\" stroke-width ${Math.max(1, Math.floor(barWidth / 5))} line 0,${horizBarY1 - Math.max(1, Math.floor(barWidth / 4))} ${width},${horizBarY1 - Math.max(1, Math.floor(barWidth / 4))}"`;
    // Bottom bar
    drawArguments += ` -draw "stroke \\"#2a2a2a\\" stroke-width ${barWidth} line 0,${horizBarY2} ${width},${horizBarY2}"`;
    drawArguments += ` -draw "stroke \\"#8e8e8e\\" stroke-width ${Math.max(1, Math.floor(barWidth / 5))} line 0,${horizBarY2 - Math.max(1, Math.floor(barWidth / 4))} ${width},${horizBarY2 - Math.max(1, Math.floor(barWidth / 4))}"`;

    // Process the image using ImageMagick
    const jailCommand = `"${magickPath}" "${inputPath}"${drawArguments} "${outputPath}"`;

    exec(jailCommand, async (error) => {
      // Clean up input image
      try { fs.unlinkSync(inputPath); } catch (e) {}

      if (error) {
        console.error("Error drawing jail overlay:", error);
        await sock.sendMessage(id, { text: "Error processing the jail image." }, { quoted: msg });
        return;
      }

      // Send the output image back
      await sock.sendMessage(
        id,
        { image: fs.readFileSync(outputPath), caption: "🚨 Busted! Go straight to jail! Do not pass GO, do not collect $200." },
        { quoted: msg }
      );

      // Clean up output image
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });

  } catch (err) {
    console.error("Jail command error:", err);
    await sock.sendMessage(id, { text: "Something went wrong while executing the jail command." }, { quoted: msg });
    
    // Cleanup any lingering temp files
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
    if (tempStickerPath) {
      try { fs.unlinkSync(tempStickerPath); } catch (e) {}
    }
  }
};
