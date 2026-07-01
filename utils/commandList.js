/* --------------------------------- IMPORTS --------------------------------- */
const help = require("../commands/help");
const alive = require("../commands/alive");
const sticker = require("../commands/sticker");
const del = require("../commands/del");
const ytd = require("../commands/ytv");
const technews = require("../commands/technews");
const carbon = require("../commands/carbon");
const image = require("../commands/image")
const tts = require("../commands/tts");
const shortener = require("../commands/shortener");
const jail = require("../commands/jail");
const ping = require("../commands/ping");
// const text_overlay = require("../commands/text_overlay");

let commandsList = {};

/* --------------------------------- BOOTSTRAPING ALL COMMANDS AND OPTIONS --------------------------------- */
module.exports.commandsGenerator = function () {
  commandsList["help"] = help;
  commandsList["h"] = help;

  commandsList["alive"] = alive;
  commandsList["ping"] = ping;
  commandsList["p"] = ping;
  commandsList["sticker"] = sticker;
  commandsList["del"] = del;

  commandsList["ytv"] = ytd;

  commandsList["technews"] = technews;
  commandsList["technews subscribe"] = technews;

  commandsList["carbon"] = carbon;

  commandsList["image"] = image;
  commandsList["img"] = image

  commandsList["tts"] = tts;
  commandsList["speak"] = tts;

  commandsList["shortener"] = shortener;
  commandsList["short"] = shortener;

  commandsList["jail"] = jail;

  /*
  commandsList["textoverlay"] = text_overlay;
  commandsList["to"] = text_overlay;
  */

  return commandsList;
};
