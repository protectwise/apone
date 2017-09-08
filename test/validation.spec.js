'use strict'
/* eslint no-unused-vars: 0 */

const T = require('tap')
const Joi = require('joi')
const Validation = require('../lib/validation')
const Errors = require('../lib/errors')

T.test('createValidateRoutes should return a function that can validate routes with extensions', test => {

  let extensions = [{ type: 'pre', factoryFunc: () => { }, name: 'blah' }]
  let validateRoutes = Validation.createValidateRoutes(extensions)
  let routes = [{ path: '/hi', method: 'get', handle: () => { }, blah: true }]
  let result = validateRoutes(routes)
  test.type(result, Array)
  test.type(result[0].validation, 'object')
  test.type(result[0].metadata, 'object')
  test.equal(result[0].path, '/hi')
  test.equal(result[0].method, 'GET')
  test.equal(result[0].blah, true)
  test.end()
})

T.test('createValidateRoutes should return a function that can validate routes', test => {

  let extensions = []
  let validateRoutes = Validation.createValidateRoutes(extensions)
  let routes = [{
    path: '/a',
    method: 'get',
    handle: () => { }
  }, {
    path: '/b',
    method: 'post',
    handle: (blah) => { }
  }, {
    path: '/c',
    method: 'put',
    handle: (req, res, next) => { }
  }, {
    path: '/d',
    prefix: '/pre',
    method: 'put',
    validation: {
      query: Joi.object().keys({
        abc: Joi.string()
      }),
      body: Joi.object().keys({
        hi: Joi.number()
      }),
      params: Joi.object().keys({
        bye: Joi.any()
      })
    },
    handle: (req, res, next) => { },
    metadata: {
      note: 'route 1'
    }
  }]
  validateRoutes(routes)
  test.end()
})

T.test('validateRoutes function should not allow extra keys unless specified in extensions', test => {

  let extensions = []
  let validateRoutes = Validation.createValidateRoutes(extensions)
  let routes = [{ path: '/hi', method: 'get', handle: () => { }, notExtension: true }]

  let throws = () => {

    validateRoutes(routes)
  }

  test.throws(throws, Errors.AponeValidationError)
  test.end()
})

T.test('validateRoutes should correctly invalidate routes', test => {

  let extensions = []
  let validateRoutes = Validation.createValidateRoutes(extensions)

  let invalids = [{}, {
    path: '/hi'
  }, {
    path: '/hi',
    method: 'borked'
  }, {
    path: '/hi',
    method: 'get'
  }, {
    path: '/hi',
    method: 'get',
    handle: 1
  }, {
    path: 'hi',
    method: 'get',
    handle: (one, two, three, four) => { }
  }, {
    path: 'hi',
    method: 'get',
    handle: () => { },
    validation: {}
  }, {
    path: 'hi',
    method: 'get',
    handle: () => { },
    metadata: {}
  }, {
    path: 'hi',
    method: 'get',
    handle: () => { },
    prefix: 1
  }, {
    path: 'hi',
    method: 'get',
    handle: () => { },
    randomKey: 1
  }]

  invalids.forEach(route => {

    let throws = () => {

      validateRoutes([route])
    }

    test.throws(throws, Errors.AponeValidationError)
  })

  test.end()
})

T.test('validateRouteIsUnique should work', test => {

  let allRoutes = [{ id: 1 }]
  let uniqueRoute = { id: 2 }
  Validation.validateRouteIsUnique(uniqueRoute, allRoutes)

  let throws = () => {

    Validation.validateRouteIsUnique({ id: 1 }, allRoutes)
  }

  test.throws(throws, Errors.AponeValidationError)
  test.end()
})

T.test('validateOptions should work for valid options', test => {

  let validExtension = {
    name: 'blah',
    type: 'post',
    factoryFunc: (id) => {

      return (req, res, next) => { }
    }
  }

  let validOptions = [{}, {
    prefix: '/api/v2'
  }, {
    extensions: [validExtension]
  }, {
    extensions: []
  }]

  validOptions.forEach(option => {

    let result = Validation.validateOptions(option)
    if (!option.prefix) {
      test.notOk(result.prefix)
    }
    test.type(result.extensions, Array)
  })
  test.end()
})

T.test('validateOptions should work for invalid options', test => {

  let invalidOptions = [
    { extensions: [{ name: 'returnsNothing', factoryFunc: (id) => { } }] },
    { extensions: [{ name: 'returnsInvalidValue', factoryFunc: (id) => 1 }] },
    { extensions: [{ name: 'returnsINvalidMiddleware', factoryFunc: (id) => (req, res) => { } }] },
    { extensions: [{ name: 'invalidType', type: 'hi', factoryFunc: (id) => (a, b, c) => { } }] },
    { extensions: [{ type: 'hi', factoryFunc: (id) => (a, b, c) => { } }] },
    { prefix: 1 },
    { extensions: {} },
    { extensions: [{ name: 'dupe', type: 'pre', factoryFunc: (id) => (a, b, c) => { } }, { name: 'dupe', type: 'pre', factoryFunc: (id) => (a, b, c) => { } }] },
  ]

  invalidOptions.forEach(options => {

    let throws = () => {

      Validation.validateOptions(options)
    }
    test.throws(throws, Error)
  })

  test.end()
})

T.test('validateOptions should return informative message if the extension throws during validation', test => {

  let validExtension = {
    name: 'blah',
    type: 'post',
    factoryFunc: (id) => {

      throw new Error('something happened')
    }
  }

  let validOptions = {
    extensions: [validExtension]
  }

  let throws = () => {

    let result = Validation.validateOptions(validOptions)
  }
  test.throws(throws, Errors.AponeValidationError, 'extension "blah" threw during registration: something happened')
  test.end()
})
