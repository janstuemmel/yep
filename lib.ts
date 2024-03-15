export type Yep<T> = {ok: true; val: T};
export type Nope<E> = {ok: false; err: E};
export type Result<T, E> = Yep<T> | Nope<E>;
export type Pipe = {
  <A>(a: A): A;
  <A, B>(a: A, ab: (a: A) => B): B;
  <A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
  <A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
  <A, B, C, D, E>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
  ): E;
  <A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
  ): F;
  <A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
  ): G;
};

export const Yep = <T>(val: T): Result<T, never> => ({ok: true, val});

export const Nope = <E>(err: E): Result<never, E> => ({ok: false, err});

export const unwrap =
  <T, D, E>(v: D) =>
  (res: Result<T, E>): T | D =>
    res.ok ? res.val : v;

export const orElse =
  <T, D, E, F>(fn: (e: E) => Result<D, F>) =>
  (res: Result<T, E>): Result<T | D, F> =>
    res.ok ? res : fn(res.err);

export const map =
  <T, D, E>(fn: (val: T) => D) =>
  (res: Result<T, E>): Result<D, E> =>
    res.ok ? Yep(fn(res.val)) : res;

export const mapErr =
  <T, E, F>(fn: (err: E) => F) =>
  (res: Result<T, E>): Result<T, F> =>
    !res.ok ? Nope(fn(res.err)) : res;

export const flat =
  <T, D, E, F>(fn: (val: T) => Result<D, F>) =>
  (res: Result<T, E>): Result<D, E | F> =>
    res.ok ? fn(res.val) : res;

export const pipe: Pipe = (val: unknown, ...fns: ((n: unknown) => unknown)[]) =>
  fns.reduce((c, fn) => fn(c), val);

export const from =
  // biome-ignore lint/suspicious/noExplicitAny: must use any for fn args
  <E>(fn: (...args: any[]) => any, err: E) =>
  <T>(...args: Parameters<typeof fn>): Result<T, E> => {
    try {
      return Yep(fn(...args));
    } catch (_) {
      return Nope(err);
    }
  };
