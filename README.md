# Apone

Configure and validate express routes with objects. Register routes in any order. Extend as necessary.

## Install and Quick Start

`npm install apone`

```js
const Express = require('express')
const Apone = require('apone')

let app = Express()
let apone = new Apone(app)

apone.register({
  path: '/hello'
  method: 'get',
  handle: (req, res, next) => {

    res.send('world')
    return next()
  }
})
```

# table of contents
- [api](#api)
- [routes](#routes)
- [schemas](#schemas)
- [validationResults](#validationresult)
- [extensions](#extensions)
- [route-behavior](#route-behavior)
- [contributing](#contributing)
- [faq](#faq)

# API

### `new Apone(app, options)`
  - `app` - `Express` instance
  - `options` - `object` (optional)
    - `prefix` - `string` prepends all routes without prefixs
    - `extensions` - `array` of [extensions](#extensions)
  - throws `AponeValidationError` for invalid options

### `register(routes, state)`
  - `routes` - `array|object`
  - `state` - `object` (optional) if a route declares `handle(state)` this will be passed in (simple DI)
  - throws `AponeValidationError` for invalid or duplicate routes

# Routes

By defining the following properties, routes opt-into different behaviors. Each property name resolves to a function and each property value is an argument to that function. Custom properties, or [extensions](#extensions), can be specified in Apone's [constructor options](#api).

## Properties
  - `method` - `string` http verbs: GET, POST, PATCH, DELETE
  - `path` - `string` endpoint at which `handle` will be invoked (no regex allowed)
  - `handle` - `function|array` middleware OR function which returns middleware and accepting one potential argument. If an argument is specified, `state` (from the [register](#api) method) is passed in
  - `validation` - `object` object with up to three properties, each a valid [schema](#schemas)
    - `params` - `Schema`
    - `query` - `Schema`
    - `body` - `Schema`
  - `prefix` - `string` path prefix which takes priority over Apone's [constructor option](#api) global prefix
  - `metadata` - `object` - flexible bucket for anything else

### example:

```js
  let route = {
    method: 'PUT',
    path: '/puppers/:id',
    metadata: {
      favorite: true
    },
    prefix: '/api/v2',
    validation: {
      params: Joi.object().keys({ id: Joi.number().integer().min(1).max(1).required() }),
      body: {
        validate: (query) => {

          // can coerce a more complicated type here, and return valid payload only
          if (query.name && typeof query.name === 'string') {
            return { value: { name: query.name } }
          }
          return new { error: Error('name is required!') }
        }
      }
    },
    // injected dependency makes for easy testing
    handle: (state) => [

      // if you regularly need internalOnly, create an extension!
      state.internalOnly,
      (req, res, next) => {

        req.send(state.pupperRepository.update(req.body))
        return next()
      }
    ]
  }
```

# Schemas
Schemas are used to validate user requests. [Joi](https://github.com/hapijs/joi) is reccomended, but any schema can be used. Coerce and sanitize requests here.

## Properties
  - `validate` - `function` which must return a [ValidationResult](#validationresult)

### example:
```js
  let schema = {
    validate: (body) => {

      if (body.id === 1) {
        return { value: { id: body.id } }
      }
      return { error: new Error('value was not 1!') }
    }
  }
```

# ValidationResult

Returned by [schema](#schemas) validation

## Properties
  - `error` - `Error` object
  - `value` - `any` coerced and sanitized result

### example:

```js
  let validationResult = {
    error: isValid ? null : new Error(),
    value: isValid ? value : null
  }
```

# Extensions

Extensions are custom [route properties](#routes). They must be defined in the Apone [constructor options](#api) and will execute in their array order, according to [request behavior](#route-behavior).

## Properties
  - `name` - `string` used by routes to opt into this extension behavior
  - `factoryFunc` - `function` invoked by Apone during route registration, returning [middleware](#https://expressjs.com/en/guide/using-middleware.html) which is inserted into [request behavior](#route-behavior).
  - `type` - `string` defaults to `pre`, or optionally `post`.


### example:
The following extension adds a traceId to each request prior to validation. First, Apone is instantiated with the `trace` extension. During registration, `trace(true)` is called and the return function is added to the stack. Extensions execute in order, by type.

```js
const Express = require('express')
const Apone = require('apone')

let app = Express()
let extensions = [{
  name: 'trace',
  factoryFunc: (doTag) =>  (req, res, next) => {

    if (doTag) {
      res.locals.traceId = Math.random()
      return next()
    }
    else {
      next()
    }
  }
}]

let apone = new Apone(app, { extensions })

apone.register({
  path: '/hello'
  method: 'get',
  trace: true,
  handle: (req, res, next) => {

    console.log(res.locals.traceId) // 0.23456...
    res.send('world')
    return next()
  }
})
```

# Route Behavior
The lifecycle of middleware steps assembled by Apone for routes

1. Apone appends the finished route object to `res.locals.route` for logging, etc
2. `pre` [extensions](#Extensions)
3. request `param` validation
4. request `query` validation
5. request `body` validation
6. `handle` middleware
7. `post` [extensions](#Extensions)

# Contributing
Contributions are welcome.

## Reporting Bugs
Please open an issue and describe the situation clearly. Include reproduction instructions, expected outcomes, and project version number.

## Pull Requests
 - One feature per request
 - Descriptive commit messages
 - Test coverage is manditory
 - Pass project linter

# FAQ
1) If I use this with an existing application will the dupe check work
  - Not currently

2) Any plans to expand the framework?
  - Apone was designed to be small and flexible, but feel free to open an issue

3) What about express-router
  - You can probably live without it. This is a simple alternative.

4) How do I pronounce it
 - like in [Aliens](https://www.youtube.com/watch?v=woB1zvaSXag)
