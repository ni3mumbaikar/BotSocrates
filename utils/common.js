const { log } = require("console");

module.exports.checkAdmin = async function checkAdmins(sock, chatId, userJid) {
  // Fetch group participants
  const participants = await sock.groupMetadata(chatId);
  console.log(participants);
  // Check if the user is an admin
  const isAdmin = participants?.participants.find(
    (participant) => participant.id === userJid && participant.admin
  );
  console.log(`chat id '${chatId}`);
  console.log(`${userJid} is admin: ${isAdmin ? true : false}`);

  return isAdmin ? true : false;
};

module.exports.isGroupChat = function (id) {
  return String(id).endsWith("@g.us");
};
