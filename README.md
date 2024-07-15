# @ig3/test

A very minimal and simple TAP producing test module.

## Installation

```
$ npm install -D @ig3/test
```

## Example

```
'use strict';

const t = require('@ig3/test');

t.test('timing test', t => {
  t.equal(typeof Date.now, 'function', 'Date.now is a function');
  const start = Date.now();

  setTimeout(() => {
    t.equal(Date.now() - start, 100, 'It is now 100ms after start');
  }, 100);
});
```

## Description

This module runs one or more tests and produces TAP output according to the
results.

A test script may contain one or more tests and test may be nested.

For example:

```
'use strict';

const t = require('@ig3/test');

t.test('test one', t => {
  t.pass('test one runs');
  t.test('sub-test one', t => {
    t.pass('sub-test one runs');
    t.end();
  });
  t.test('sub-test two', t => {
    t.pass('sub-test two runs');
    t.end();
  });
  t.end();
});

t.test('test two', t => {
  t.pass('test two runs');
  t.end();
});
```

## Methods

### test(desc, cb, opts)

Create a new test.

desc: a string description of the test.

cb: the callback function that implements the test. This function will
receive a single argument: a new test context with all the methods of the
API.

opts: ignored.

### skip(desc, cb, opts)

Like test except that the callback will not be called and the test will be
treated as a passing test.

### plan(n)

Set the expected number of tests to be performed.

n: the number of tests expected.

This can be set for each test context.

For the global context, set it before calling test or skip. For example:

```
'use strict';

const t = require('@ig3/test');

t.plan(3);

t.test('example', t => {
  t.pass('it works');
  t.end();
});
```

This will produce:
```
TAP version 13
# example
ok 1 it works
ok 2 test: example
not ok 3 plan 3 != actual 2

1..3
# tests 3
# pass  2
# fail  1
```

Note that the test itself is evaluated for success or failure, reported in
the TAP output and included in the count but the report that actual did not
match the plan is not counted.

It also works inside tests:

```
'use strict';

const t = require('..');

t.test('example', t => {
  t.plan(4);
  t.pass('it works');
  t.end();
});
```

This produces:

```
TAP version 13
# example
ok 1 it works
not ok 2 plan 4 != actual 1
not ok 3 test: example

1..3
# tests 3
# pass  1
# fail  2
```

Note that the plan at the end of the TAP output (here `1..3`) is not the
plan of the single test. The test script could have multiple tests, nested
or not. The plan within a test is a plan only for that test, including
nested subtests. It is not written to the TAP output because TAP allows
only a single plan, not a plan for each test. But it is evaluated and TAP
output reporting a failure is produced if the actual number of tests does
not equal the planned number.


### pass(desc)

An assertion that always passes.

desc: a description of the condition.

This assertion always passes. It is useful for recording in the TAP output
that a block of code was executed as expected.

### fail(desc)

An assertion that always fails.

desc: a description of the condition.

This assertion always fails. It is useful in a block of code that should
not be reached. For example, the catch of a try or promise, if failure is
not expected.

### end()

This method indicates the end of the test. It must be called exactly once
per test. If a test finishes and end() has not been called, an error will
be produced and the test will be treated as a failing test. If end() is
called more than once, an error is produced and the test will be treated as
a failing test.

### equal(actual, expected, desc)

An assertion that compares two values using Object.is() and passes or fails
according to the result.

actual: the actual value to be tested

expected: the expected value

desc: a description of the test condition

