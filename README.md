# yep

A functional programming library that treats every result as promise.

The code should showcase that fp is not hard in typecript.

## Usage

```ts
const program = pipe(
  yep(1),
  flat((n) => n === 0 ? nah('err') : yep(n)),
  map((n) => n + 1),
);

const result = await program;

console.log(result)
```
