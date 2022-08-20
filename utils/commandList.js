/* --------------------------------- IMPORTS --------------------------------- */
const help = require("../commands/help");
const alive = require("../commands/alive");
const naughty = require('../commands/naughty')
const sticker = require('../commands/sticker')
const del = require('../commands/del')
const insta = require('../commands/insta')
const instadp = require('../commands/instadp')

let commandsList = {};

/* --------------------------------- BOOTSTRAPING ALL COMMANDS AND OPTIONS --------------------------------- */
module.exports.commandsGenerator = function () {
  commandsList["help"] = help;
  commandsList["h"] = help;

  commandsList["alive"] = alive;
  commandsList["naughty"] = naughty;
  commandsList["sticker"] = sticker;
  commandsList["del"] = del;

  commandsList["igd"] = insta;
  commandsList["insta"] = insta;

  commandsList["idp"] = instadp;
  commandsList["instadp"] = instadp;

  return commandsList;
};
