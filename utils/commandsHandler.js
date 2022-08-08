/* --------------------------------- IMPORTS --------------------------------- */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const commandsList = require("./commandList");

let PREFIX = process.env.PREFIX;
var commands = commandsList.commandsGenerator();
console.log(commands);

/* --------------------------------- MESSAGE HANDLER METHOD --------------------------------- */

module.exports.handler = function handleMessage(sock, msg) {

  // TODO : check for whitelisted Personal only using DB

  // checks for in-reply messages and enforces group only policy
  if (msg.message) {

    if (
      msg.message.extendedTextMessage &&
      msg.message.extendedTextMessage.text &&
      msg.message.extendedTextMessage.text.startsWith(PREFIX)
    ) {
      switchMaster(sock, msg.message.extendedTextMessage.text);
    }

    // checks for simple conversations in group and personal
    else if (
      msg.message.conversation &&
      msg.message.conversation.startsWith(PREFIX)
    ) {
      switchMaster(sock, msg, msg.message.conversation);
    }

  }
};

/* --------------------------------- COMMAND ROUTER --------------------------------- */

async function switchMaster(sock, msg, command) {
  let id = msg.key.remoteJid;
  command = command.slice(1);
  if (command.includes(" ")) {
    if (command.split(" ").length == 2) {
      let commandWithoutOption = command.split(" ")[0];
      let option = command.split(" ")[1];
      if (commands[commandWithoutOption]) {
        await commands[commandWithoutOption].replyForCommandWithOption(sock, msg, option);
      }
      else {

      }
    } else {
      let sentMsg = await sock.sendMessage(id, { text: "Multi command options are not supported yet", }, { quoted: msg });
    }
  } else {
    if (commands[command]) {
      await commands[command].reply(sock, msg);
    } else {
      commnadNotFound(sock, msg)
    }
  }
}

/* --------------------------------- INVALID COMMAND --------------------------------- */

async function commnadNotFound(sock, msg) {
  let id = msg.key.remoteJid;
  let sentMsg = await sock.sendMessage(id, { text: "🤦‍♂️How many time I have to tell you this dear child ! \nPlease check /help commands", }, { quoted: msg });
}
