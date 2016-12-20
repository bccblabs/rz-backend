  // var neo4j = require('neo4j-driver').v1
  // , driver = neo4j.driver("bolt://0.0.0.0", neo4j.auth.basic("neo4j", "test"))
var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , shortid = require ('shortid')

var Build = module.exports = function Build(_node) {
  this._node = _node
}

Build.create = function (props, callback) {
  var query = [
    'match (s:Specs {specId: {specId_}}), (u:User {user_id: {userId_}})',
    'with s, u',
    'merge (s)-[:has_build]-(b:Build {buildId: {buildId_}})-[:has_build]-(u) set b={buildProps}',
    'with s',
    'match (s)-[:has_tag]-(t:Tag)',
    'return collect (distinct t.name)'
  ].join ('\n')

  , params = {
    buildId_: props.buildId,
    specId_: props.specId,
    userId_: props.userId,
    buildProps: _.extend (props.specs, 
      {
        created: props.created,
        name: props.name,
        media: props.media,
        buildId: props.buildId,
      }
    )
  }
  , session = driver.session ()
   session.run (query, params)
           .then (function (record) {
              var tags = record.records[0]._fields[0]
              callback (null, tags)
           })
           .catch (function (err) {
              callback (err)
           })
}

Build.addPart = function (props, callback) {
  var query = [
        'merge (p:Part {partId: {partId_}}) on create set p={partProps}',
        'with p',
        'match (b:Build {buildId: {buildId_}})',
        'with b, p',
        'merge (b)-[:has_part]-(p)',
        'with p',
        'match (p)-[:has_tag]-(t:Tag)',
        'return collect(distinct t.name)'
      ].join ('\n')
      , params = {
        buildId_ : props.buildId,
        partId_: props.partId,
        partProps: props.partProps,
      }
      , session = driver.session ()
       session.run (query, params)
               .then (function (record) {
                  var tags = record.records[0]._fields[0]
                  callback (null, tags)
               })
               .catch (function (err) {
                  callback (err)
               })

}

Build.createWithListing = function (props, callback) {
  var query = [
    'match (s:Specs {specId: {specId}})',
    'with (s)',
    'merge (s)-[:has_build]-(b:Build {buildId: {buildId}}) set b={buildProps}',
    'merge (d:Dealer {name: {dealerProps}.name})',
    'on create set d={dealerProps}',
    'merge (b)-[l:has_listing]-(d) set l={listingProps}',
    'merge (b)-[:has_ext_color]-(ec:Color {name: {buildProps}.ext_color})',
    'merge (b)-[:has_int_color]-(ic:Color {name: {buildProps}.int_color})',
    'with (b)',
    'unwind {partIds} as partId_',
    'match (part:Part {partId: partId_})',
    'merge (part)-[:has_part]-(b)'
  ].join ('\n')
  , params = {
    buildId: props.buildId,
    partIds: props.partIds,
    specId: props.specId,
    buildProps: {
      buildId: props.buildId,
      created: Date.now(),
      medium: props.medium,
      original: props.original,
      thumb: props.thumb,
      ext_color: props.ext_color,
      int_color: props.int_color,
      name: props.name
    },
    listingProps: props.listing,
    dealerProps: Object.assign({}, props.dealer, {dealerId: shortid.generate()})
  }
  , session = driver.session()

  session.run (query, params)
         .then (function (record) {
           callback (null, record)
         })
         .catch (function (err) {
           callback (err)
         })
}

Build.list = function (props, callback) {
    var query = [
          'match (b:Build)',
          'optional match (b)-[:has_build]-(s:Specs)',
          'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
          'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
          'optional match (b)-[:has_like]-(like)',
          'optional match (b)-[:has_comment]-(c)',
          'optional match (b)-[:has_build]-(u:User)',
          'return b, collect(distinct m), collect (t), collect (like), count (c), u, s.specId',
          'skip {skipCount}',
          'limit {pageSize}',
        ].join ('\n')
      , params = {
        skipCount: props.pageNum * props.pageSize,
        pageSize: props.pageSize
      }
      , session = driver.session()

      session.run (query, params)
             .then (function (res) {
                var matches = util.parseBuilds (res)
                  , nextPageUrl = (matches.length < props.pageSize)?null:('?pageNum=' + (parseInt (props.pageNum) + 1))
                  , result = {}
                if (matches.length > 0) {
                  result = Object.assign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
                }
                callback (null, result)
             })
             .catch (function (err) {
               console.error (err)
               callback (err)
             })
}

