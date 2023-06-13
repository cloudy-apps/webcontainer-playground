#!/usr/bin/env node

const commandPath = ".cmd";
const args = process.argv.slice(2);

switch (args[0]) {
  case "open":
    require("fs").writeFileSync(commandPath, args[1]);
    break;
}
