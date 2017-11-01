import 'typings-global'
import * as util from 'util'

export interface IResolve<T> {
  (value?: T | Promise<T>): void
}

export interface IReject {
  (reason?: any): void
}

export class Deferred<T> {
  promise: Promise<T>
  resolve: IResolve<T>
  reject: IReject
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export let defer = <T>() => {
  return new Deferred<T>()
}

/**
 * Creates a new resolved promise for the provided value.
 */
export let resolvedPromise = <T>(value?: T): Promise<T> => {
  return Promise.resolve(value)
}

/**
 * Creates a new rejected promise for the provided reason.
 */
export let rejectedPromise = (err) => {
  return Promise.reject(err)
}

export let promisify = util.promisify

// polyfill
if (!promisify) {
  promisify = require('util.promisify')
}
export let map = async <T> (inputArg: T[],functionArg) => {
  let promisifedFunction = promisify(functionArg)
  let promiseArray: Promise<any>[] = []
  let resultArray = []
  for (let item of inputArg) {
    let promise: Promise<any> = promisifedFunction(item)
    promiseArray.push(promise)
    promise.then(x => {
      resultArray.push(x)
    })

  }
  await Promise.all(promiseArray)
  return resultArray
}
