const axios = require('axios');

/**
 * Normalizes email address by trimming and converting to lowercase.
 */
function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : '';
}

/**
 * Checks breaches for a given email address and replies to the user.
 */
async function checkEmailBreaches(sock, msg, emailInput) {
  const id = msg.key.remoteJid;
  const email = normalizeEmail(emailInput);

  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await sock.sendMessage(id, { text: `❌ *Error:* "${emailInput}" is not a valid email address. Please check and try again.` }, { quoted: msg });
    return;
  }

  try {
    const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const breachesDetails = response.data?.ExposedBreaches?.breaches_details;
    const siteSummary = response.data?.BreachesSummary?.site;

    if (!breachesDetails || breachesDetails.length === 0 || !siteSummary) {
      const safeText = `🔍 *Have I Been Pwned?*\n` +
                       `📧 *Email:* \`${email}\`\n\n` +
                       `✅ *STATUS: SAFE*\n` +
                       `Good news! This email was not found in any known data breaches.\n\n` +
                       `💡 *Tip:* Keep your credentials secure by using a password manager and enabling 2-Factor Authentication (2FA).`;
      await sock.sendMessage(id, { text: safeText }, { quoted: msg });
      return;
    }

    const totalBreaches = breachesDetails.length;
    const riskLabel = response.data?.BreachMetrics?.risk?.[0]?.risk_label || "Unknown";
    const riskScore = response.data?.BreachMetrics?.risk?.[0]?.risk_score || 0;

    let responseText = `🔍 *Have I Been Pwned?*\n` +
                       `📧 *Email:* \`${email}\`\n\n` +
                       `⚠️ *STATUS: BREACHED!*\n` +
                       `This email has appeared in *${totalBreaches}* known data breaches.\n\n` +
                       `📊 *Risk Assessment:*\n` +
                       `• *Risk Level:* ${riskLabel} (Score: ${riskScore}/100)\n\n` +
                       `🔥 *Recent Breaches:*`;

    // Limit to top 5 breaches to avoid extremely long messages
    const limit = Math.min(breachesDetails.length, 5);
    for (let i = 0; i < limit; i++) {
      const b = breachesDetails[i];
      const exposedData = b.xposed_data ? b.xposed_data.replace(/;/g, ', ') : 'Unknown';
      responseText += `\n\n${i + 1}. *${b.breach}* (${b.xposed_date || 'Unknown'})\n` +
                      `   • *Exposed:* ${exposedData}\n` +
                      `   • *Verified:* ${b.verified || 'Unknown'}`;
    }

    if (totalBreaches > 5) {
      responseText += `\n\n*(Showing top 5 of ${totalBreaches} breaches)*`;
    }

    responseText += `\n\n💡 *Tip:* Change your passwords immediately and enable 2-Factor Authentication (2FA) on your accounts.`;

    await sock.sendMessage(id, { text: responseText }, { quoted: msg });

  } catch (error) {
    console.error("Error in checkEmailBreaches:", error);
    // If the API returns 404 (often representing not found), display SAFE status
    if (error.response && error.response.status === 404) {
      const safeText = `🔍 *Have I Been Pwned?*\n` +
                       `📧 *Email:* \`${email}\`\n\n` +
                       `✅ *STATUS: SAFE*\n` +
                       `Good news! This email was not found in any known data breaches.\n\n` +
                       `💡 *Tip:* Keep your credentials secure by using a password manager and enabling 2-Factor Authentication (2FA).`;
      await sock.sendMessage(id, { text: safeText }, { quoted: msg });
    } else {
      await sock.sendMessage(id, { text: `❌ *Error:* An error occurred while checking breach status. Please try again later.` }, { quoted: msg });
    }
  }
}

module.exports.reply = async function (sock, msg) {
  const id = msg.key.remoteJid;
  const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

  let email;
  if (messageContent) {
    const parts = messageContent.split(/\s+/);
    if (parts.length > 1) {
      email = parts[1]; // Get the word after the command
    } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      email = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    }
  }

  if (!email) {
    await sock.sendMessage(id, { text: 'Please provide an email address, e.g., `/haveibeenpwned test@example.com` or reply to a message containing an email.' }, { quoted: msg });
    return;
  }

  await checkEmailBreaches(sock, msg, email);
};

module.exports.replyForCommandWithOption = async function (sock, msg, option) {
  await checkEmailBreaches(sock, msg, option);
};
