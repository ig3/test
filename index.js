'use strict';

const rootContext = createTestContext();
const assert = require('node:assert/strict');
const { inspect } = require('node:util');

// It aint over 'till it's over
process.on('exit', code => {
  if (rootContext.results.length > 0) {
    log('TAP version 13');
    rootContext.results
    .forEach(result => {
      reportResult(rootContext, rootContext, result);
    });
    if (
      rootContext.nPlan &&
      rootContext.nPlan !== rootContext.nTest
    ) {
      logFail(
        rootContext,
        'plan ' + rootContext.nPlan + ' != actual ' + rootContext.nTest
      );
      process.exitCode = 1;
    }
    if (rootContext.nTest) {
      log();
      log('1..' + rootContext.nTest);
      log('# tests ' + rootContext.nTest);
      log('# pass  ' + rootContext.nPass);
      if (rootContext.nSkip) {
        log('# skip  ' + rootContext.nSkip);
      }
      if (rootContext.nFail > 0) {
        log('# fail  ' + rootContext.nFail);
        process.exitCode = 1;
      } else if (rootContext.nPass > 0) {
        log('\n# ok');
      }
    }
  }
});

function log (...args) {
  console.log(...args);
}

function reportResult (rootContext, resultContext, result) {
  if (result.type === 'test') {
    log('# test: ' + result.desc);
    result.context.results
    .forEach(subResult => {
      if (result.done) {
        logFail(
          result.context,
          subResult.name + ' called after end\n' +
          '  ---\n' +
          '  operation: ' + subResult.name + '\n' +
          (subResult.desc ? '  desc: ' + subResult.desc + '\n' : '') +
          '  at: ' + subResult.at + '\n' +
          '  ...'
        );
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
      logFail(
        result.context,
        'plan ' + result.context.nPlan + ' != actual ' + result.context.nTest
      );
    }

    if (!result.done) {
      logFail(
        result.context,
        'end() not called for test: ' + result.desc + '\n' +
        '  ---\n' +
        '    at: ' + result.at + '\n' +
        '  ...'
      );
    }
    if (result.context.nFail === 0) {
      logPass(resultContext, 'test: ' + result.desc);
    } else {
      logFail(resultContext, 'test: ' + result.desc);
    }
  } else if (result.type === 'skip') {
    log('# test: ' + result.desc);
    rootContext.nSkip++;
    log(
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
      logPass(resultContext, (result.desc || result.name));
    } else {
      logFail(
        resultContext,
        (result.desc || result.name) + '\n' +
        '  ---\n' +
        '  operator: ' + result.name + '\n' +
        ((Object.hasOwn(result, 'expected'))
          ? '  expected: ' + inspect(result.expected) + '\n'
          : ''
        ) +
        ((Object.hasOwn(result, 'actual'))
          ? '  actual:   ' + inspect(result.actual) + '\n'
          : ''
        ) +
        '  at: ' + result.at + '\n' +
        '  ...'
      );
    }
  }
}

function logPass (resultContext, msg) {
  rootContext.nPass++;
  log('ok ' + (++rootContext.nTest) + ' ' + msg);
  if (resultContext !== rootContext) {
    resultContext.nTest++;
    resultContext.nPass++;
  }
}

function logFail (resultContext, msg) {
  rootContext.nFail++;
  log('not ok ' + (++rootContext.nTest) + ' ' + msg);
  if (resultContext !== rootContext) {
    resultContext.nTest++;
    resultContext.nFail++;
  }
}

// Return the caller source location from the stack
function getAt () {
  return new Error('test').stack.split('\n')[3].slice(7);
}

function test (desc, cb, opts) {
  const self = this;
  const subContext = createTestContext(self.level + 1);
  self.results.push({
    type: 'test',
    desc: desc,
    context: subContext,
    at: getAt(),
  });
  return Promise.resolve(cb(subContext));
}

function skip (desc, cb, opts) {
  const self = this;
  self.results.push({
    type: 'skip',
    desc: desc,
  });
}

function plan (n) {
  this.nPlan = n;
}

function pass (desc) {
  this.results.push({
    type: 'assert',
    name: 'pass',
    pass: true,
    desc: desc,
    at: getAt(),
  });
}

function fail (desc) {
  this.results.push({
    type: 'assert',
    name: 'fail',
    pass: false,
    desc: desc,
    at: getAt(),
  });
}

function ok (actual, desc) {
  this.results.push({
    type: 'assert',
    name: 'ok',
    pass: !!actual,
    actual: actual,
    desc: desc,
    at: getAt(),
  });
}

function throws (fn, expected, desc) {
  const result = {
    type: 'assert',
    name: 'throws',
    pass: true,
    desc: desc,
    at: getAt(),
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
  this.results.push({
    type: 'end',
    name: 'end',
    at: getAt(),
  });
  while (this.afterHooks.length > 0) {
    this.afterHooks.pop()();
  }
}

function equal (actual, expected, desc) {
  this.results.push({
    type: 'assert',
    name: 'equal',
    pass: Object.is(actual, expected),
    actual: actual,
    expected: expected,
    desc: desc,
    at: getAt(),
  });
}

function deepEqual (actual, expected, desc) {
  const result = {
    type: 'assert',
    name: 'deepEqual',
    pass: true,
    actual: actual,
    expected: expected,
    desc: desc,
    at: getAt(),
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

function createTestContext (level = 0) {
  return {
    // Properties
    level: level,
    results: [],
    nTest: 0,
    nPass: 0,
    nFail: 0,
    nSkip: 0,
    afterHooks: [],
    // Methods
    plan: plan,
    test: test,
    skip: skip,
    pass: pass,
    fail: fail,
    ok: ok,
    equal: equal,
    deepEqual: deepEqual,
    throws: throws,
    after: after,
    teardown: after,
    end: end,
  };
}

module.exports = rootContext;
