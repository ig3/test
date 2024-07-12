'use strict';

let done = false;
let nTests = 0;
let nPassed = 0;
let nFailed = 0;
const nSkipped = 0;
async function test (desc, cb, opts) {
  const stack = new Error('test').stack.split('\n').slice(2);
  console.log('TAP version 13');
  console.log('# ' + desc);
  await Promise.resolve()
  .then(() => { return cb(module.exports); });
  if (!done) {
    nFailed++;
    console.log('not ok ' + (++nTests) +
      ' test exited without ending: ' + desc);
    console.log('  ---');
    console.log('    operator: fail');
    console.log('    at: ' + stack[0].slice(7));
    console.log('  ...');
  } else if (nFailed === 0) {
    nPassed++;
    console.log('ok ' + (++nTests) + ' ' + desc);
  } else {
    nFailed++;
    console.log('not ok ' + (++nTests) + ' ' + desc);
  }

  console.log();
  console.log('1..' + nTests);
  console.log('# tests ' + nTests);
  if (nSkipped) {
    console.log('# skip  ' + nSkipped);
  }
  console.log('# pass  ' + nPassed);
  if (nFailed === 0) {
    console.log('\n# ok');
  } else {
    console.log('# fail  ' + nFailed);
  }
}

function pass (desc) {
  if (done) {
    nFailed++;
    console.log('not ok ' + ++nTests + ' .end already called: ' + desc);
  } else {
    nPassed++;
    console.log('ok ' + ++nTests + ' ' + desc);
  }
}

function fail (desc) {
  if (done) {
    nFailed++;
    console.log('not ok ' + (++nTests) + ' .end already called: ' + desc);
  } else {
    nFailed++;
    console.log('not ok ' + (++nTests) + ' ' + desc);
  }
}

function end () {
  if (done) {
    nFailed++;
    console.log('not ok ' + ++nTests + ' .end already called');
  } else {
    done = true;
  }
}

module.exports = {
  test,
  pass,
  fail,
  end,
};
