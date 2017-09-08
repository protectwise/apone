'use strict'
/* eslint no-unused-vars: 0 */

const T = require('tap')
const Util = require('../lib/util')

T.test('sort routes should sort correctly', test => {

  let routes = [{ path: '/blah/:id'}, {path: '/blah/tada'}, {path: '/blah/:id/whatever'}]
  let sortedRoutes = routes.sort(Util.sortRoutes)
  test.equal(sortedRoutes[0].path, '/blah/tada')
  test.equal(sortedRoutes[1].path, '/blah/:id/whatever')
  test.equal(sortedRoutes[2].path, '/blah/:id')
  test.end()
})

T.test('getRouteId should work', test => {

  let route = { mountPath: '/bagels', method: 'GET' }
  let id = Util.getRouteId(route)
  test.equal(id, 'GET_bagels')
  test.end()
})

T.test('getExtensions should return extensions specified on a route', test => {

  let route = { path: '/doggos', method: 'GET', handle: () => {}, wickedExtension: 1, wewExtension: 2 }

  // getExtensions assumes valid extensions and routes
  let unusedExtension = { name: 'unusedExtension', type: 'pre', factoryFunc: (id) => (hi) => {} }
  let wickedExtension = { name: 'wickedExtension', type: 'pre', factoryFunc: (id) => (one, two) => {} }
  let wewExtension = { name: 'wewExtension', type: 'post', factoryFunc: (id) => (one, two, three) => {} }

  let { pre, post } = Util.getExtensions([unusedExtension, wickedExtension, wewExtension], route)

  test.equal(pre.length, 1, 'pre should be an array with one item')
  test.type(pre[0], 'function', 'pre should contain one function')
  test.equal(pre[0].length, 2, 'first function in pre should be the return value of the extension function')

  test.equal(post.length, 1, 'post should be an array with one item')
  test.type(post[0], 'function', 'post should contain one function')
  test.equal(post[0].length, 3, 'first function in post should be the return value of the extension function')

  test.end()
})
