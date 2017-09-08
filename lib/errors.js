'use strict'

class AponeValidationError extends Error {

  constructor(...args) {

    super(...args)
    this.name = 'AponeValidationError'
  }
}

module.exports = {
  AponeValidationError,
  aponeValidationError: (err, pre) => {

    let details = err && err.details ? err.details.map(d => d.message).join(', ') : err.message
    let message = pre ? `${pre} - ${details}` : details
    return new AponeValidationError(message)
  },
  routeValidationError: (route, err) => {

    let id = `${route.method || 'missingMethod'}:${route.mountPath || 'missingPath'}`
    let details = err && err.details ? err.details.map(d => d.message).join(', ') : err.message
    let message = `${id} - ${details}`
    let error = new AponeValidationError(message)
    error.id = id
    return error
  }
}
