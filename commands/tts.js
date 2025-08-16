const fs = require("fs");
const { exec } = require("child_process");
const P = require("pino");

const ffmpegPath = process.env.FFMPEG_PATH;

const getRandomName = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.reply = async function (sock, msg) {
  let id = msg.key.remoteJid;
  let text = msg.message.conversation || msg.message.extendedTextMessage.text;

  if (!text || text.startsWith('/tts')) {
    await sock.sendMessage(id, { text: "Please provide text after the command, e.g., `/tts Hello world`" }, { quoted: msg });
    return;
  }

  // Remove the /tts command part from the text
  const ttsText = text.replace(/^\/tts\s*/i, '').trim();

  if (ttsText.length === 0) {
    await sock.sendMessage(id, { text: "Please provide text after the command, e.g., `/tts Hello world`" }, { quoted: msg });
    return;
  }

  await generateSpeechAndSend(sock, msg, ttsText);
};

async function generateSpeechAndSend(sock, msg, ttsText) {
  let id = msg.key.remoteJid;
  const tempMp3Path = getRandomName(".mp3");
  const outputOggPath = getRandomName(".ogg");

  // Step 1: Generate MP3 using Python gtts script
  const gttsCommand = `python utils/gtts_script.py "${ttsText}" "${tempMp3Path}" "en"`; // 'en' for English language

  exec(gttsCommand, async (errorGtts, stdoutGtts, stderrGtts) => {
    if (errorGtts) {
      console.error("Error generating MP3 with gTTS script:", errorGtts);
      console.error("gTTS stdout:", stdoutGtts);
      console.error("gTTS stderr:", stderrGtts);
      await sock.sendMessage(id, { text: "Error generating speech. Please try again later." }, { quoted: msg });
      try { fs.unlinkSync(tempMp3Path); } catch (e) {} // Clean up
      return;
    }

    // Step 2: Convert MP3 to OGG using ffmpeg
    const ffmpegCommand = `\"${ffmpegPath}\" -i \"${tempMp3Path}\" -c:a libopus -ar 48000 -b:a 64k \"${outputOggPath}\"`;

    exec(ffmpegCommand, async (errorFfmpeg, stdoutFfmpeg, stderrFfmpeg) => {
      // Clean up temporary MP3 file
      try { fs.unlinkSync(tempMp3Path); } catch (e) {}

      if (errorFfmpeg) {
        console.error("Error converting MP3 to OGG with ffmpeg:", errorFfmpeg);
        console.error("ffmpeg stdout:", stdoutFfmpeg);
        console.error("ffmpeg stderr:", stderrFfmpeg);
        await sock.sendMessage(id, { text: "Error processing audio. Please try again later." }, { quoted: msg });
        try { fs.unlinkSync(outputOggPath); } catch (e) {} // Clean up
      } else {
        await sock.sendMessage(
          id,
          { audio: fs.readFileSync(outputOggPath), mimetype: 'audio/ogg; codecs=opus', ptt: true },
          { quoted: msg }
        );
        // Clean up temporary OGG file after sending
        setTimeout(() => {
          try { fs.unlinkSync(outputOggPath); } catch (e) {}
        }, 5000); // Delay deletion by 5 seconds
      }
    });
  });
}

module.exports.replyForCommandWithMultiOptions = async function (sock, msg, multicommand) {
  await generateSpeechAndSend(sock, msg, multicommand);
};
