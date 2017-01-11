'use strict'

var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , objectAssign = require ('object-assign')

var Post = module.exports = function Post (_node) {
  this._node = _node
}

Post.batchCreate = function (props, callback) {
  var query = [
        'match (u:User {user_id: {authorProps}.user_id})',
        'with (u)',
        'merge (u)-[:has_post]-(p:Post {postId: {postProps}.postId})',
        'on create set p={postProps}',
        'with p',
        'unwind {tags} as rawtag',
        'merge (t:Tag {name: rawtag})',
        'with (t)',
        'merge (t)-[:has_tag]-(p)',
      ].join ('\n')
    , params = {
      postProps: {
        created: props.postProps.created,
        original: props.postProps.media.original,
        medium: props.postProps.media.medium,
        thumb: props.postProps.media.thumb,
        postId: props.postProps.postId,
        title: props.postProps.title,
        text: props.postProps.text,
      },
      tags: props.postProps.tags,
      authorProps: {
        user_id: props.authorProps.user_id,
        name: props.authorProps.name,
        created: props.authorProps.created,
        picture: props.authorProps.picture,
      }
    }
  , session = driver.session ()

  session.run (query, params)
         .then (function (record) {
           callback (null)
         })
         .catch (function (err) {
           console.error (err)
           callback (err)
         })
}

Post.get = function (props, callback) {
  var query = [
        'match (p:Post {postId: {postId}})',
        'optional match (p)-[:has_tag]-(t:Tag)',
        'optional match (p)-[:has_post]-(u:User)',
        'optional match (p)-[:has_like]-(l)',
        'optional match (p)-[:has_comment]-(c)',
        'return p, collect(t.name), u, collect (l), count (c)'
      ].join ('\n')
    , params = {
        postId: props.postId
      }
    , session = driver.session()

  session.run (query, params)
         .then (function (record) {
           var match = {
             post: record.records[0]._fields[0].properties,
             tags: record.records[0]._fields[1],
             user: record.records[0]._fields[2].properties,
             likes: record.records[0]._fields[3],
             comments: record.records[0]._fields[4].high
           }
           callback (null, match)
         })
         .catch (function (err) {
           console.error (err)
           callback (err)
         })
}

