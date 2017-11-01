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
const smartshellWrap = require("./smartshell.wrap");
class Smartshell {
    constructor(optionsArg) {
        this.sourceFileArray = [];
        this.executor = optionsArg.executor;
        for (let sourceFilePath of optionsArg.sourceFilePaths) {
            this.sourceFileArray.push(sourceFilePath);
        }
    }
    addSourceFiles(sourceFilePathsArray) {
        for (let sourceFilePath of sourceFilePathsArray) {
            this.sourceFileArray.push(sourceFilePath);
        }
    }
    cleanSourceFiles() {
        this.sourceFileArray = [];
    }
    /**
     * executes silently and returns IExecResult
     * @param commandArg
     */
    execSilent(commandArg) {
        return __awaiter(this, void 0, void 0, function* () {
            let execCommand = this.createExecString(commandArg);
            return yield smartshellWrap.execSilent(execCommand);
        });
    }
    /**
     * executes and returns IExecResult
     * @param commandArg
     */
    exec(commandArg) {
        return __awaiter(this, void 0, void 0, function* () {
            let execCommand = this.createExecString(commandArg);
            return yield smartshellWrap.exec(execCommand);
        });
    }
    /**
     * creates the final sourcing string
     * @param commandArg
     */
    createExecString(commandArg) {
        if (this.executor === 'bash') {
            let sourceString = '';
            for (let sourceFilePath of this.sourceFileArray) {
                sourceString = sourceString + `source ${sourceFilePath} && `;
            }
            return `bash -c '${sourceString} ${commandArg}'`;
        }
        else {
            return commandArg;
        }
    }
}
exports.Smartshell = Smartshell;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcnRzaGVsbC5jbGFzc2VzLnNtYXJ0c2hlbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9zbWFydHNoZWxsLmNsYXNzZXMuc21hcnRzaGVsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esb0RBQW1EO0FBVW5EO0lBR0UsWUFBYSxVQUF3QztRQURyRCxvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQUU1QixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUE7UUFDbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxjQUFjLElBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDM0MsQ0FBQztJQUNILENBQUM7SUFFRCxjQUFjLENBQUUsb0JBQThCO1FBQzVDLEdBQUcsQ0FBQyxDQUFDLElBQUksY0FBYyxJQUFJLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUMzQyxDQUFDO0lBQ0gsQ0FBQztJQUVELGdCQUFnQjtRQUNkLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFFRDs7O09BR0c7SUFDRyxVQUFVLENBQUUsVUFBa0I7O1lBQ2xDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNuRCxNQUFNLENBQUMsTUFBTSxjQUFjLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3JELENBQUM7S0FBQTtJQUVEOzs7T0FHRztJQUNHLElBQUksQ0FBRSxVQUFrQjs7WUFDNUIsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ25ELE1BQU0sQ0FBQyxNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDL0MsQ0FBQztLQUFBO0lBRUQ7OztPQUdHO0lBQ0ssZ0JBQWdCLENBQUUsVUFBVTtRQUNsQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFBO1lBQ3JCLEdBQUcsQ0FBQyxDQUFDLElBQUksY0FBYyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLEdBQUcsWUFBWSxHQUFHLFVBQVUsY0FBYyxNQUFNLENBQUE7WUFDOUQsQ0FBQztZQUNELE1BQU0sQ0FBQyxZQUFZLFlBQVksSUFBSSxVQUFVLEdBQUcsQ0FBQTtRQUNsRCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsVUFBVSxDQUFBO1FBQ25CLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFyREQsZ0NBcURDIn0=