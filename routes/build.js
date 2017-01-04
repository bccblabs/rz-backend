'use strict'

var URL = require('url')
  , request = require ('request-promise')
  , errors = require('../models/errors')
  , Build = require('../models/build')
  , Post = require ('../models/post')
  , s3util = require ('../util/s3')
  , shortid = require ('shortid')
  , PAGESIZE = require ('../constants').pageSize
  , _ = require ('lodash')

exports.create = function (req, res, next) {
  var buildId = shortid.generate()
    , props = {
      buildId: buildId,
      specId: req.body.specId,
      userId: req.body.userId,
      create: Date.now(),
      name: req.body.name,
      media: req.body.media,
      specs: req.body.specs,
    }

  Build.create (props, function (err, tags) {
    if (err) next (err)
    else {
      var postProps = {
        authorId: props.userId,
        buildId: props.buildId,
        postId: shortid.generate(),

        created: Date.now(),
        media: props.media[0],
        mediaType: props.media[0].split ('.').slice(-1)[0],
        postType: 'new_build',

        tags: _.uniq (tags.concat (req.body.tags)),
        text: req.body.text,
      }

      Post.createBuildPost (postProps, function (postErr, data) {
        if (postErr) next (postErr)
        else res.status(201).end()

      })
    }
  })
}

exports.addPart = function (req, res, next) {
  var buildId = req.params.buildId
    , partId = req.body.partId?req.body.partId:shortid.generate()
    , userId = req.body.userId

    var props = {
      buildId: buildId,
      partId: partId,
      userId: userId,

      partProps: {
        name: req.body.name,
        media: req.body.media,
        description: req.body.description,
        partId: partId,
      },
    }

    Build.addPart (props, function (err, tags) {
      if (err) next (err)
      else {
        var postProps = {
          authorId: props.userId,
          buildId: props.buildId,
          partId: props.partId,
          postId: shortid.generate(),

          created: Date.now(),
          media: props.media?props.media:null,
          mediaType: (props.media && props.media.length )?(props.media[0].split ('.').slice(-1)[0]):null,
          postType: 'build_log',

          tags: _.uniq (tags.concat (req.body.tags)),
          text: req.body.text,
        }

        Post.createPartPost (postProps, function (postErr, data) {
          if (postErr) next (postErr)
          else res.status (201).end ()
        })
      }
    })
}

exports.update =  function (req, res, next) {
  var buildId = req.params.buildId
}


exports.batchCreate = function (req, res, next) {
  var buildData = req.body
  s3util.batchPushToS3 (buildData.media, function (err, s3links) {
    if (err) next (err)
    else {
      var props = {
        buildId: shortid.generate(),
        specId: buildData.specId,
        dealer: buildData.dealer,
        medium: s3links.medium,
        options: buildData.options,
        original: s3links.original,
        listing: buildData.listing,
        name: buildData.name,
        thumb: s3links.thumb,
        partIds: buildData.partIds,
        ext_color: buildData.ext_color,
        int_color: buildData.int_color,
      }
      Build.createWithListing (props, function (err, result) {
        if (err) next(err)
        else {
          res.status(201).end()
        }
      })
    }
  })
}

exports.get = function (req, res, next) {
  var buildId = req.params.buildId
    , props = {
      buildId: buildId,
    }
  Build.get (props, function (err, result) {
    if (err) next (err)
    else res.status(200).json (result)
  })
}

exports.list = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE

  Build.list ({pageNum: pageNum, pageSize: pageSize}, function (err, data) {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listBySpecs = function (req, res, next) {
  var specId = req.params.specId
    , pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , props = {
      specId, pageNum, pageSize
    }
    Build.listBySpecs (props, function (err, data) {
      if (err) next (err)
      else res.status (200).json (data)
    })
}

exports.listByPart = function (req, res, next) {
  var partId = req.params.partId
    , pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , props = {
      partId, pageNum, pageSize
    }
    Build.listByPart (props, function (err, data) {
      if (err) next (err)
      else res.status (200).json (data)
    })
}

exports.listByUser = function (req, res, next) {
  var userId = req.params.userId
    , pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , props = {
      userId, pageNum, pageSize
    }
    Build.listByUser (props, function (err, data) {
      if (err) next (err)
      else res.status (200).json (data)
    })
}


exports.listByManufacturer = function (req, res, next) {
  var manufacturerId = req.params.manufacturerId
    , pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , props = {
      manufacturerId, pageNum, pageSize
    }
    Build.listByManufacturer (props, function (err, data) {
      if (err) next (err)
      else res.status (200).json (data)
    })
}

exports.listBuildPart = function (req, res, next) {
  var buildId = req.params.buildId
    , partTag = req.params.category
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , props = {
      buildId, partTag, pageSize
    }
    Build.listBuildPart (props, (err, data) => {
      if (err) next (err)
      else res.status (200).json (data)
    })
}



