import { expect, tap } from 'tapbundle'
import * as q from '../dist/index'

let myCallback = (someValue1: string, cb?) => {
  cb(null, someValue1)
}

tap.test('should return a Deferred for .defer()', async () => {
  let myDeferred = q.defer()
  let expectPromise = expect(myDeferred.promise).to.eventually.be.fulfilled
  myDeferred.resolve()
  return expectPromise
})

tap.test('should let types flow through the Promise', async () => {
  let myString = 'someString'
  let myDeferred = q.defer<string>()
  let expectPromise = expect(myDeferred.promise).to.eventually.equal('someString')
  myDeferred.resolve(myString)
  return expectPromise
})

tap.test('should promisify a callback', async () => {
  let myPromisified = q.promisify(myCallback)
  let expectPromise = expect(myPromisified('hi')).to.eventually.equal('hi')
  return await expectPromise
})

tap.test('should map callbacks', async () => {
  let inputArray = ['hi', 'awesome']
  let myPromisified = q.promisify(myCallback)
  let expectPromise = expect(q.map(inputArray, myPromisified)).to.eventually.deep.equal(inputArray)
  return expectPromise
})

tap.start()
