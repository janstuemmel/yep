type Yep<T> = {ok: true; val: T};
type Nah<E> = {ok: false; err: E};
export type Box<T, E> = Promise<Yep<T> | Nah<E>>;

const _yep = <T>(val: T): Yep<T> => ({ok: true, val});
const _nah = <E>(err: E): Nah<E> => ({ok: false, err});

export const yep = <T>(v: T): Box<T, never> => Promise.resolve(_yep(v));
export const nah = <E>(err: E): Box<never, E> => Promise.resolve(_nah(err));

type Pipe = {
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

export const pipe: Pipe = (val: unknown, ...fns: ((n: unknown) => unknown)[]) =>
  fns.reduce((c, fn) => fn(c), val);

export const unbox =
  <T, D, E>(v: D) =>
  (box: Box<T, E>): Promise<T | D> =>
    box.then((r) => (r.ok ? r.val : v));

export const map =
  <T, D, E>(fn: (v: T) => D) =>
  (box: Box<T, E>): Box<D, E> =>
    box.then((r) => (r.ok ? _yep(fn(r.val)) : r));

export const err =
  <T, E, F>(fn: (err: E) => F) =>
  (box: Box<T, E>): Box<T, F> =>
    box.then((r) => (r.ok ? r : _nah(fn(r.err))));

export const flat =
  <T, D, E, F>(fn: (v: T) => Box<D, F>) =>
  (box: Box<T, E>): Box<D, F | E> =>
    box.then((r): Box<D, F | E> => (r.ok ? fn(r.val) : nah(r.err)));

export const or =
  <T, D, E, F>(fn: (e: E) => Box<D, F>) =>
  (box: Box<T, E>): Box<T | D, F> =>
    box.then((r): Box<T | D, F> => r.ok ? yep(r.val) : fn(r.err));
