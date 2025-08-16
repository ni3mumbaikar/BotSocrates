/* --------------------------------- IMPORTS --------------------------------- */
const help = require("../commands/help");
const alive = require("../commands/alive");
const sticker = require("../commands/sticker");
const del = require("../commands/del");
const insta = require("../commands/insta");
const instadp = require("../commands/instadp");
const ytd = require("../commands/ytv");
const technews = require("../commands/technews");
const carbon = require("../commands/carbon");
const image = require("../commands/image")
const tts = require("../commands/tts");

let commandsList = {};

/* --------------------------------- BOOTSTRAPING ALL COMMANDS AND OPTIONS --------------------------------- */
module.exports.commandsGenerator = function () {
  commandsList["help"] = help;
  commandsList["h"] = help;

  commandsList["alive"] = alive;
  commandsList["sticker"] = sticker;
  commandsList["del"] = del;

  commandsList["igd"] = insta;
  commandsList["insta"] = insta;

  commandsList["idp"] = instadp;
  commandsList["instadp"] = instadp;

  commandsList["ytv"] = ytd;

  commandsList["technews"] = technews;
  commandsList["technews subscribe"] = technews;

  commandsList["carbon"] = carbon;

  commandsList["image"] = image;
  commandsList["img"] = image

  commandsList["tts"] = tts;
  commandsList["speak"] = tts;

  return commandsList;
};
