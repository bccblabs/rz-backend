'use strict'
var aws = require ('aws-sdk')
  , shortid = require ('shortid')
  , async = require ('async')
  , rootPath = '/Users/bski/Dev/microservices/social/posts/'
  , thumbnailPath = '/Users/bski/Desktop/'
  , s3BucketUrl = 'https://s3.amazonaws.com/tunesquad/'
  , s3BucketName = 'tunesquad'
  , sizeOf = require ('image-size')
  , Upload = require('s3-uploader')
  , accessKeyId = 'AKIAIYR6P6AQEO3NW2LQ'
  , secretAccessKey = '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'
  , _ = require ('lodash')
  , s3Client = new Upload (s3BucketName, {
      aws: {
        acl: 'public-read',
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      },
      cleanup: {
        versions: true,
        original: false
      },
      original: {
        awsImageAcl: 'public-read'
      },
      versions: [
        {
          suffix: '-medium',
          maxWidth: 320,
        },
        {
          suffix: '-thumb',
          maxWidth: 100,
        },
      ]
    })

var pushToS3 = function (filePath, callback) {

  s3Client.upload (filePath, {}, function (err, versions, meta) {
    if (err) {
      console.error ('[S3Utils.pushToS3] Error')
      callback (err)
    } else {
      var res = []
      versions.forEach ((version)=>{
        if (version.url.indexOf ('medium') > -1) {
          res.push ({format: 'medium', url: version.url})
        }
        else if (version.url.indexOf ('thumb') > -1) {
          res.push ({format: 'thumb', url: version.url})
        }
        else {
          res.push ({format: 'original', url: version.url})
        }
      })
      callback (null, res)
    }
  })
}

var batchPushToS3 = function (filePaths, callback) {
  if (!filePaths) {
    console.log ('[S3Utils.batchPushToS3] imageLinks null')
    callback (null)
  } else {
    async.mapLimit (filePaths,2, pushToS3, function (err, res) {
      if (err) {
        console.error ('[S3Utils.batchPushToS3] error', err)
        callback (err)
      } else {
        var res = _.chain (res)
        .flatten()
        .groupBy ('format')
        .mapValues ((array)=>{
          return array.map ((elem)=>{return elem.url})
        })
        .value()
        callback (null, res)
      }
    })
  }
}

exports.pushToS3 = module.exports.pushToS3 = pushToS3
exports.batchPushToS3 = module.exports.batchPushToS3 = batchPushToS3
