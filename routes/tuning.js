'use strict'

var s3util = require ('../util/s3')
  , shortid = require ('shortid')
  , Tuning = require ('../models/tuning')
  , TuningCategory = require ('../models/TuningCategory')

exports.create = function (req, res, next) {
  var partData = req.body

  s3util.batchPushToS3 (partData.media, function (err, s3links) {
    if (err) next (err)
    else {
      var props = {
        partId: partData.partId,
        specId: partData.specId,
        manufacturerId: partData.manufacturerId,
        partName: partData.name,
        partDescription: partData.description,
        partDetails: partData.details,
        medium: s3links.medium,
        original: s3links.original,
        thumb: s3links.thumb,

        specsProps: partData.specs,
        tags: partData.tags
      }
      Tuning.create (props, function (tuningCreateError) {
        if (tuningCreateError) return next (tuningCreateError)
        else return res.status (201).end()
      })
    }
  })
}
exports.get = function (req, res, next) {
  var params = {
    partId: req.params.partId,
    specId: req.query.specId
  }

  Tuning.get (params, function (tuningGetError, partData) {
    if (tuningGetError) return next (tuningGetError)
    else return res.status (200).json (partData)
  })
}
exports.update = function (req, res, next) {
  next()
}
exports.delete = function (req, res, next) {
  next()
}

exports.search = function (req, res, next) {
  var params = {
    specId: req.params.specId,
    tags: req.body.data
  }
  Tuning.search (params, function (tuningSearchError, tuningParts) {
    if (tuningSearchError) return next (tuningSearchError)
    else res.status (201).json (tuningParts)
  })
}
exports.searchByManufacturer = function (req, res, next) {
  var params = {
    specId: req.params.specId,
    name: req.query.category,
    manufacturerId: req.params.manufacturerId,
    tags: req.body.data
  }
  Tuning.searchByManufacturer (params, function (tuningSearchError, tuningParts) {
    if (tuningSearchError) return next (tuningSearchError)
    else res.status (201).json (tuningParts)
  })
}
exports.listPartsByManufacturer = function (req, res, next) {
  var params = {
    manufacturerId: req.params.manufacturerId
  }
  Tuning.listPartsByManufacturer (params, function (err, records) {
    if (err) return next (err)
    else res.status (200).json (records)
  })
}

exports.createComment = function (req, res, next) {
  next()
}
exports.deleteComment = function (req, res, next) {
  next()
}

exports.listCategories = function (req, res, next) {
  let params = {
    specId: req.query.specId
  }
  TuningCategory.list (params, (listCategoriesErr, categories)=> {
    if (listCategoriesErr) return next (listCategoriesErr)
    else res.status (201).json (categories)
  })
}
exports.createCategories = function (req, res, next) {
  var categoryObj = req.body
  s3util.batchPushToS3 (categoryObj.media, function (err, s3links) {
    var props = {
      name: categoryObj.category,
      tag: categoryObj.tag,
      medium: s3links.medium,
      original: s3links.original,
      thumb: s3links.thumb
    }
    TuningCategory.create (props, function (err, result) {
      if (err) next (err)
      else res.status(201).end()
    })
  })
}

exports.getTags = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , specId = req.params.specId
    , pageSize = 40
    , params = {pageNum, pageSize, specId}

  Tuning.getTags (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}


exports.listByTag = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , specId = req.params.specId
    , tag = req.params.tagName
    , pageSize = 10
    , params = {pageNum, pageSize, specId, tag}

  Tuning.listByTag (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listManufacturers = function (req, res, next) {
  var specId = req.params.specId
    , params = {specId}

  Tuning.listManufacturers (params, (err, data) => {
    if (err) next (err)
    else res.status(200).json (data)
  })
}

