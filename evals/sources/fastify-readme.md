# Fastify

An efficient server implies a lower cost of the infrastructure, better
responsiveness under load and happy users. How can you efficiently handle the
resources of your server, knowing that you are serving the highest number of requests
possible, without sacrificing security validations and handy development?

Enter Fastify. Fastify is a web framework highly focused on providing the best
developer experience with the least overhead and a powerful plugin architecture.
It is inspired by Hapi and Express and as far as we know, it is one of the fastest
web frameworks in town.

## Core features

- **Highly performant:** as far as we know, Fastify is one of the fastest web
  frameworks in town.
- **Extensible:** Fastify is fully extensible via its hooks, plugins and
  decorators.
- **Schema based:** even if it is not mandatory, we recommend using
  [JSON Schema](https://json-schema.org/) to validate your routes and serialize your
  outputs. Internally, Fastify compiles the schema in a highly performant function.
- **Logging:** logs are extremely important but expensive; we chose the best
  logger to almost remove this cost, [Pino](https://getpino.io/)!
- **Developer friendly:** the framework is built to be very expressive and help
  developers in their daily use, without sacrificing performance and security.
- **TypeScript ready:** we work hard to maintain a TypeScript type declaration
  file so things work as expected.

## Plugins

Fastify is fully extensible via its hooks, plugins and decorators. A plugin can
be a set of routes, a decorator, or a hook. Fastify plugins can be encapsulated
so that they do not leak into other contexts unless you want them to.

See the [Plugins](https://fastify.dev/docs/latest/Reference/Plugins/) guide
and [How to write a good plugin](https://fastify.dev/docs/latest/Guides/Write-Plugin/)
for writing a good Fastify plugin.

Register a plugin with `fastify.register`:

```js
fastify.register(require('./my-plugin'))
```

## Hooks

You can listen to specific events in the application or request/response
lifecycle by using hooks such as `onRequest`, `preHandler`, `onSend`, and
`onResponse`. Hooks are one of the mechanisms that make Fastify fully extensible.

## Getting Started

```bash
npm i fastify
```

```js
const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.listen({ port: 3000 })
```

## License

Licensed under [MIT](./LICENSE).
