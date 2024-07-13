'use strict';

let done = false;
let nTests = 0;
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
  if (nTests) {
    console.log();
    console.log('1..' + nTests);
    console.log('# tests ' + nTests);
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
  done = false;
  header();
  const stack = new Error('test').stack.split('\n').slice(2);
  console.log('# ' + desc);
  cb(module.exports);
  if (!done) {
    nFail++;
    console.log('not ok ' + (++nTests) +
      ' test exited without ending: ' + desc);
    console.log('  ---');
    console.log('    operator: fail');
    console.log('    at: ' + stack[0].slice(7));
    console.log('  ...');
  } else if (nFail === 0) {
    nPass++;
    console.log('ok ' + (++nTests) + ' ' + desc);
  } else {
    nFail++;
    console.log('not ok ' + (++nTests) + ' ' + desc);
  }
}

async function skip (desc, cb, opts) {
  header();
  console.log('# ' + desc);
  console.log('ok ' + (++nTests) + ' # skip ' + desc);
  nSkip++;
}

function pass (desc) {
  if (done) {
    nFail++;
    console.log('not ok ' + ++nTests + ' .end already called: ' + desc);
  } else {
    nPass++;
    console.log('ok ' + ++nTests + ' ' + desc);
  }
}

function fail (desc) {
  if (done) {
    nFail++;
    console.log('not ok ' + (++nTests) + ' .end already called: ' + desc);
  } else {
    nFail++;
    console.log('not ok ' + (++nTests) + ' ' + desc);
  }
}

function end () {
  if (done) {
    nFail++;
    console.log('not ok ' + ++nTests + ' .end already called');
  } else {
    done = true;
  }
}

module.exports = {
  test,
  skip,
  pass,
  fail,
  end,
};
