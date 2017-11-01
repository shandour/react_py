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
require("typings-global");
const util = require("util");
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Deferred = Deferred;
exports.defer = () => {
    return new Deferred();
};
/**
 * Creates a new resolved promise for the provided value.
 */
exports.resolvedPromise = (value) => {
    return Promise.resolve(value);
};
/**
 * Creates a new rejected promise for the provided reason.
 */
exports.rejectedPromise = (err) => {
    return Promise.reject(err);
};
exports.promisify = util.promisify;
// polyfill
if (!exports.promisify) {
    exports.promisify = require('util.promisify');
}
exports.map = (inputArg, functionArg) => __awaiter(this, void 0, void 0, function* () {
    let promisifedFunction = exports.promisify(functionArg);
    let promiseArray = [];
    let resultArray = [];
    for (let item of inputArg) {
        let promise = promisifedFunction(item);
        promiseArray.push(promise);
        promise.then(x => {
            resultArray.push(x);
        });
    }
    yield Promise.all(promiseArray);
    return resultArray;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMEJBQXVCO0FBQ3ZCLDZCQUE0QjtBQVU1QjtJQUlFO1FBQ0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBSSxDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3RCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztDQUNGO0FBVkQsNEJBVUM7QUFFVSxRQUFBLEtBQUssR0FBRztJQUNqQixNQUFNLENBQUMsSUFBSSxRQUFRLEVBQUssQ0FBQTtBQUMxQixDQUFDLENBQUE7QUFFRDs7R0FFRztBQUNRLFFBQUEsZUFBZSxHQUFHLENBQUksS0FBUztJQUN4QyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUMvQixDQUFDLENBQUE7QUFFRDs7R0FFRztBQUNRLFFBQUEsZUFBZSxHQUFHLENBQUMsR0FBRztJQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUM1QixDQUFDLENBQUE7QUFFVSxRQUFBLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO0FBRXJDLFdBQVc7QUFDWCxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ2YsaUJBQVMsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUN2QyxDQUFDO0FBQ1UsUUFBQSxHQUFHLEdBQUcsQ0FBVyxRQUFhLEVBQUMsV0FBVztJQUNuRCxJQUFJLGtCQUFrQixHQUFHLGlCQUFTLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDL0MsSUFBSSxZQUFZLEdBQW1CLEVBQUUsQ0FBQTtJQUNyQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUE7SUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxQixJQUFJLE9BQU8sR0FBaUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEQsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDWixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3JCLENBQUMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUNELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUMvQixNQUFNLENBQUMsV0FBVyxDQUFBO0FBQ3BCLENBQUMsQ0FBQSxDQUFBIn0=