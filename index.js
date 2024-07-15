'use strict';

const rootContext = createTestContext();

// It aint over 'till it's over
process.on('exit', code => {
  if (
    rootContext.subtests.length > 0 ||
    rootContext.results.length > 0
  ) {
    console.log('TAP version 13');
  }
  rootContext.results
  .forEach(result => {
    reportResult(rootContext, rootContext, result);
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
    } else {
      rootContext.nFail++;
      console.log('not ok ' + (++rootContext.nTest) + ' test: ' + result.desc);
    }
  } else if (result.type === 'skip') {
    console.log('# ' + result.desc);
    rootContext.nSkip++;
    if (resultContext !== rootContext) resultContext.nSkip++;
    console.log(
      'ok ' +
      (++rootContext.nTest) +
      ' test: ' + result.desc + ' # SKIP'
    );
  } else if (result.type === 'assert') {
    if (result.pass) {
      rootContext.nPass++;
      if (resultContext !== rootContext) resultContext.nPass++;
    } else {
      rootContext.nFail++;
      if (resultContext !== rootContext) resultContext.nFail++;
    }
    console.log(
      (result.pass ? 'ok ' : 'not ok ') +
      (++rootContext.nTest) + ' ' +
      result.desc
    );
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
  this.plan = n;
}

function pass (desc) {
  this.results.push({
    type: 'assert',
    name: 'pass',
    pass: true,
    desc: desc,
  });
}

function fail (desc) {
  this.results.push({
    type: 'assert',
    name: 'fail',
    pass: false,
    desc: desc,
  });
}

function end () {
  this.results.push({
    type: 'end',
    name: 'end',
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
