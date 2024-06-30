type Yep<T> = {ok: true; val: T};
type Nah<E> = {ok: false; err: E};
export type Box<T, E> = Promise<Yep<T> | Nah<E>>;

export type GetBoxYep<T extends Box<any, any>> = T extends Box<infer U, any>
  ? U
  : never;

export type GetBoxNah<T extends Box<any, any>> = T extends Box<any, infer U>
  ? U
  : never;

export type InferBoxYepItem<A extends Box<any, any>[]> = {
  [I in keyof A]: GetBoxYep<A[I]>;
};

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

const _yep = <T>(val: T): Yep<T> => ({ok: true, val});
const _nah = <E>(err: E): Nah<E> => ({ok: false, err});

/**
 * Create a new `Box<T, never>`
 */
export const yep = <T>(v: T): Box<T, never> => Promise.resolve(_yep(v));

/**
 * Create a new `Box<never, E>`
 */
export const nah = <E>(err: E): Box<never, E> => Promise.resolve(_nah(err));

/**
 * Checks if Yep or Nah is Yep
 */
export const isYep = (v: Yep<any> | Nah<any>) => v.ok;

/**
 * Checks if Yep or Nah is Nah
 */
export const isNone = (v: Yep<any> | Nah<any>) => !v.ok;

/**
 * Transforms a value with a pipeline of functions.
 *
 * @example
 * const add = (b: number) => (a: number) => a + b
 * const div = (b: number) => (a: number) => a / b
 *
 * const res = pipe(2, add(2), div(2))
 * assert.equal(res, 2)
 */
export const pipe: Pipe = (val: unknown, ...fns: ((n: unknown) => unknown)[]) =>
  fns.reduce((c, fn) => fn(c), val);

/**
 * Unwraps a `Box<T, E>` ans returns `Yep<T>` or `Nah<E>`
 *
 * @example
 * const res1 = await unbox(0)(yep(1))
 * assert.equal(res1, 1)
 *
 * const res2 = await unbox(0)(nah(1))
 * assert.equal(res2, 0)
 */
export const unbox =
  <T, D, E>(v: D) =>
  (box: Box<T, E>): Promise<T | D> =>
    box.then((r) => (r.ok ? r.val : v));

/**
 * Maps a value `T` of a `Box<T, E>` and returns a `Box<D, E>`
 *
 * @param fn - A function that takes a value `T` and returns a value `D`
 * @returns A new `Box<D, E>`
 *
 * @example
 * const res = await pipe(
 *   yep(1),
 *   map(n => n + 1)
 *   unbox(0)
 * )
 *
 * assert.euqal(res, 2)
 */
export const map =
  <T, D, E>(fn: (v: T) => D) =>
  (box: Box<T, E>): Box<D, E> =>
    box.then((r) => (r.ok ? _yep(fn(r.val)) : r));

/**
 * Maps an error `E` of a `Box<T, E>` to a `Box<T, F>`
 *
 * @param fn - A function that takes an error `E` and returns an error `F`
 * @returns A new error `F`
 *
 * @example
 * const res = await pipe(
 *   nah('err'),
 *   err(() => 'other')
 * )
 *
 * assert.equal(res, {ok: false, err: 'other'})
 */
export const err =
  <T, E, F>(fn: (err: E) => F) =>
  (box: Box<T, E>): Box<T, F> =>
    box.then((r) => (r.ok ? r : _nah(fn(r.err))));

/**
 * Maps a value `T` of a `Box<T, E>` and returns a `Box<D, E | F>`
 *
 * @param fn - A function that takes a value `T` and returns a `Box<D, F>`
 * @returns A new `Box<D, E | F>`
 *
 * @example
 * const res = await pipe(
 *   yep(1),
 *   flat(n => yep(n + 1))
 *   unbox(0)
 * )
 *
 * assert.euqal(res, 2)
 */
export const flat =
  <T, D, E, F>(fn: (v: T) => Box<D, F>) =>
  (box: Box<T, E>): Box<D, F | E> =>
    box.then((r): Box<D, F | E> => (r.ok ? fn(r.val) : nah(r.err)));

/**
 * Maps an error `E` of a `Box<T, E>` to a `Box<T | D, F>`
 *
 * @param fn - A function that takes an error `E` and returns a `Box<T | D, F>`
 * @returns A new `Box<T | D, E>`
 *
 * @example
 * const res = await pipe(
 *   nah('err'),
 *   or((e) => yep(`${e} recoverd`))
 *   unbox('')
 * )
 *
 * assert.euqal(res, 'err recovered')
 */
export const or =
  <T, D, E, F>(fn: (e: E) => Box<D, F>) =>
  (box: Box<T, E>): Box<T | D, F> =>
    box.then((r): Box<T | D, F> => (r.ok ? yep(r.val) : fn(r.err)));

/**
 * Takes an array of Boxes<any, any> and returns a Box<any[], any>
 *
 * @example
 * const res = await pipe(
 *   all([yep(1), yep(3)]),
 *   map(([n1, n2]) => n1 + n2),
 *   unbox(0)
 * )
 *
 * assert.equal(res, 4)
 */
export const all = <const A extends Box<any, any>[]>(
  a: A,
): Box<InferBoxYepItem<A>, GetBoxNah<A[number]>> =>
  Promise.all(a).then((res) =>
    pipe(
      res.find((r) => !r.ok),
      (err) =>
        err
          ? err
          : _yep(res.filter(isYep).map((v) => v.val) as InferBoxYepItem<A>),
    ),
  );
