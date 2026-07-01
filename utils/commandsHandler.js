/* --------------------------------- IMPORTS --------------------------------- */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const commandsList = require("./commandList");
const tts = require("../commands/tts");

let PREFIX = process.env.PREFIX;
var commands = commandsList.commandsGenerator();
commands.tts = tts; // Register the tts command
commands.speak = tts; // Register the speak alias
// const badWordsDetector = require('../utils/profanityManager').badWordsDetector;

console.log(
  "--------------------------------- BOT SOCRATES INITIALIZED ---------------------------------"
);

/* --------------------------------- MESSAGE HANDLER METHOD --------------------------------- */

module.exports.handler = function handleMessage(sock, msg) {
  // TODO : check for whitelisted Personal only using DB

  // checks for in-reply messages and enforces group only policy
  if (msg.message) {
    // console.log(msg);
    if (
      msg.message.extendedTextMessage &&
      msg.message.extendedTextMessage.text
    ) {
      // badWordsDetector(sock, msg, msg.message.extendedTextMessage.text);
      if (msg.message.extendedTextMessage.text.startsWith(PREFIX))
        switchMaster(sock, msg, msg.message.extendedTextMessage.text);
    }

    // checks for simple conversations in group and personal
    else if (msg.message.conversation) {
      // badWordsDetector(sock, msg, msg.message.conversation);
      if (msg.message.conversation.startsWith(PREFIX))
        switchMaster(sock, msg, msg.message.conversation);
    }
  }
};

/* --------------------------------- COMMAND ROUTER --------------------------------- */

async function switchMaster(sock, msg, command) {
  command = command.slice(1).trim(); // remove prefix and trim
  if (!command) return;

  let firstSpace = command.indexOf(" ");
  let mainCommand, args;

  if (firstSpace !== -1) {
    mainCommand = command.substring(0, firstSpace).trim();
    args = command.substring(firstSpace + 1).trim();
  } else {
    mainCommand = command;
    args = "";
  }

  if (commands[mainCommand]) {
    if (args) {
      if (commands[mainCommand].replyForCommandWithMultiOptions) {
        await commands[mainCommand].replyForCommandWithMultiOptions(
          sock,
          msg,
          args
        );
      } else if (commands[mainCommand].replyForCommandWithOption) {
        await commands[mainCommand].replyForCommandWithOption(
          sock,
          msg,
          args
        );
      } else if (commands[mainCommand].reply) {
        await commands[mainCommand].reply(sock, msg);
      } else {
        await commnadNotFound(sock, msg);
      }
    } else {
      if (commands[mainCommand].reply) {
        await commands[mainCommand].reply(sock, msg);
      } else {
        await commnadNotFound(sock, msg);
      }
    }
  } else {
    await commnadNotFound(sock, msg);
  }
}

/* --------------------------------- INVALID COMMAND --------------------------------- */

async function commnadNotFound(sock, msg) {
  let id = msg.key.remoteJid;
  let sentMsg = await sock.sendMessage(
    id,
    {
      text: "🤦‍♂️ Dear child, how many times do I have to tell you this ? \n\nPlease check /help commands",
    },
    { quoted: msg }
  );
}
