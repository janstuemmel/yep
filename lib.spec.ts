import {it, expect} from 'vitest';

import {
  Nope,
  type Result,
  Yep,
  flat,
  map,
  unwrap,
  pipe,
  from,
  mapErr,
  orElse,
} from './lib.js';

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

const expectEqual =
  <T, D>(a: T) =>
  (b: D) =>
    expect(a).toEqual(b);

it('should pipe', () => {
  pipe(5, (n) => n + 1, expectEqual(6));
  pipe(
    5,
    (n) => n + 1,
    (n) => n - 1,
    expectEqual(5),
  );
  pipe('world', (n) => `hello ${n}`, expectEqual('hello world'));
});

it('should pipe Result', () => {
  pipe(
    Yep(5),
    map((n) => n + 1),
    expectEqual(Yep(6)),
  );
  pipe(
    Yep(5),
    flat(() => Nope('error')),
    expectEqual(Nope('error')),
  );
});

it('should map and flat', () => {
  const divide = (b: number) => (a: number) =>
    b === 0 ? Nope('divide by zero') : Yep(a / b);
  const minusOne = (a: number) => a - 1;

  pipe(Yep(5), map(minusOne), expectEqual(Yep(4)));
  pipe(Yep(5), flat(divide(1)), map(minusOne), expectEqual(Yep(4)));
  pipe(Yep(5), flat(divide(0)), map(minusOne), unwrap(0), expectEqual(0));
});

it('should json parse', () => {
  const unmarshal = <T>(data: string) => {
    try {
      return Yep<T>(JSON.parse(data));
    } catch (_) {
      return Nope('json unmarshal error');
    }
  };

  pipe(
    '{"foo": 1}',
    unmarshal<{foo: number}>,
    map((val) => val.foo),
    expectEqual(Yep(1)),
  );

  pipe(
    '}',
    unmarshal<{foo: number}>,
    map((val) => val.foo),
    expectEqual(Nope('json unmarshal error')),
  );
});

it('should from', () => {
  const unmarsh = from(JSON.parse, new Error('parse error'));
  pipe(
    '{"foo": 1}',
    unmarsh<{foo: number}>,
    map((v) => v.foo),
    unwrap(0),
    expectEqual(1),
  );

  pipe(
    '{',
    unmarsh<{foo: number}>,
    map((v) => v.foo),
    unwrap(0),
    expectEqual(0),
  );
});

it('should map error', () => {
  pipe(
    Yep(0),
    flat((n) => (n !== 0 ? Yep(n) : Nope(new Error))),
    mapErr(() => 'custom error'),
    map((n) => n + 1),
    expectEqual(Nope('custom error'))
  );
});

it('should orElse error', () => {
  const foo = pipe(
    Yep(0),
    flat((n) => (n !== 0 ? Yep(n) : Nope(new Error))),
    orElse(() => Yep(1)),
    map((n) => n + 1),
    unwrap(0),
    expectEqual(2)
  );
});

it('should accumulate types', () => {
  class Error1 extends Error {}
  class Error2 extends Error {}

  const fn1 = (n: number) => (n !== 0 ? Yep(n) : Nope(new Error2()));
  const fn2 = (n: number) => (n !== 0 ? Yep(n) : Nope(new Error1()));
  const fn3 = (n: number) => (n !== 0 ? Yep(n) : Nope('1'));

  const test = pipe(Yep(2), flat(fn1), flat(fn2), flat(fn3));

  type _test = Expect<
    Equal<typeof test, Result<number, Error1 | Error2 | string>>
  >;
});