Post.list = function (props, callback) {
  var query = [
        'match (p:Post)-[postRel:has_post]-(u:User) where postRel.postType in ["build_log", "new_build"]',
        'optional match (p)-[:has_tag]-(t:Tag)',
        'optional match (p)-[:has_post]-(build:Build)-[:has_build]-(s:Specs)',
        'optional match (p)-[:has_post]-(part:Part)',
        'optional match (p)-[:has_like]-(l)',
        'optional match (p)-[:has_comment]-(c)',
        'return p, collect(t.name), u, collect (l), count (c), postRel.postType, build, collect(part), s.specId',
        'order by p.created desc',
        'skip {skipCount}',
        'limit {pageSize}'
      ].join ('\n')
    , params = {
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parsePosts (res)
                , nextPageUrl = (matches.length >= props.pageSize)?'?pageNum=' + (parseInt (props.pageNum) + 1):null
                , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Post.listByUser = (props, callback) => {
  var query = [
    'match (u:User {user_id: {userId}})-[:has_post]-(p:Post)',
    'optional match (p)-[:has_tag]-(t:Tag)',
    'optional match (p)-[postRel:has_post]-(u:User)',
    'optional match (p)-[:has_post]-(build:Build)-[:has_build]-(s:Specs)',
    'optional match (p)-[:has_post]-(part:Part)',
    'optional match (p)-[:has_like]-(l)',
    'optional match (p)-[:has_comment]-(c)',
    'return p, collect(t.name), u, collect (l), count (c), postRel.postType, build, collect(part), s.specId',
    'order by p.created desc',
    'skip {skipCount}',
    'limit {pageSize}'


    ].join ('\n')
    , params = {
      userId: props.userId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parsePosts (res)
                , nextPageUrl = (matches.length >= props.pageSize)?('?pageNum=' + (parseInt (props.pageNum) + 1)): null
                , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })

}

Post.listByBuild = (props, callback) => {
  var query = [
    'match (b:Build {buildId: {buildId}})-[:has_post]-(p:Post)',
    'optional match (p)-[:has_tag]-(t:Tag)',
    'optional match (p)-[postRel:has_post]-(u:User)',
    'optional match (p)-[:has_post]-(build:Build)-[:has_build]-(s:Specs)',
    'optional match (p)-[:has_post]-(part:Part)',
    'optional match (p)-[:has_like]-(l)',
    'optional match (p)-[:has_comment]-(c)',
    'return p, collect(t.name), u, collect (l), count (c), postRel.postType, build, collect(part), s.specId',
    'order by p.created desc',
    'skip {skipCount}',
    'limit {pageSize}'
    ].join ('\n')
    , params = {
      buildId: props.buildId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parsePosts (res)
                , nextPageUrl = (matches.length >= props.pageSize)?('?pageNum=' + (parseInt (props.pageNum) + 1)): null
                , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Post.listByPart = (props, callback) => {
  var query = [
    'match (p)-[:has_post]-(part:Part {partId: {partId_}})',
    'optional match (p)-[:has_tag]-(t:Tag)',
    'optional match (p)-[postRel:has_post]-(u:User)',
    'optional match (p)-[:has_post]-(build:Build)-[:has_build]-(s:Specs)',
    'optional match (p)-[:has_post]-(part:Part)',
    'optional match (p)-[:has_like]-(l)',
    'optional match (p)-[:has_comment]-(c)',
    'return p, collect(t.name), u, collect (l), count (c), postRel.postType, build, collect(part), s.specId',
    'order by p.created desc',
    'skip {skipCount}',
    'limit {pageSize}'
    ].join ('\n')
    , params = {
      partId_: props.partId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parsePosts (res)
                , nextPageUrl = (matches.length >= props.pageSize)?('?pageNum=' + (parseInt (props.pageNum) + 1)): null
                , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Post.listBySpecs = (props, callback) => {
    var query = [
    'match (s:Specs {specId: {specId_}})-[:has_build|:has_tuning]-(n)-[:has_post]-(p:Post)',
    // 'match (p)-[:has_post]-(part:Part {partId: {partId_}})',
    'optional match (p)-[:has_tag]-(t:Tag)',
    'optional match (p)-[postRel:has_post]-(u:User)',
    'optional match (p)-[:has_post]-(build:Build)-[:has_build]-(s:Specs)',
    'optional match (p)-[:has_post]-(part:Part)',
    'optional match (p)-[:has_like]-(l)',
    'optional match (p)-[:has_comment]-(c)',
    'return p, collect(t.name), u, collect (l), count (c), postRel.postType, build, collect(part), s.specId',
    'order by p.created desc',
    'skip {skipCount}',
    'limit {pageSize}'
    ].join ('\n')
    , params = {
      specId_: props.specId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parsePosts (res)
                , nextPageUrl = (matches.length >= props.pageSize)?('?pageNum=' + (parseInt (props.pageNum) + 1)): null
                , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Post.create = (props, callback) => {
  var query = [
    'match (author:User {user_id: {userId_}}), (s:Specs {specId: {buildProps}.specId})',
    'merge (s)-[:has_build]-(b:Build {buildId: {buildId_}})-[:has_build]-(author) set b += {buildProps}',
    'with author, b',
    'merge (author)-[r:has_post]-(p:Post {postId: {postProps}.postId})-[:has_post]-(b) set p={postProps}, r={relProps}',
    'with p, b',
    'unwind {partIds} as partid',
    'optional match (part:Part {partId: partid})',
    'with p, part, b',
    'merge (part)-[:has_post]-(p)',
    'merge (b)-[:has_part]-(part)'
  ].join ('\n')
  , session = driver.session ()

    session.run (query, props)
          .then ((res)=> {
            callback (null)
          })
          .catch (function (err) {
            console.error (err)
            callback (err)
  })
}

// new_build, build_journal, build_comment
Post.createBuildPost = (props, callback) => {
  var query = [
    'match (author:User {user_id: {authorId_}})',
    'match (b:Build {buildId: {buildId_}})',
    'with author, b',
    'merge (author)-[r:has_post]-(p:Post {postId: {postId_}})-[:has_post]-(b) set p={postProps}, r={relProps}',
    'with p',
    'unwind {tags} as rawtag',
    'merge (t:Tag {name: rawtag})', 
    'with t',
    'match (p:Post {postId: {postId_}}), (tag:Tag {name: t.name})',
    'with p, tag',
    'merge (tag)-[:has_tag]-(p)'
  ].join ('\n')

  , params = {
    authorId_: props.authorId,
    buildId_: props.buildId,
    postId_: props.postId,

    postProps: {
      created: props.created,
      postId: props.postId,
      media: props.media,
      mediaType: props.mediaType,
      text: props.text
    },
    tags: props.tags,
    relProps: {
      postType: props.postType,
    }
  }

  , session = driver.session ()

  session.run (query, params)
        . then (function (res) {
            callback (null)
        })
        .catch (function (err) {
            console.error (err)
            callback (err)
        })
}

