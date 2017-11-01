# smartq
dropin replacement for q

## Availabililty
[![npm](https://pushrocks.gitlab.io/assets/repo-button-npm.svg)](https://www.npmjs.com/package/smartq)
[![git](https://pushrocks.gitlab.io/assets/repo-button-git.svg)](https://GitLab.com/pushrocks/smartq)
[![git](https://pushrocks.gitlab.io/assets/repo-button-mirror.svg)](https://github.com/pushrocks/smartq)
[![docs](https://pushrocks.gitlab.io/assets/repo-button-docs.svg)](https://pushrocks.gitlab.io/smartq/)

## Status for master
[![build status](https://GitLab.com/pushrocks/smartq/badges/master/build.svg)](https://GitLab.com/pushrocks/smartq/commits/master)
[![coverage report](https://GitLab.com/pushrocks/smartq/badges/master/coverage.svg)](https://GitLab.com/pushrocks/smartq/commits/master)
[![npm downloads per month](https://img.shields.io/npm/dm/smartq.svg)](https://www.npmjs.com/package/smartq)
[![Dependency Status](https://david-dm.org/pushrocks/smartq.svg)](https://david-dm.org/pushrocks/smartq)
[![bitHound Dependencies](https://www.bithound.io/github/pushrocks/smartq/badges/dependencies.svg)](https://www.bithound.io/github/pushrocks/smartq/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/pushrocks/smartq/badges/code.svg)](https://www.bithound.io/github/pushrocks/smartq)
[![TypeScript](https://img.shields.io/badge/TypeScript-2.x-blue.svg)](https://nodejs.org/dist/latest-v6.x/docs/api/)
[![node](https://img.shields.io/badge/node->=%208.x.x-blue.svg)](https://nodejs.org/dist/latest-v6.x/docs/api/)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Usage
Use TypeScript for best in class instellisense.

> Note: smartq uses native ES6 promises
> smartq does not repeat any native functions, so for things like .all() simply use Promise.all()

```javascript
import * as q from 'smartq'

// Deferred
// -----------------------------------------------
let myAsyncFunction = (): Promise<string> => {
    let done = q.defer<string>() // returns your typical Deferred object
    setTimeout(() => {
        done.resolve('hi') // will throw type error for other types than string as argument ;)
    },6000)
    return done.promise
}

let myAsyncFunction2 = async () => {
    let aString = await myAsyncFunction()
    console.log(aString) // will log 'hi' to console
}

myAsyncFunction2();


// Resolved and Rejected promises
// ------------------------------------------------
q.resolvedPromise(`I'll get logged to console soon`)
    .then(x => {
        console.log(x)
    })

q.rejectedPromise(`what a lovely error message`)
    .then(() => {
        console.log('This never makes it to console')
    }/*, alternatively put a reject function here */)
    .catch(err => {
        console.log(err)
    })

// Promisify (typed)
// ------------------------------------------------

let myCallbackedFunction = (someString: string, someNumber: number, cb) => {
    cb(null, someString)
}

let myPromisedFunction = q.promisify(myCallbackFunction)
myPromisedFunction('helloThere', 2).then(x => {
    console.log(x) // will log 'helloThere' to console
})

```

For further information read the linked docs at the top of this README.

> MIT licensed | **&copy;** [Lossless GmbH](https://lossless.gmbh)

[![repo-footer](https://pushrocks.gitlab.io/assets/repo-footer.svg)](https://push.rocks)
