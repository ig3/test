'use strict';

let done = false;
let nTests = 0;
let nPass = 0;
let nFail = 0;
let nSkip = 0;
async function test (desc, cb, opts) {
  const stack = new Error('test').stack.split('\n').slice(2);
  console.log('TAP version 13');
  console.log('# ' + desc);
  await Promise.resolve()
  .then(() => { return cb(module.exports); });
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

  console.log();
  console.log('1..' + nTests);
  console.log('# tests ' + nTests);
  console.log('# pass  ' + nPass);
  if (nSkip) {
    console.log('# skip  ' + nSkip);
  }
  if (nFail > 0) {
    console.log('# fail  ' + nFail);
  } else if (nPass > 0) {
    console.log('\n# ok');
  }
}

async function skip (desc, cb, opts) {
  console.log('TAP version 13');
  console.log('# ' + desc);
  console.log('ok ' + (++nTests) + ' # skip ' + desc);
  nSkip++;

  console.log();
  console.log('1..' + nTests);
  console.log('# tests ' + nTests);
  console.log('# pass  ' + nPass);
  if (nSkip) {
    console.log('# skip  ' + nSkip);
  }
  if (nFail > 0) {
    console.log('# fail  ' + nFail);
  } else if (nPass > 0) {
    console.log('\n# ok');
  }
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
