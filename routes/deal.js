'use strict'
var s3util = require ('../util/s3')
  , Deal = require ('../models/deal')
  , shortid = require ('shortid')

exports.create = function (req, res, next) {
  var dealObject = req.body
  s3util.batchPushToS3 (dealObject.media, function (err, s3links) {
    if (err) next (err)
    else {
      var props = {
        dealId: shortid.generate(),
        title: dealObject.title,
        description: dealObject.description,
        images: s3links,
        created: Date.now()
      }
      Deal.create (props, function (err, result) {
        if (err) next (err)
        else {
          res.status (201).end()
        }
      })
    }
  })
}

exports.linkCars = function (req, res, next) {
  var dealId = req.params.dealId
    , props = {
        dealId: dealId,
        make: req.body.make,
        model: req.body.model,
        submodel: req.body.submodel,
        years: req.body.years
      }
  Deal.updateBySubmodelYear (props, function (err, record) {
    if (err) next (err)
    else {
      res.status (201).end()
    }
  })
}

exports.update = function (req, res, next) {

}

// main tuning page
exports.list = function (req, res, next) {
  var pageNum = req.query.pageNum,
      pageSize = req.query.pageSize

  Deal.list (pageNum, pageSize, function (err, records) {
    if (err) next (err)
    else {
      res.status (200).json (records)
    }
  })
}

exports.get = function (req, res, next) {
  var dealId = req.params.dealId
  Deal.get (dealId, function (err, deal) {
    if (err) next (err)
    else res.status (200).json (deal)
  })
}

exports.delete = function (req, res, next) {
  next()
}
