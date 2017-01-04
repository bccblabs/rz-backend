var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , shortid = require ('shortid')


var Manufacturer = module.exports = function Manufacturer(_node) {
  this._node = _node
}

Manufacturer.list = function (callback) {
	var query = 'match (m:Manufacturer) return distinct m'
		, session = driver.session ()

	session.run (query).then (function (res) {
		var matches = util.parseManufacturers (res)
		callback (null, Object.assign ({}, {data: matches}))
	}).catch (function (err) {
		console.error (err)
		callback (err)
	})
}

Manufacturer.get = function (callback) {
	var query = 'match (m:Manufacturer) return distinct m'
		, session = driver.session ()

	session.run (query).then (function (res) {
		var matches = util.parseManufacturers (res)
		callback (null, Object.assign ({}, {data: matches}))
	}).catch (function (err) {
		console.error (err)
		callback (err)
	})
}