'use strict';

const rootContext = createTestContext();
let nTest = 0;
let nPass = 0;
let nFail = 0;
let nSkip = 0;
let firstTest = true;

function header () {
  if (firstTest) {
    console.log('TAP version 13');
    firstTest = false;
  }
}

process.on('exit', code => {
  rootContext.subtests
  .forEach(subtest => {
    if (!subtest.done) {
      nFail++;
      console.log('not ok ' + (++nTest) + ' test exited without ending: ' + subtest.desc);
      console.log('  ---');
      console.log('    operator: fail');
      console.log('    at: ' + subtest.stack[0].slice(7));
      console.log('  ...');
    }
  });
  if (nTest) {
    console.log();
    console.log('1..' + nTest);
    console.log('# tests ' + nTest);
    console.log('# pass  ' + nPass);
    if (nSkip) {
      console.log('# skip  ' + nSkip);
    }
    if (nFail > 0) {
      console.log('# fail  ' + nFail);
      process.exitCode = 1;
    } else if (nPass > 0) {
      console.log('\n# ok');
    }
  }
});

function test (desc, cb, opts) {
  const self = this;
  header();
  self.nTest++;
  const subContext = createTestContext(self, desc);
  subContext.stack = new Error('test').stack.split('\n').slice(2);
  self.subtests.push(subContext);
  self.promise = (self.promise || Promise.resolve())
  .then(() => {
    console.log('# ' + desc);
    return new Promise((resolve, reject) => {
      subContext.resolve = resolve;
      subContext.reject = reject;
      return cb(subContext);
    });
  });
}

function skip (desc, cb, opts) {
  const self = this;
  header();
  self.promise =
    (self.promise || Promise.resolve())
    .then(() => {
      console.log('# ' + desc);
      console.log('ok ' + (++nTest) + ' # skip ' + desc);
      nSkip++;
      this.nSkip++;
    });
}

function pass (desc) {
  if (this.done) {
    nFail++;
    this.nFail++;
    console.log('not ok ' + ++nTest + ' .end already called: ' + desc);
  } else {
    nPass++;
    this.nPass++;
    console.log('ok ' + ++nTest + ' ' + desc);
  }
}

function fail (desc) {
  if (this.done) {
    nFail++;
    this.nFail++;
    console.log('not ok ' + (++nTest) + ' .end already called: ' + desc);
  } else {
    nFail++;
    this.nFail++;
    console.log('not ok ' + (++nTest) + ' ' + desc);
  }
}

function end () {
  if (this.done) {
    nFail++;
    this.nFail++;
    console.log('not ok ' + ++nTest + ' .end already called');
  } else {
    this.done = true;
    if (this.nFail === 0) {
      nPass++;
      console.log('ok ' + (++nTest) + ' ' + this.desc);
    } else {
      nFail++;
      console.log('not ok ' + (++nTest) + ' ' + this.desc);
    }
    this.resolve();
  }
}

function createTestContext (parent, desc) {
  return {
    parent: parent,
    desc: (desc || 'root'),
    test: test,
    skip: skip,
    pass: pass,
    fail: fail,
    end: end,
    done: false,
    subtests: [],
    nTest: 0,
    nPass: 0,
    nFail: 0,
    nSkip: 0,
  };
}

module.exports = rootContext;
