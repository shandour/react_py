"use strict";
require("typings-test");
const smartchai_1 = require("smartchai");
const q = require("../dist/index");
let myCallback = (someValue1, cb) => {
    cb(null, someValue1);
};
describe('smartq', function () {
    it('should return a Deferred for .defer()', function () {
        let myDeferred = q.defer();
        let expectPromise = smartchai_1.expect(myDeferred.promise).to.eventually.be.fulfilled;
        myDeferred.resolve();
        return expectPromise;
    });
    it('should let types flow through the Promise', function () {
        let myString = 'someString';
        let myDeferred = q.defer();
        let expectPromise = smartchai_1.expect(myDeferred.promise).to.eventually.equal('someString');
        myDeferred.resolve(myString);
        return expectPromise;
    });
    it('should promisify a callback', function () {
        let myPromisified = q.promisify(myCallback);
        let expectPromise = smartchai_1.expect(myPromisified('hi')).to.eventually.equal('hi');
        return expectPromise;
    });
    it('should map callbacks', function () {
        let inputArray = ['hi', 'awesome'];
        let myPromisified = q.promisify(myCallback);
        let expectPromise = smartchai_1.expect(q.map(inputArray, myPromisified)).to.eventually.deep.equal(inputArray);
        return expectPromise;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHdCQUFxQjtBQUVyQix5Q0FBa0M7QUFDbEMsbUNBQWtDO0FBRWxDLElBQUksVUFBVSxHQUFHLENBQUMsVUFBa0IsRUFBRSxFQUFHO0lBQ3JDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFDeEIsQ0FBQyxDQUFBO0FBRUQsUUFBUSxDQUFDLFFBQVEsRUFBRTtJQUNmLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRTtRQUN4QyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDMUIsSUFBSSxhQUFhLEdBQUcsa0JBQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO1FBQ3pFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNwQixNQUFNLENBQUMsYUFBYSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDJDQUEyQyxFQUFFO1FBQzVDLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQTtRQUMzQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFVLENBQUE7UUFDbEMsSUFBSSxhQUFhLEdBQUcsa0JBQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDaEYsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM1QixNQUFNLENBQUMsYUFBYSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDZCQUE2QixFQUFFO1FBQzlCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDM0MsSUFBSSxhQUFhLEdBQUcsa0JBQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN6RSxNQUFNLENBQUMsYUFBYSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHNCQUFzQixFQUFFO1FBQ3ZCLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ2xDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDM0MsSUFBSSxhQUFhLEdBQUcsa0JBQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNqRyxNQUFNLENBQUMsYUFBYSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFDLENBQUEifQ==