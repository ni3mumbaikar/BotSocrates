const axios = require('axios');

module.exports.reply = async function (sock, msg) {
  const id = msg.key.remoteJid;
  const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

  let url;
  if (messageContent) {
    // Assuming the command is like /short <URL> or /shortener <URL>
    const parts = messageContent.split(' ');
    if (parts.length > 1) {
      url = parts[1]; // Get the word after the command
    } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      // If no URL in current message, try quoted message
      url = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    }
  }

  if (!url) {
    await sock.sendMessage(id, { text: 'Please provide a URL to shorten or quote a message containing a URL.' }, { quoted: msg });
    return;
  }

  const apiUrl = `http://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;

  try {
    const response = await axios.get(apiUrl);
    const shortUrl = response.data;

    if (shortUrl.startsWith('http')) {
      await sock.sendMessage(id, { text: `Here's your shortened URL: ${shortUrl}` }, { quoted: msg });
    } else {
      await sock.sendMessage(id, { text: 'Could not shorten the URL. Please ensure it is a valid URL.' }, { quoted: msg });
    }
  } catch (error) {
    console.error('Error shortening URL:', error);
    await sock.sendMessage(id, { text: 'An error occurred while shortening the URL. Please try again later.' }, { quoted: msg });
  }
};
