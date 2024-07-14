'use strict';

const rootContext = createTestContext();
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
      rootContext.nFail++;
      console.log('not ok ' + (++rootContext.nTest) + ' test exited without ending: ' + subtest.desc);
      console.log('  ---');
      console.log('    operator: fail');
      console.log('    at: ' + subtest.stack[0].slice(7));
      console.log('  ...');
    }
  });
  if (rootContext.nTest) {
    console.log();
    console.log('1..' + rootContext.nTest);
    console.log('# tests ' + rootContext.nTest);
    console.log('# pass  ' + rootContext.nPass);
    if (rootContext.nSkip) {
      console.log('# skip  ' + rootContext.nSkip);
    }
    if (rootContext.nFail > 0) {
      console.log('# fail  ' + rootContext.nFail);
      process.exitCode = 1;
    } else if (rootContext.nPass > 0) {
      console.log('\n# ok');
    }
  }
});

function test (desc, cb, opts) {
  const self = this;
  header();
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
      console.log('ok ' + (++rootContext.nTest) + ' test: ' + desc + ' # SKIP');
      rootContext.nSkip++;
      if (this !== rootContext) this.nSkip++;
    });
}

function pass (desc) {
  if (this.done) {
    rootContext.nFail++;
    this.nFail++;
    console.log('not ok ' + (++rootContext.nTest) + ' .end already called: ' + desc);
  } else {
    rootContext.nPass++;
    this.nPass++;
    console.log('ok ' + (++rootContext.nTest) + ' ' + desc);
  }
}

function fail (desc) {
  if (this.done) {
    rootContext.nFail++;
    this.nFail++;
    console.log('not ok ' + (++rootContext.nTest) + ' .end already called: ' + desc);
  } else {
    rootContext.nFail++;
    this.nFail++;
    console.log('not ok ' + (++rootContext.nTest) + ' ' + desc);
  }
}

function end () {
  if (this.done) {
    rootContext.nFail++;
    this.nFail++;
    console.log('not ok ' + (++rootContext.nTest) + ' .end already called');
  } else {
    this.done = true;
    if (this.nFail === 0) {
      rootContext.nPass++;
      console.log('ok ' + (++rootContext.nTest) + ' test: ' + this.desc);
    } else {
      rootContext.nFail++;
      console.log('not ok ' + (++rootContext.nTest) + ' test: ' + this.desc);
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
