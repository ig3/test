'use strict';

const rootContext = createTestContext();

// It aint over 'till it's over
process.on('exit', code => {
  if (
    rootContext.subtests.length > 0 ||
    rootContext.results.length > 0
  ) {
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
    console.log('# ' + result.desc);
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
    console.log('# ' + result.desc);
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
        result.desc
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
        result.desc
      );
      console.log('  ---');
      console.log('  operator: ' + result.name);
      if (typeof result.expected !== 'undefined') {
        console.log('  expected: ' + result.expected);
      }
      if (typeof result.actual !== 'undefined') {
        console.log('  actual:   ' + result.actual);
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
  self.subtests.push(subContext);
  self.results.push({
    type: 'test',
    desc: desc,
    context: subContext,
  });
  cb(subContext);
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

function end () {
  this.results.push({
    type: 'end',
    name: 'end',
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
    end: end,
    equal: equal,
    done: false,
    subtests: [],
    results: [],
    nTest: 0,
    nPass: 0,
    nFail: 0,
    nSkip: 0,
  };
}

module.exports = rootContext;
