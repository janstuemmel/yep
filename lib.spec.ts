import {expect, it, vi} from 'vitest';
import {
  type Box,
  all,
  err,
  flat,
  map,
  nah,
  or,
  pipe,
  tap,
  unbox,
  yep,
} from './lib.js';

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

it('should unbox', async () => {
  expect(await pipe(nah(1), unbox(0))).toEqual(0);
  expect(await pipe(nah(1), unbox('err'))).toEqual('err');
  expect(await pipe(yep(1), unbox(0))).toEqual(1);
});

it('should map', async () => {
  expect(
    await pipe(
      yep(1),
      map((n) => n + 1),
      unbox(0),
    ),
  ).toEqual(2);
  expect(
    await pipe(
      nah(1),
      map((n) => n + 1),
      unbox('err'),
    ),
  ).toEqual('err');
});

it('should flat', async () => {
  expect(
    await pipe(
      yep(1),
      flat((n) => yep(n)),
    ),
  ).toEqual({ok: true, val: 1});
  expect(
    await pipe(
      yep(1),
      flat((n) => nah(`err with ${n}`)),
    ),
  ).toEqual({ok: false, err: 'err with 1'});
});

it('should err', async () => {
  expect(
    await pipe(
      nah('err'),
      err(() => 'other'),
    ),
  ).toEqual({ok: false, err: 'other'});
});

it('should or', async () => {
  expect(
    await pipe(
      nah('err'),
      or(() => yep('handled err')),
    ),
  ).toEqual({ok: true, val: 'handled err'});
  expect(
    await pipe(
      nah('err'),
      or(() => nah('other err')),
    ),
  ).toEqual({ok: false, err: 'other err'});
});

it('should tap', async () => {
  const spy = vi.fn();
  await pipe(yep('info'), tap(spy));
  expect(spy).toHaveBeenCalledWith('info');
  spy.mockReset();
  await pipe(nah('err'), tap(spy));
  expect(spy).not.toHaveBeenCalled();
});

it('should all', async () => {
  const p1 = pipe(
    yep(1),
    map((n) => n + 1),
  );
  const p2 = pipe(
    yep(1),
    map((n) => n + 1),
  );
  const program = pipe(
    yep([p1, p2]),
    flat(all),
    map(([v, w]) => v + w),
    unbox(0),
  );

  expect(await program).toEqual(4);
});

it('should accumulate errors', async () => {
  class Not0 extends Error {}
  class Not1 extends Error {}

  const t1 = pipe(
    yep(1),
    flat((n) => (n === 0 ? nah(new Not0()) : yep(n))),
    flat((n) => (n === 1 ? nah(new Not1()) : yep(n))),
  );
  type _t1 = Expect<Equal<typeof t1, Box<number, Not0 | Not1>>>;
  expect(await pipe(t1, unbox('err'))).toEqual('err');

  const t2 = pipe(
    t1,
    or(() => nah('err')),
  );
  type _t2 = Expect<Equal<typeof t2, Box<number, string>>>;
  expect(await pipe(t2)).toEqual({ok: false, err: 'err'});

  const t3 = pipe(
    t1,
    err(() => 'err'),
  );
  type _t3 = Expect<Equal<typeof t3, Box<number, string>>>;
  expect(await pipe(t3)).toEqual({ok: false, err: 'err'});
});

it.skip('example', async () => {
  class Err400 extends Error {}
  class Err500 extends Error {}
  class ErrParse extends Error {}

  const request = (url: string): Box<Response, Err500> =>
    fetch(url)
      .then((res) => yep(res))
      .catch(() => nah(new Err500()));

  const parse = async <T>(res: Response): Box<T, ErrParse> =>
    res
      .json()
      .then((j) => yep(j as T))
      .catch(() => nah(new ErrParse()));

  const checkStatus = (res: Response) =>
    res.status >= 400 ? nah(new Err400()) : yep(res);

  const getPokemon = (name: string) =>
    pipe(
      yep(name),
      map((name) => `https://pokeapi.co/api/v2/pokemon/${name}`),
      flat(request),
      flat(checkStatus),
      flat(parse<{weight: number}>),
    );

  const res = pipe(
    yep('ditto'),
    flat(getPokemon),
    map((v) => v.weight),
  );

  expect(await pipe(res, unbox('err'))).toEqual(40);
});
