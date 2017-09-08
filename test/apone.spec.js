'use strict'

const T = require('tap')
const Apone = require('../lib')
const Express = require('express')

T.test('register', test => {

  let app = Express()
  let apone = new Apone(app)

  let route = {
    path: '/doggos',
    method: 'GET',
    handle: (req, res, next) => {

      res.send('ok')
      return next()
    }
  }

  apone.register(route)
  test.ok(apone.routes, 'registration worked without state')
  test.end()
})
