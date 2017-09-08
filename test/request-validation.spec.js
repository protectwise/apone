'use strict'

const T = require('tap')
const Joi = require('joi')
const Validation = require('../lib/request-validation')

T.test('it should return a function that can validate body', test => {

  var schema = Joi.object().keys({
    prop: Joi.string().alphanum().required()
  })

  let validate = Validation.validateBody(schema)
  test.type(validate, 'function', 'it should return a function')
  let req = { body: { prop: 'abc123' } }
  validate(req, { locals: {} }, (err) => {

    test.notOk(err, 'should not return an error')
    test.end()
  })
})

T.test('should invalidate bodies', test => {

  var schema = Joi.object().keys({
    prop: Joi.string().alphanum().required()
  })

  let validate = Validation.validateBody(schema)
  let req = { body: { prop: 123 } }

  validate(req, { locals: {} }, (err) => {

    test.type(err, Error, 'should return an error')
    test.end()
  })
})

T.test('should return a function that can validate params', test => {

  var schema = Joi.object().keys({
    myParam: Joi.date().iso().required()
  })

  let validate = Validation.validateParams(schema)
  let req = { params: { myParam: '2016-02-19T12:22:03Z' } }
  validate(req, { locals: {} }, (err) => {

    test.notOk(err, 'should not return an error')
    test.end()
  })
})

T.test('should invalidate params', test => {

  var schema = Joi.object().keys({
    myParam: Joi.date().iso().required()
  })

  let validate = Validation.validateParams(schema)
  let req = { params: { myParam: 123 } }
  validate(req, { locals: {} }, (err) => {

    test.type(err, Error, 'should return an error')
    test.end()
  })
})

T.test('should return a function that can validate queries', test => {

  var schema = Joi.object().keys({
    myArg: Joi.number().integer().required()
  })


  let validate = Validation.validateQuery(schema)
  let req = { query: { myArg: 441 } }
  validate(req, { locals: {} }, (err) => {

    test.notOk(err, 'should not return an error')
    test.end()
  })
})

T.test('should invalidate queries', test => {

  var schema = Joi.object().keys({
    myArg: Joi.number().integer().required()
  })

  let validate = Validation.validateQuery(schema)
  let req = { query: { myArg: 123.4 } }
  validate(req, { locals: {} }, (err) => {

    test.type(err, Error, 'should return an error')
    test.end()
  })
})
