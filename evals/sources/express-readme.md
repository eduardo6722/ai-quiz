# Express

Fast, unopinionated, minimalist web framework for [Node.js](https://nodejs.org/en).

```js
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000)
```

## Features

- Robust routing
- Focus on high performance
- HTTP helpers (redirection, caching, etc)
- View system supporting 14+ template engines
- Content negotiation
- Executable for generating applications quickly

## Routing

Express routing lets you define how your application responds to a client request to a particular endpoint. An endpoint is a URI (or path) and a specific HTTP request method (GET, POST, and so on).

Each route can have one or more handler functions, which are executed when the route is matched.

Route definition takes the following structure:

```js
app.METHOD(PATH, HANDLER)
```

Where:

- `app` is an instance of express.
- `METHOD` is an [HTTP request method](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods), in lowercase.
- `PATH` is a path on the server.
- `HANDLER` is the function executed when the route is matched.

The following example registers a GET route handler with `app.get`.

```js
app.get('/', (req, res) => {
  res.send('Hello World!')
})
```

Use `app.post` to handle POST requests, `app.put` for PUT, and `app.delete` for DELETE.

## Middleware

Express is a routing and middleware web framework that has minimal functionality of its own: an Express application is essentially a series of middleware function calls.

Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named `next`.

Middleware functions can perform the following tasks:

- Execute any code.
- Make changes to the request and the response objects.
- End the request-response cycle.
- Call the next middleware function in the stack.

If the current middleware function does not end the request-response cycle, it must call `next()` to pass control to the next middleware function. Otherwise, the request will be left hanging.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

```bash
npm install express
```

## License

[MIT](LICENSE)
