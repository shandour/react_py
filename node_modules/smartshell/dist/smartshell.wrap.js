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
const plugins = require("./smartshell.plugins");
/**
 * import path
 */
let importPath = (stringArg) => {
    if (process.env.SMARTSHELL_PATH) {
        let commandResult = `PATH=${process.env.SMARTSHELL_PATH} && ${stringArg}`;
        // console.log(commandResult)
        return commandResult;
    }
    else {
        return stringArg;
    }
};
/**
 * executes a given command async
 * @param commandStringArg
 */
exports.exec = (commandStringArg, silentArg = false, strictArg = false) => {
    let done = plugins.smartq.defer();
    plugins.shelljs.exec(importPath(commandStringArg), { async: true, silent: silentArg }, (code, stdout, stderr) => {
        if (stderr
            && (stderr !== '')
            && (!silentArg || strictArg)
            && (process.env.DEBUG === 'true')) {
            console.log('StdErr found.');
            console.log(stderr);
        }
        if (strictArg) {
            done.reject(new Error(stderr));
            return;
        }
        done.resolve({
            exitCode: code,
            stdout: stdout
        });
    });
    return done.promise;
};
/**
 * executes a given command async and silent
 * @param commandStringArg
 */
exports.execSilent = (commandStringArg) => __awaiter(this, void 0, void 0, function* () {
    return yield exports.exec(commandStringArg, true);
});
/**
 * executes strict, meaning it rejects the promise if something happens
 */
exports.execStrict = (commandStringArg) => __awaiter(this, void 0, void 0, function* () {
    return yield exports.exec(commandStringArg, true, true);
});
/**
 * executes a command and allws you to stream output
 */
exports.execStreaming = (commandStringArg, silentArg = false) => {
    let childProcessEnded = plugins.smartq.defer();
    let execChildProcess = plugins.shelljs.exec(importPath(commandStringArg), { async: true, silent: silentArg }, (code, stdout, stderr) => {
        childProcessEnded.resolve({
            exitCode: code,
            stdout: stdout
        });
    });
    return {
        childProcess: execChildProcess,
        finalPromise: childProcessEnded.promise
    };
};
exports.execStreamingSilent = (commandStringArg) => {
    return exports.execStreaming(commandStringArg, true);
};
/**
 * executes a command and returns promise that will be fullfilled once an putput line matches RegexArg
 * @param commandStringArg
 * @param regexArg
 */
exports.execAndWaitForLine = (commandStringArg, regexArg, silentArg = false) => {
    let done = plugins.smartq.defer();
    let execStreamingResult = exports.execStreaming(commandStringArg, silentArg);
    execStreamingResult.childProcess.stdout.on('data', (stdOutChunk) => {
        if (regexArg.test(stdOutChunk)) {
            done.resolve();
        }
    });
    return done.promise;
};
exports.execAndWaitForLineSilent = (commandStringArg, regexArg) => {
    exports.execAndWaitForLine(commandStringArg, regexArg, true);
};
/**
 * get a path
 */
exports.which = (cmd) => {
    let done = plugins.smartq.defer();
    plugins.which(cmd, (err, path) => {
        if (err) {
            done.reject(err);
        }
        done.resolve(path);
    });
    return done.promise;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcnRzaGVsbC53cmFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvc21hcnRzaGVsbC53cmFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxnREFBK0M7QUFzQi9DOztHQUVHO0FBQ0gsSUFBSSxVQUFVLEdBQUcsQ0FBQyxTQUFTO0lBQ3pCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFJLGFBQWEsR0FBRyxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxPQUFPLFNBQVMsRUFBRSxDQUFBO1FBQ3pFLDZCQUE2QjtRQUM3QixNQUFNLENBQUMsYUFBYSxDQUFBO0lBQ3RCLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNOLE1BQU0sQ0FBQyxTQUFTLENBQUE7SUFDbEIsQ0FBQztBQUNILENBQUMsQ0FBQTtBQUVEOzs7R0FHRztBQUNRLFFBQUEsSUFBSSxHQUFHLENBQUMsZ0JBQXdCLEVBQUUsWUFBcUIsS0FBSyxFQUFFLFNBQVMsR0FBRyxLQUFLO0lBQ3hGLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFlLENBQUE7SUFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTTtRQUMxRyxFQUFFLENBQUMsQ0FDRCxNQUFNO2VBQ0gsQ0FBQyxNQUFNLEtBQUssRUFBRSxDQUFDO2VBQ2YsQ0FBQyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUM7ZUFDekIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLENBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxl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