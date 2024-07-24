# @ig3/test

A minimal TAP producing module for performing tests.

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
be called synchronously and will receive a single argument: a new test
context with all the methods of the API. Its return value will be ignored,
except that it will be passed to Promise.resolve() and the resulting
promise will be the return value of the test method. It must call the end
method exactly once.

opts: ignored.

Returns a promise which resolves to the return from the callback.
Therefore, if the callback itself returns a promise, then the promise
returned from the test method will not resolve until after the promise
returned from the callback resolves. This feature can be used to run tests
sequentially.

For example:
```
'use strict';

const t = require('@ig3/test');

(async () => {
  console.log('start');
  await t.test('test one', t => {
    console.log('start test one');
    return new Promise(fulfill => {
      setTimeout(
        () => {
          fulfill();
          t.end();
          console.log('end test one');
        },
        10
      );
    });
    t.end();
  });
  await t.test('test two', t => {
    console.log('start test two');
    return new Promise(fulfill => {
      setTimeout(
        () => {
          fulfill();
          t.end();
          console.log('end test two');
        },
        10
      );
    });
    t.end();
  });
  console.log('end');
})();
```

Produces the following output:

```
start
start test one
end test one
start test two
end test two
end
TAP version 13
# test one
ok 1 test: test one
# test two
ok 2 test: test two

1..2
# tests 2
# pass  2

# ok
```

The callback of test two is not called until after the promise returned
from the callback of test one settles.

Remove the awaits and the order of execution and output changes to:

```
start
start test one
start test two
end
end test one
end test two
TAP version 13
# test one
ok 1 test: test one
# test two
ok 2 test: test two

1..2
# tests 2
# pass  2

# ok
```

In this case, the callback of test two is called after the callback of test
one is called (i.e. in the order of the calls to the test method) but
before the promise returned by the callback of test one settles.

In both cases, the TAP output is not produced until all tests are complete.

@ig3/test methods are all synchronous. The only deferred proessing is
production of the TAP output, which happens in a callback on the process
exit event.

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


### ok(actual, desc)

An assertion that passes if actual is truthy.

actual: the actual value to be tested.

desc: a description of the condition.

This assertion passes if actual is truthy and fails otherwise.


### equal(actual, expected, desc)

An assertion that compares two values using Object.is() and passes or fails
according to the result.

actual: the actual value to be tested

expected: the expected value

desc: a description of the test condition


### deepEqual(actual, expected, desc)

An assertion that compares two values using  and passes or fails
according to the result.

actual: the actual value to be tested

expected: the expected value

desc: a description of the test condition


### throws(cb[, expected[, desc]])

Assertion passes if the function cf, called with no arguments, throws an exception and expected is not provided or expected matches the thrown exception.

cb: a callback function that will be called with no arguments. 

expected: a string, regular expression or object to be matched against the thrown exception.

descr: a description of the test condition.


### after(cb) / teardown(cb)

Register a callback to be called when end() is called.

cb: a function that will be called with no arguments.

teardown is an alias for after.

If multiple callbacks are registered, they will be called in the reverse of
the order they were registered (i.e. last in first out).

### end()

This method indicates the end of the test. It must be called exactly once
per test. If a test finishes and end() has not been called, an error will
be produced and the test will be treated as a failing test. If end() is
called more than once, an error is produced and the test will be treated as
a failing test.

## Motivation

I used [tape](https://www.npmjs.com/package/tape) and
[multi-tape](https://www.npmjs.com/package/multi-tape) for many years to
good effect but recently at installation npm was reporting deprecated and
unsupported dependencies. This prompted me to review my test tools again.

I tried [node's test runner](https://nodejs.org/api/test.html) and
[assert](https://nodejs.org/api/assert.html). It was very appealing that
they are bundled with node which, among other things, gave me confidence
that they would be well designed, well implemented and well supported. They
are very competent tools but after using them I decided that I don't like
assertions that throw exceptions and produce no output when they pass. It
makes it difficult to distinguished assertions that passed from assertions
that were never evaluated due to errors in or misunderstanding of the test
scripts.

I missed faults and relased code more than once, with all tests passing,
only to find later that the tests weren't testing what I thought they were.
I missed the verboseness of tape, with which every assertion is itself a
test reported in the TAP output, making it easy to determine which and how
many assertions were evaluated.

So I returned to reviewing available packages and came across 
[zora](https://www.npmjs.com/package/zora) which appealed due to
its small size, lack of dependencies and similarity to tape. I tried it and
it works well. Like tape, its assertions don't throw exceptions and each
assertion that is evaluated is reported in the TAP output. The
documentation is a bit scant so I spent some time reviewing the code to
understand how it works and what it does and doesn't do. It was easy to
rewrite existing tests to work with zora.

I might have just used zora but by this time I had spent quite some time
reviewing various frameworks and how they operated. I was curious about the
possibility of a framework that worked like tape and zora, but allowed
commonly avaailable assertion libraries to be used, like chai or
node:assert: wrapping them to catch their exceptions and carry on testing,
and reporting them all, pass or fail. And I missed the 'pass' assertion of
tape and a few other very minor details that I hadn't gotten used to with
zora.

So I wrote this, as much an exercise in understanding how a test framework
might work as an attempt to write the next best thing. It is not yet very
developed, with only a handful of assertions. It wraps a couple of
node:assert assertions but nothing in the API supports doing this with
exception throwing assertions generally. And maybe it never will: I have a
better appreciation for the diversity of assertions and failure reports.
Reporting pass/fail would be trivial but more helpful diagnostics are not
so easy to generalize.

