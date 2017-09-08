'use strict'

module.exports = {
  // dont let /blah/:id register before /blah/tada because express cant tell the difference and thinks 'tada' IS THE /:id
  sortRoutes: (a, b) => {

    let aPaths
    if (a.path.indexOf('/:') > -1) {
      aPaths = a.path.split('/')
    }

    let bPaths
    if (b.path.indexOf('/:') > -1) {
      bPaths = b.path.split('/')
    }

    if (aPaths && b.path.indexOf(aPaths[0]) > -1) {
      return 1
    }

    if (bPaths && a.path.indexOf(bPaths[0]) > -1) {
      return -1
    }
    return 0
  },
  getRouteId: (route) => {

    return `${route.method}:${route.mountPath}`.replace(/:/g, '').replace(/^\/|\/$/g, '').replace(/\//g, '_')
  },
  getExtensions: (extensions, route) => {

    let middleware = {
      pre: [],
      post: []
    }

    let routeExtensions = Object.getOwnPropertyNames(route)
      .filter(r => r !== 'handle' && r !== 'validation' && r !== 'path' && r !== 'method' && r !== 'prefix' && r !== 'metadata' && r !== 'id' && r !== 'mountPath')

    routeExtensions.forEach(name => {

      let ext = extensions.find(i => i.name === name)
      let routeExtensionValue = route[name]
      let fn = ext.factoryFunc(routeExtensionValue)
      middleware[ext.type].push(fn)
    })

    return middleware
  }
}
