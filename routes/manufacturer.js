'use strict'

var URL = require('url')
  , request = require ('request-promise')
  , errors = require('../models/errors')
  , Manufacturer = require('../models/manufacturer')
  , shortid = require ('shortid')
  , PAGESIZE = require ('../constants').pageSize
  , _ = require ('lodash')


exports.list = function (req, res, next) {
	Manufacturer.list (function (err, manufacturers) {
		if (err) next (err)
		else res.status (200).json (manufacturers)
	})
}

exports.get = function (req, res, next) {
	Manufacturer.list (function (err, manufacturers) {
		if (err) next (err)
		else res.status (200).json (manufacturers)
	})

}