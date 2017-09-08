'use strict'
/* eslint no-unused-vars: 0 */

const Apone = require('../lib')
const Joi = require('joi')
const Express = require('express')
const Http = require('http')
const BodyParser = require('body-parser')
const T = require('tap')
const Got = require('got')

let internals = {
  extensions: [{
    name: 'trace',
    factoryFunc: () => {

      return (req, res, next) => {

        res.locals.trace = res.locals.route.id
        return next()
      }
    },
  }, {
    name: 'checkTrace',
    type: 'post',
    factoryFunc: () => {

      return (req, res, next) => {

        if (res.locals.trace === res.locals.route.id) {
          return next()
        }
        return next(new Error('checkTrace failed'))
      }
    }
  }]
}

T.test('it should work', test => {

  let app = Express()
  app.use(BodyParser.json({ limit: '1mb' }))
  app.use(BodyParser.urlencoded({ extended: true }))

  let routes = [{
    path: '/doggos',
    method: 'GET',
    trace: true,
    checkTrace: true,
    validation: {
      query: Joi.object().keys({
        type: Joi.string().valid('goodboye').required()
      })
    },
    handle: (req, res, next) => {

      res.send(req.query.type)
      return next()
    }
  }, {
    path: '/puppers',
    prefix: '/internal/v1',
    method: 'GET',
    metadata: {
      isPupper: true
    },
    handle: (state) => {

      return (req, res, next) => {

        if (res.locals.route.metadata.isPupper) {
          res.send(state.goodBoye)
          return next()
        }

        return next(new Error('isPupper check failed'))
      }
    }
  }, {
    path: '/payload/:id',
    method: 'post',
    validation: {
      body: Joi.object().keys({
        food: Joi.string().valid('hotdog').required()
      }),
      params: Joi.object().keys({
        id: Joi.number().integer().valid(1).required()
      })
    },
    handle: () => [
      (req, res, next) => {

        if (req.body.food === 'hotdog' && req.params.id === 1) {
          res.send('ok')
          return next()
        }
        return next(new Error('didnt work'))
      }
    ]
  }]

  test.ok(new Apone(app), 'should not explode if given no options')
  let apone = new Apone(app, { extensions: internals.extensions })
  let state = { goodBoye: 'yes he is' }
  let registeredRoutes = apone.register(routes, state)
  test.ok(registeredRoutes[0].id)
  test.ok(registeredRoutes[0].mountPath)
  test.equal(apone.routes.length, 3)

  app.use((err, req, res, next) => {

    res.send(err.message)
    return next()
  })

  let server = Http.createServer(app)

  server.listen(9000, () => {

    Promise.all([
      Got.get('http://localhost:9000/doggos?type=goodboye'),
      Got.get('http://localhost:9000/internal/v1/puppers'),
      Got.post('http://localhost:9000/payload/1', { body: { food: 'hotdog' } }),
      // test validation
      Got.post('http://localhost:9000/payload/hi', { body: { food: 'hotdog' } }),
      Got.post('http://localhost:9000/payload/1', { body: { notRight: 1 } }),
      Got.get('http://localhost:9000/doggos?type=notGoodBoye'),
    ])
      .then(results => {

        test.equal(results[0].statusCode, 200)
        test.equal(results[0].body, 'goodboye')

        test.equal(results[1].statusCode, 200)
        test.equal(results[1].body, 'yes he is')

        test.equal(results[2].statusCode, 200)
        test.equal(results[2].body, 'ok')

        // failure case, using 200 status code so promise.all doesnt throw
        test.equal(results[3].statusCode, 200)
        test.equal(results[3].body, 'child "id" fails because ["id" must be a number]')

        test.equal(results[4].statusCode, 200)
        test.equal(results[4].body, 'child "food" fails because ["food" is required]')

        test.equal(results[5].statusCode, 200)
        test.equal(results[5].body, 'child "type" fails because ["type" must be one of [goodboye]]')

        server.close(() => {

          test.end()
        })
      })
      .catch(err => {

        test.notOk(err, 'should not error')
        test.end()
      })
  })
})
