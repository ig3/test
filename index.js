'use strict';

const rootContext = createTestContext();
const assert = require('node:assert/strict');

// It aint over 'till it's over
process.on('exit', code => {
  if (rootContext.results.length > 0) {
    console.log('TAP version 13');
    rootContext.results
    .forEach(result => {
      reportResult(rootContext, rootContext, result);
    });
    if (
      rootContext.nPlan &&
      rootContext.nPlan !== rootContext.nTest
    ) {
      rootContext.nFail++;
      process.exitCode = 1;
      const actual = rootContext.nTest;
      console.log(
        'not ok ' +
        (++rootContext.nTest) +
        ' plan ' + rootContext.nPlan +
        ' != actual ' + actual
      );
    }
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
  }
});

function reportResult (rootContext, resultContext, result) {
  if (result.type === 'test') {
    console.log('# test: ' + result.desc);
    result.context.results
    .forEach(subResult => {
      if (result.done) {
        rootContext.nFail++;
        result.context.nFail++;
        console.log(
          'not ok ' +
          (++rootContext.nTest) +
          ' ' + subResult.name + ' called after end'
        );
        console.log('  ---');
        console.log('  operation: ' + subResult.name);
        if (subResult.desc) {
          console.log('  desc: ' + subResult.desc);
        }
        console.log('  at: ' + subResult.stack[0].slice(7));
        console.log('  ...');
      } else {
        if (subResult.type === 'end') {
          result.done = true;
        }
        reportResult(rootContext, result.context, subResult);
      }
    });

    if (
      result.context.nPlan &&
      result.context.nTest !== result.context.nPlan
    ) {
      rootContext.nFail++;
      result.context.nFail++;
      console.log(
        'not ok ' +
        (++rootContext.nTest) +
        ' plan ' + result.context.nPlan +
        ' != actual ' + result.context.nTest
      );
    }

    if (!result.done) {
      rootContext.nFail++;
      result.context.nFail++;
      console.log('not ok ' + (++rootContext.nTest) +
        ' test exited without ending: ' + result.desc);
      console.log('  ---');
      console.log('    operator: fail');
      console.log('    at: ' + result.context.stack[0].slice(7));
      console.log('  ...');
    }
    if (result.context.nFail === 0) {
      rootContext.nPass++;
      console.log('ok ' + (++rootContext.nTest) + ' test: ' + result.desc);
      if (resultContext !== rootContext) {
        resultContext.nTest++;
        resultContext.nPass++;
      }
    } else {
      rootContext.nFail++;
      console.log('not ok ' + (++rootContext.nTest) + ' test: ' + result.desc);
      if (resultContext !== rootContext) {
        resultContext.nTest++;
        resultContext.nFail++;
      }
    }
  } else if (result.type === 'skip') {
    console.log('# test: ' + result.desc);
    rootContext.nSkip++;
    console.log(
      'ok ' +
      (++rootContext.nTest) +
      ' test: ' + result.desc + ' # SKIP'
    );
    if (resultContext !== rootContext) {
      resultContext.nTest++;
      resultContext.nSkip++;
    }
  } else if (result.type === 'assert') {
    if (result.pass) {
      rootContext.nPass++;
      console.log(
        'ok ' +
        (++rootContext.nTest) + ' ' +
        (result.desc || result.name)
      );
      if (resultContext !== rootContext) {
        resultContext.nTest++;
        resultContext.nPass++;
      }
    } else {
      rootContext.nFail++;
      console.log(
        'not ok ' +
        (++rootContext.nTest) + ' ' +
        (result.desc || result.name)
      );
      console.log('  ---');
      console.log('  operator: ' + result.name);
      if (Object.hasOwn(result, 'expected')) {
        console.log('  expected:', result.expected);
      }
      if (Object.hasOwn(result, 'actual')) {
        console.log('  actual:  ', result.actual);
      }
      if (typeof result.stack !== 'undefined') {
        console.log('  at: ' + result.stack[0].slice(7));
      }
      console.log('  ...');
      if (resultContext !== rootContext) {
        resultContext.nTest++;
        resultContext.nFail++;
      }
    }
  }
}

function test (desc, cb, opts) {
  const self = this;
  const subContext = createTestContext(self, desc);
  subContext.stack = new Error('test').stack.split('\n').slice(2);
  self.results.push({
    type: 'test',
    desc: desc,
    context: subContext,
  });
  return Promise.resolve(cb(subContext));
}

function skip (desc, cb, opts) {
  const self = this;
  const subContext = createTestContext(self, desc);
  subContext.skip = true;
  self.results.push({
    type: 'skip',
    desc: desc,
    context: subContext,
  });
}

function plan (n) {
  this.nPlan = n;
}

function pass (desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  this.results.push({
    type: 'assert',
    name: 'pass',
    pass: true,
    desc: desc,
    stack: stack,
  });
}

function fail (desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  this.results.push({
    type: 'assert',
    name: 'fail',
    pass: false,
    desc: desc,
    stack: stack,
  });
}

function ok (actual, desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  this.results.push({
    type: 'assert',
    name: 'ok',
    pass: !!actual,
    actual: actual,
    desc: desc,
    stack: stack,
  });
}

function throws (fn, expected, desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  const result = {
    type: 'assert',
    name: 'throws',
    pass: true,
    desc: desc,
    stack: stack,
  };
  try {
    assert.throws(fn, expected, desc);
  } catch (err) {
    if (expected) result.expected = expected;
    if (err.actual) {
      result.actual = err.actual.message +
        err.actual.stack.split('\n')[1].slice(3);
    } else {
      result.actual = 'Missing expected exception';
    }
    result.pass = false;
  }
  this.results.push(result);
}

function end () {
  const stack = new Error('test').stack.split('\n').slice(2);
  this.results.push({
    type: 'end',
    name: 'end',
    stack: stack,
  });
  this.afterHooks
  .forEach(hook => {
    hook();
  });
}

function equal (actual, expected, desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  this.results.push({
    type: 'assert',
    name: 'equal',
    pass: Object.is(actual, expected),
    actual: actual,
    expected: expected,
    desc: desc,
    stack: stack,
  });
}

function deepEqual (actual, expected, desc) {
  const stack = new Error('test').stack.split('\n').slice(2);
  const result = {
    type: 'assert',
    name: 'deepEqual',
    pass: true,
    actual: actual,
    expected: expected,
    desc: desc,
    stack: stack,
  };
  try {
    assert.deepEqual(actual, expected, desc);
  } catch (err) {
    result.pass = false;
    result.actual = err.actual;
    result.expected = err.expected;
  }
  this.results.push(result);
}

function after (cb) {
  this.afterHooks.push(cb);
}

function createTestContext (parent, desc) {
  return {
    level: (parent ? (parent.level + 1) : 0),
    parent: parent,
    desc: (desc || 'root'),
    test: test,
    skip: skip,
    plan: plan,
    pass: pass,
    fail: fail,
    ok: ok,
    equal: equal,
    deepEqual: deepEqual,
    throws: throws,
    after: after,
    teardown: after,
    end: end,
    done: false,
    results: [],
    afterHooks: [],
    promise: Promise.resolve(),
    nTest: 0,
    nPass: 0,
    nFail: 0,
    nSkip: 0,
  };
}

module.exports = rootContext;
