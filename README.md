# yep

A functional programming library that treats every result as promise 
and therefor doesn't differentiate between async and sync code.

The code should showcase that fp is not hard in typecript.

Please look at examples and tests.

## Usage

```ts
import {flat, map, pipe, yep, nah, type Box, or, all} from './lib.js';

class HttpError extends Error {}
class ParseError extends Error {}

const req = (url: string): Box<Response, HttpError> =>
  fetch(url)
    .then(yep)
    .catch(() => nah(new HttpError('http error')));

const parse = <T>(res: Response): Box<T, ParseError> =>
  res
    .json()
    .then((json) => yep(json as T))
    .catch(() => nah(new ParseError('json parse error')));

const checkStatus = (res: Response) =>
  res.status >= 400 ? nah(new HttpError('status error')) : yep(res);

const getPokemon = (name: string) =>
  pipe(
    yep(`https://pokeapi.co/api/v2/pokemon/${name}`),
    flat(req),
    flat(checkStatus),
    flat(parse<{weight: number; name: string}>),
  );

const program = pipe(
  yep(['ditto', 'onix']),
  flat((names) => all(names.map(getPokemon))),
  map(([v, w]) =>
    v.weight < w.weight
      ? `${w.name} heavier then ${v.name}`
      : `${v.name} heavier then ${w.name}`,
  ),
  or((e) => yep(`recovered err: ${e.message}`)),
);

program.then(console.log);
```
