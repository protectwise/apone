'use strict'

const Joi = require('./joi')
const Errors = require('./errors')

const internals = {
  schemas: {
    extensionFunctionReturnValue: Joi.alternatives().try([
      Joi.func().minArity(3).maxArity(4).required(),
      Joi.array().items(Joi.func().minArity(3).maxArity(4)).required()
    ]).required(),
    route: {
      path: Joi.string().required(),
      method: Joi.string().httpMethod().required(),
      handle: Joi.alternatives().try([
        Joi.func().arity(0),
        Joi.func().arity(1),
        Joi.func().arity(3)]).required()
        .error(() => 'handle is required. must have arity of 0, 1, or 3'),
      validation: Joi.object().keys({
        params: Joi.object().keys({
          validate: Joi.func().required()
        }).unknown(),
        body: Joi.object().keys({
          validate: Joi.func().required()
        }).unknown(),
        query: Joi.object().keys({
          validate: Joi.func().required()
        }).unknown()
      }).min(1).default({}),
      metadata: Joi.object().min(1).default({}),
      prefix: Joi.string().min(1).default('')
    },
    options: Joi.object().keys({
      prefix: Joi.string().min(1).default(''),
      extensions: Joi.array().items(Joi.object().keys({
        name: Joi.string().min(1).required(),
        type: Joi.string().valid('pre', 'post').default('pre'),
        factoryFunc: Joi.func().required()
      })).unique('name').default([]).error(errors => {

        return {
          template: 'contains the following errors [{{extensionErrors}}]',
          context: {
            extensionErrors: errors.map(e => `"${e.context.value.name || 'unnamedExtension'}": ${e.context.reason.map(inner => inner.toString()).join(', ')}`).join(', ')
          }
        }
      })
    })
  }
}

module.exports = {
  validateRouteIsUnique: (route, allRoutes) => {

    if (allRoutes.some(r => route.id === r.id)) {
      throw Errors.routeValidationError(route, new Error('route has already been registered'))
    }
  },
  validateOptions: (options) => {

    try {
      let result = Joi.attempt(options, internals.schemas.options)

      result.extensions.forEach(e => {

        let mw
        try {
          mw = e.factoryFunc()
        } catch (ex) /*istanbul ignore next*/ {
          throw Errors.aponeValidationError(new Error(`extension "${e.name || 'unnamedExtension'}" threw during registration: ${ex.message}`))
        }

        let result = Joi.validate(mw, internals.schemas.extensionFunctionReturnValue)
        if (result.error) {
          throw Errors.aponeValidationError(new Error('extension functions must return valid middleware when invoked: (req, res, next) or [(req, res, next)]'))
        }
      })
      return result
    }
    catch (err) {
      throw Errors.aponeValidationError(err, 'Invalid constructor options')
    }
  },
  createValidateRoutes: (extensions) => {

    let routeKeys = Object.assign({}, internals.schemas.route)
    extensions.forEach(e => {

      routeKeys[e.name] = Joi.any()
    })

    let routeSchema = Joi.object().keys(routeKeys)
    let routesSchema = Joi.array().min(1).single(true).required()

    return (routes) => {

      routes = Joi.attempt(routes, routesSchema)

      routes = routes.map(r => {

        let result = routeSchema.validate(r)
        if (result.error) {

          throw Errors.routeValidationError(r, result.error)
        }
        return result.value
      })

      return routes
    }
  },
}
