'use strict'

const Path = require('path')
const Util = require('./util')
const Validation = require('./validation')
const RequestValidation = require('./request-validation')
const Errors = require('./errors')

class Apone {

  constructor(app, options = {}) {

    this._app = app
    this._options = Validation.validateOptions(options)
    this._validateRoutes = Validation.createValidateRoutes(this._options.extensions)
    this._routes = []
  }

  get routes() {

    return this._routes.slice()
  }

  register(routes, state = {}) {

    return this._validateRoutes(routes)
      .sort(Util.sortRoutes)
      .map(route => {

        let prefix = route.prefix || this._options.prefix
        route.mountPath = Path.join('/', prefix, route.path)
        route.id = Util.getRouteId(route)
        Validation.validateRouteIsUnique(route, this._routes)
        let { pre, post } = Util.getExtensions(this._options.extensions, route)

        let stack = [
          (req, res, next) => {

            res.locals.route = route
            return next()
          },
          ...pre,
          route.validation.params ? RequestValidation.validateParams(route.validation.params) : null,
          route.validation.query ? RequestValidation.validateQuery(route.validation.query) : null,
          route.validation.body ? RequestValidation.validateBody(route.validation.body) : null,
          route.handle.length === 3 ? route.handle : route.handle(state),
          ...post
        ].filter(mw => mw)

        this._app[route.method.toLowerCase()](route.mountPath, stack)
        this._routes.push(route)
        return route
      })
  }
}

Apone.AponeValidationError = Errors.AponeValidationError

module.exports = Apone
