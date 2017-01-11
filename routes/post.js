'use strict'
var s3util = require ('../util/s3')
  , Post = require ('../models/post')
  , shortid = require ('shortid')
  , PAGESIZE = require ('../constants').pageSize



exports.batchCreate = function (req, res, next) {
  var postObject = req.body
  s3util.batchPushToS3 (postObject.media, function (err, s3links) {
    if (err) next (err)
    else {
      var props = {
        postProps: {
          created: Date.now(),
          media: s3links,
          postId: shortid.generate(),
          tags: postObject.tags,
          title: postObject.title,
          text: postObject.text,
        },
        authorProps: {
          user_id: 'rkeKaSA3O',
          name: 'Raaz',
          created: Date.now(),
          picture: 'https://s3.amazonaws.com/raaz-user-images/gaoqiaoliangjie.jpg'
        }
      }
      Post.batchCreate (props, function (err, result) {
        if (err) next (err)
        else {
          res.status (201).end()
        }
      })
    }
  })
}

exports.get = function (req, res, next) {
  var postId = req.params.postId
    , props = {
      postId: postId
    }
  Post.get (props, function (err, result) {
    if (err) next (err)
    else res.status(200).json (result)
  })
}

exports.getComments = function (req, res, next) {

}

exports.list = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , params = {pageNum, pageSize}

  Post.list (params, function (err, data) {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listByUser = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , userId = req.params.userId
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , params = {pageNum, pageSize, userId}

  Post.listByUser (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listByBuild = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , buildId = req.params.buildId
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , params = {pageNum, pageSize, buildId}

  Post.listByBuild (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listByPart = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , partId = req.params.partId
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , params = {pageNum, pageSize, partId}

  Post.listByPart (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.listBySpecs = function (req, res, next) {
  var pageNum = req.query.pageNum?req.query.pageNum:0
    , specId = req.params.specId
    , pageSize = req.query.pageSize?req.query.pageSize:PAGESIZE
    , params = {pageNum, pageSize, specId}

  Post.listBySpecs (params, (err, data) => {
    if (err) next (err)
    else res.status (200).json (data)
  })
}

exports.create = function (req, res, next) {
  var params = {
    userId_: req.body.userId,
    buildId_: req.body.buildId ? req.body.buildId : shortid.generate(),
    buildProps: req.body.buildId ? req.body.buildSpecs : Object.assign (req.body.buildSpecs, {media: [req.body.location], name: req.body.newBuild.name, specId: req.body.buildSpecs.specId}),

    postProps: {media: req.body.location, text: req.body.text, postId: shortid.generate(), created: Date.now(), mediaType: req.body.mediaType},
    relProps: {postType: 'build_log'},
    partIds: req.body.partIds,
  }

  Post.create (params, (err, data) => {
    if (err) next (err)
    else res.status (201).json({msg: 'post created!'})
  })
}


exports.update = function (req, res, next) {
  next()
}
exports.delete = function (req, res, next) {
  next()
}

exports.search = function (req, res, next) {
  next()
}
exports.createComment = function (req, res, next) {
  next()
}
exports.deleteComment = function (req, res, next) {
  next()
}
