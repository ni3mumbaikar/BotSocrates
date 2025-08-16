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
  let id = msg.key.remoteJid;
  command = command.slice(1); //removed the prefix
  if (command.includes(" ")) {
    if (command.split(" ").length == 2) {
      let commandWithoutOption = command.split(" ")[0];
      let option = command.split(" ")[1];
      if (commands[commandWithoutOption]) {
        // Special handling for commands that don't use the 'option' parameter as a separate command option
        if (["tts", "speak", "shortener", "short"/*, "textoverlay", "to"*/].includes(commandWithoutOption)) {
          await commands[commandWithoutOption].reply(sock, msg);
        } else if (commands[commandWithoutOption].replyForCommandWithMultiOptions) {
          await commands[commandWithoutOption].replyForCommandWithMultiOptions(
            sock,
            msg,
            option
          );
        } else {
          await commands[commandWithoutOption].replyForCommandWithOption(
            sock,
            msg,
            option
          );
        }
      } else {
        commnadNotFound(sock, msg);
      }
    } else {
      let maincommand = command.split(" ")[0];
      let multicommand = command.split(" ").slice(1).join(" "); // removing command in and passing remaning string as it is for multi command
      if (commands[maincommand]) {
        if (commands[maincommand].replyForCommandWithMultiOptions) {
          commands[maincommand].replyForCommandWithMultiOptions(
            sock,
            msg,
            multicommand
          );
          // let sentMsg = await sock.sendMessage(id, { text: "Multi command options are supported work in progress", }, { quoted: msg });
        } else {
          let sentMsg = await sock.sendMessage(
            id,
            { text: "Multi command options are not supported yet" },
            { quoted: msg }
          );
        }
      }
    }
  } else {
    if (commands[command]) {
      await commands[command].reply(sock, msg);
    } else {
      commnadNotFound(sock, msg);
    }
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
