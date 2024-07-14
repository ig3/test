'use strict';

const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');

let nTests = 0;
let nPass = 0;
let nFail = 0;

(async () => {
  console.log('TAP version 13');
  for (const entry of fs.readdirSync('test/data')) {
    if (entry.startsWith('case')) {
      await runCase(entry);
    }
  }
  console.log();
  console.log('1..' + nTests);
  console.log('# tests ' + nTests);
  console.log('# pass  ' + nPass);
  if (nFail === 0) {
    console.log('\n# ok');
  } else {
    console.log('# fail  ' + nFail);
    process.exitCode = 1;
  }
})();

function runCase (caseName) {
  return new Promise(resolve => {
    console.log('# ' + caseName);
    const data = fs.readFileSync(
      'test/data/' + caseName,
      { encoding: 'utf8' }
    );
    const expectedOutput =
      data.slice(data.indexOf('/*') + 3, data.indexOf('*/'))
      .replace('<dirname>', __dirname);
    const expectedExitCode =
      expectedOutput.indexOf('\n# fail') === -1 ? 0 : 1;

    const child = spawn('node', [path.join(__dirname, '/data/' + caseName)]);

    child.stdout.setEncoding('utf8');
    const stdout = [];
    child.stdout.on('data', data => {
      stdout.push(data);
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', data => {
      console.error('child error: ', data);
    });

    child.on('close', code => {
      if (expectedExitCode === 0) {
        if (code === 0) {
          console.log('ok ' + (++nTests) + ' exit code 0');
          nPass++;
        } else {
          console.log('not ok ' + (++nTests) + ' exit code 0');
          nFail++;
        }
      } else {
        if (code === 0) {
          console.log('not ok ' + (++nTests) + ' exit code 1');
          nFail++;
        } else {
          console.log('ok ' + (++nTests) + ' exit code 1');
          nPass++;
        }
      }
      if (stdout.join('') === expectedOutput) {
        console.log('ok ' + (++nTests) + ' correct output');
        nPass++;
      } else {
        console.log('not ok ' + (++nTests) + ' correct output');
        console.log('  ---');
        console.log('    Expected:');
        console.log(
          expectedOutput.split('\n').map(line => '    ' + line).join('\n'));
        console.log('    Actual:');
        console.log(
          stdout.join('').split('\n').map(line => '    ' + line).join('\n'));
        console.log('  ...');
        nFail++;
      }
      resolve('resolved: ' + caseName);
    });
  });
}
