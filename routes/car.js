var URL = require('url')
  , request = require ('request-promise')
  , errors = require('../models/errors')
  , Car = require('../models/car')
  , async = require ('async')
  , CarCategory = require ('../models/CarCategory')

function getUrl(object) {
  return '/cars/' + encodeURIComponent(object.make) + '/model' + encodeURIComponent(object.model) + '/submodel' + encodeURIComponent (object.submodel);
}

exports.create = function (req, res, next) {
  Car.createAndPatch (req.body.data, function (createCarError, newCar) {
    if (createCarError) return next (createCarError)
    else res.status(201).end()
  })
}

exports.getMakes = function (req, res, next) {
  Car.getMakes (function (getMakesError, makes) {
    if (getMakesError) return next (getMakesError)
    else res.status(200).json ({data: makes})
  })
}

exports.getModels = function (req, res, next) {
  Car.getModels (req.params, function (getModelsError, models) {
    if (getModelsError) return next (getModelsError)
    else res.status(200).json ({data: models})
  })
}

exports.getSubmodels = function (req, res, next) {
  Car.getSubmodels (req.params, function (getSubmodelsError, submodels) {
    if (getSubmodelsError) return next (getSubmodelsError)
    else res.status(200).json ({data: submodels})
  })
}

exports.getSpecs = function (req, res, next) {
  Car.getSpecs (req.params, function (getCarError, car) {
    if (getCarError) return next (getCarError)
    else res.status(200).json({data: car})
  })
}

exports.getSpecsDetails = function (req, res, next) {
  var specsTask = function (callback) {
    Car.getSpecsDetails (req.params, function (getCarError, car) {
      if (getCarError) return callback (getCarError)
      else callback (null, car)
    })
  }

  var tuningTask = function (callback) {
    Car.getPartsList (req.params, function (partsErr, parts) {
      if (partsErr) return callback (partsErr)
      else callback (null, parts)
    })
  }

  async.parallel ([specsTask, tuningTask], function (err, data) {
    if (err) return next (err)
    else res.status (200).json ({data: [Object.assign ({}, data[0], {tuning: data[1]})]})
  })

}

exports.update = function (req, res, next) {
  Car.get (req.params, function (getCarError, car) {
    if (getCarError) return next (getCarError)
    else {
      car.update (req.params, function (updateCarError, updatedCar) {
        if (updateCarError) return next (updateCarError)
        else res.status(204).json(updatedCar)
      })
    }
  })
}

exports.delete = function (req, res, next) {
  Car.get (req.params, function (getCarError, car) {
    if (getCarError) return next (getCarError)
    else {
      car.delete (function (deleteCarError) {
        if (deleteCarError) return next (deleteCarError)
        else res.status(204).end()
      })
    }
  })
}

exports.searchSubmodels = function (req, res, next) {
  Car.searchSubmodels (req.body.data, function (searchSubmodelError, results) {
    if (searchSubmodelError) return next (searchSubmodelError)
    else res.status(201).json (results)
  })
}

exports.createComment = function (req, res, next) {
  Car.createComment (req.params, req.body.data, function (createCommentError) {
    if (createComment) return next (createCommentError)
    else res.status (201).end()
  })
}

exports.deleteComment = function (req, res, next) {
  Car.deleteComment (req.params.comment_id, function (deleteCommentError) {
    if (deleteCommentError) return next (deleteCommentError)
    else res.status (201).end()
  })

}


exports.createCategories = (req, res, next) => {
  var categoryObj = req.body
  s3util.batchPushToS3 (categoryObj.media, function (err, s3links) {
    var props = {
      name: categoryObj.category,
      tag: categoryObj.tag,
      media: s3links[0],
    }
    CarCategory.create (props, function (err, result) {
      if (err) next (err)
      else res.status(201).end()
    })
  })
}

exports.listCategories = (req, res, next) => {
  CarCategory.list (function (err, data) {
    if (err) next (err)
    else res.status (200).json (data)
  })
}
