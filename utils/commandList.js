/* --------------------------------- IMPORTS --------------------------------- */
const help = require("../commands/help");
const alive = require("../commands/alive");
const naughty = require('../commands/naughty')
const sticker = require('../commands/sticker')
const del = require('../commands/del')

let commandsList = {};

/* --------------------------------- BOOTSTRAPING ALL COMMANDS AND OPTIONS --------------------------------- */
module.exports.commandsGenerator = function () {
  commandsList["help"] = help;
  commandsList["alive"] = alive;
  commandsList["naughty"] = naughty;
  commandsList["sticker"] = sticker;
  commandsList["del"] = del;
  return commandsList;
};
