'use strict'

module.exports = {
  validateBody: (schema) => {

    return function (req, res, next) {

      let result = schema.validate(req.body, { context: { body: req.body, params: req.params, query: req.query } })
      if (!result.error) {
        req.body = result.value
        return next()
      }

      return next(result.error)
    }
  },
  validateParams: (schema) => {

    return function (req, res, next) {

      let result = schema.validate(req.params, { context: { body: req.body, params: req.params, query: req.query } })
      if (!result.error) {
        req.params = result.value
        return next()
      }

      return next(result.error)
    }
  },
  validateQuery: (schema) => {

    return function (req, res, next) {

      let result = schema.validate(req.query, { context: { body: req.body, params: req.params, query: req.query } })
      if (!result.error) {
        req.query = result.value
        return next()
      }
      return next(result.error)
    }
  }
}