Build.listBySpecs = function (props, callback) {
  var query = [
        'match (sp:Specs {specId: {specId}})-[:has_build]-(b:Build)',
        'with b, sp',
        'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
        'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
        'optional match (b)-[:has_like]-(like)',
        'optional match (b)-[:has_comment]-(c)',
        'optional match (b)-[:has_build]-(u:User)',
        'return b, collect(distinct m), collect (t), collect (like), count (c), u, sp.specId',
        'skip {skipCount}',
        'limit {pageSize}',
      ].join ('\n')
    , params = {
      specId: props.specId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parseBuilds (res)
                , nextPageUrl = matches.length < props.pageSize ?null:'?pageNum=' + (parseInt (props.pageNum) + 1)
                , result = Object.assign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Build.listByManufacturer = function (props, callback) {
  var query = [
        'match (mm:Manufacturer {manufacturerId:{manufacturerId_}})-[:manufacture]-(p:Part)-[:has_part]-(b:Build)',
        'with b',
        'optional match (b)-[:has_build]-(s:Specs)',
        'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
        'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
        'optional match (b)-[:has_like]-(like)',
        'optional match (b)-[:has_comment]-(c)',
        'optional match (b)-[:has_build]-(u:User)',
        'return b, collect(distinct m), collect (distinct t), collect (like), count (c), u, s.specId',
        'skip {skipCount}',
        'limit {pageSize}',
      ].join ('\n')
    , params = {
      manufacturerId_: props.manufacturerId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parseBuilds (res)
                , nextPageUrl = matches.length < props.pageSize ?null:'?pageNum=' + (parseInt (props.pageNum) + 1)
                , result = Object.assign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })}

Build.listByPart = function (props, callback) {
  var query = [
        'match (:Part {partId: {partId}})-[:has_part]-(b:Build)',
        'with b',
        'optional match (b)-[:has_build]-(s:Specs)',
        'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
        'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
        'optional match (b)-[:has_like]-(like)',
        'optional match (b)-[:has_comment]-(c)',
        'optional match (b)-[:has_build]-(u:User)',
        'return b, collect(distinct m), collect (t), collect (like), count (c), u, s.specId',
        'skip {skipCount}',
        'limit {pageSize}',
      ].join ('\n')
    , params = {
      partId: props.partId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var matches = util.parseBuilds (res)
                , nextPageUrl = matches.length < props.pageSize ?null:'?pageNum=' + (parseInt (props.pageNum) + 1)
                , result = Object.assign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Build.listByUser = function (props, callback) {
  var query = [
        'match (u:User {user_id: {userId}})-[:has_build]-(b:Build)',
        'with b',
        'optional match (b)-[:has_build]-(s:Specs)',
        'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
        'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
        'optional match (b)-[:has_like]-(like)',
        'optional match (b)-[:has_comment]-(c)',
        'optional match (b)-[:has_build]-(u:User)',
        'return b, collect(distinct m), collect (t), collect (like), count (c), u, s.specId',
        'skip {skipCount}',
        'limit {pageSize}',
      ].join ('\n')
    , params = {
      userId: props.userId,
      skipCount: props.pageNum * props.pageSize,
      pageSize: props.pageSize
    }
    , session = driver.session()
    session.run (query, params)
           .then (function (res) {
              var matches = util.parseBuilds (res)
                , nextPageUrl = matches.length < props.pageSize ?null:'?pageNum=' + (parseInt (props.pageNum) + 1)
                , result = Object.assign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
              callback (null, result)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })

}

Build.get = function (props, callback) {
  var query = [
        'match (b:Build {buildId: {buildId}})',
        'optional match (b)-[:has_part]-(p:Part)-[:manufacture]-(m:Manufacturer)',
        'optional match (b)-[:has_part]-(p:Part)-[:has_tag]-(t:TuningTag)',
        'optional match (b)-[:has_build]-(s:Specs)',
        'optional match (b)-[:has_like]-(like)',
        'optional match (s)-[pr:has_tuning]-(specPart:Part) where specPart.partId in p.partId',
        'optional match (b)-[:has_build]-(owner:User)',
        'return b, s, collect (pr), collect(like), owner, collect (t)',
      ].join ('\n')
    , params = {
      buildId: props.buildId
    }
    , session = driver.session()

    session.run (query, params)
           .then (function (res) {
              var data = util.parseBuildDetails (res)
              callback (null, data)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })

}

Build.listBuildPart = function (props, callback) {
  var query = [
        'match (b:Build {buildId: {buildId}})-[:has_build]-(s:Specs)',
        'with b, s',
        'match (b)-[:has_part]-(p:Part)-[ts:has_tuning]-(s)',
        'with p, ts',
        'match (part)-[:has_tag]-(t:TuningTag) where t.name in {tags} and part.partId in p.partId',
        'return p, ts',
        'skip {skipCount}',
        'limit {pageSize}',
  ].join ('\n')
  , params = {
    buildId: props.buildId,
    tags: [props.partTag],
    skipCount: props.pageNum * props.pageSize,
    pageSize: props.pageSize,
  }
  , session = driver.session()

  session.run (query, params)
         .then (function (record) {
            callback (null, util.parseParts (record.records))
         })
         .catch (function (err) {
           console.error (err)
           callback (err)
         })

}
