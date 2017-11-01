"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const smartshell = require("smartshell");
var semver = require("semver");
let safeInstall = () => __awaiter(this, void 0, void 0, function* () {
    var nodeVersion = (yield smartshell.execSilent("node -v")).stdout;
    //check for existing node typings
    let treeLocal = (yield smartshell.execSilent("(npm list)")).stdout;
    let treeOuter = (yield smartshell.execSilent("(cd ../ && npm list)")).stdout;
    let typesNodeRegex = /\@types\/node/;
    if (typesNodeRegex.test(treeLocal) || typesNodeRegex.test(treeOuter)) {
        console.log("@types/node already installed");
    }
    else {
        console.log("@types/node not yet installed");
        var sanatizedNodeVersion = /\n?v(.*)\n?\s*$/.exec(nodeVersion)[1];
        console.log("Your node version is " + sanatizedNodeVersion);
        console.log("Trying to install node typings in matching version...");
        var nodeMajorVersion = semver.major(sanatizedNodeVersion);
        var nodeNextVersion = nodeMajorVersion + 1;
        let exitCode = (yield smartshell.exec(`cd .. && npm install @types/node@">=${nodeMajorVersion}.0.0 <${nodeNextVersion}.0.0"`)).exitCode;
        if (exitCode !== 0) {
            yield smartshell.exec('npm install @types/node');
        }
    }
});
safeInstall();
