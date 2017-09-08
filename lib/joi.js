'use strict'

const Joi = require('joi')

module.exports = Joi.extend([{
  name: 'string',
  base: Joi.string(),
  language: {
    httpMethod: 'requires a case insensitive http method (get, post, put, patch, delete)'
  },
  rules: [{
    name: 'httpMethod',
    validate(params, value, state, options) {

      let method = value.toUpperCase()
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].find(m => m === method)) {
        return this.createError('string.httpMethod', { v: value }, state, options)
      }

      return method
    }
  }]
}])
