# omgeving

Type-safe environment variables in Bun and Node

## Install

```bash
pnpm/npm/bun i omgeving
# or
yarn add omgeving
```

## Example

```ts
const { PORT } = cleanEnv({ PORT: port({ devDefault: 3000 }) });
```

If you are using Node, you need to pass a `--env-file` argument to where your `.env` file is:

```bash
node --env-file=.env app.js
```
