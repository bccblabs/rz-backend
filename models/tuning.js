'use strict'

var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , objectAssign = require ('object-assign')

var Tuning = module.exports = function Tuning (_node) {
  this._node = _node
}

Tuning.create = function (props, callback) {
  var query = [
      'match (s:Specs {specId: {specId_}}), (m:Manufacturer {manufacturerId: {manufacturerId_}})',
      'with s,m',
      'merge (m)-[:manufacture]-(p:Part {partId: {partId_}})-[r:has_tuning]-(s) set p={partProps}, r={specsProps}',
      'with p',
      'unwind {tags} as rawTag',
      'merge (t:Tag {name: rawTag})', 
      'with t',
      'match (tag:Tag {name: t.name}), (p:Part {partId: {partId_}})',
      'with tag, p',
      'merge (tag)-[:has_tag]-(p)'
    ].join ('\n')
    , params = {
      partId_: props.partId,
      specId_: props.specId,
      manufacturerId_: props.manufacturerId,
      partProps: {
        partId: props.partId,
        name: props.partName,
        description: props.partDescription,
        details: props.partDetails,
        original: props.original,
        medium: props.medium,
        thumb: props.thumb,
      },
      tags: props.tags,
      specsProps:props.specsProps
    }
    , session = driver.session()

    session.run (query, params)
            .then (function (record) {
              callback (null)
            })
            .catch (function (err){
              console.error ('Error: Tuning.create', err)
              callback (err)
            })
}

Tuning.search = function (props, callback) {
  var query = [
        'match (t:TuningTag)-[:has_tag]-(p:Part)-[ts:has_tuning]-(s:Specs {specId: {specId_}}) where t.name in {tags}',
        'return p, ts',
      ].join ('\n'),
      params = {
        tags: props.tags,
        specId_: props.specId
      },
      session = driver.session()

      session.run (query, params)
              .then (function (record) {
                callback (null, util.parseParts (record.records))
              })
              .catch (function (err){
                callback (err)
              })
}

Tuning.searchByManufacturer = function (props, callback) {
  var query = [
        'match (c:TuningCategory {name: {name_}})-[:has_tag]-(t:TuningTag)-[:has_tag]-(p:Part)-[:has_tuning]-(s:Specs {specId: {specId_}})',
        'with collect (p.partId) as partIds',
        'match (m:Manufacturer {manufacturerId: {manufacturerId_}})-[:manufacture]-(part:Part)-[ts:has_tuning]-(s:Specs {specId: {specId_}}) where part.partId in partIds',
        'return part, ts',
      ].join ('\n'),
      params = {
        name_: props.name,
        specId_ :props.specId,
        manufacturerId_: props.manufacturerId
      },
      session = driver.session()
      session.run (query, params)
              .then (function (record) {
                callback (null, util.parseParts (record.records))
              })
              .catch (function (err){
                callback (err)
              })

}

Tuning.listPartsByManufacturer = function (props, callback) {
  var query = [
        'match (m:Manufacturer {manufacturerId: {manufacturerId_}})-[:manufacture]-(p:Part)-[:has_tag]-(t:TuningTag)',
        // 'with m, t',
        // 'match (t)-[:has_tag]-(p:Part)',
        'return distinct t, collect (distinct p), m', 
      ].join ('\n')
      , params = {
        manufacturerId_: props.manufacturerId
      }
      , session = driver.session()

      session.run (query, params)
            . then (function (rec) {
              callback (null, util.parsePartsByManufacturers(rec))
            })
            . catch (function (err) {
              callback (err)
            })
}

Tuning.get = function (props, callback) {
  var query = [
        'match (p:Part {partId: {partId_}})-[:manufacture]-(m:Manufacturer)',
        'match (s:Specs {specId: {specId_}})',

        'optional match (p)-[ts:has_tuning]-(s)',
        'optional match (p)-[:has_part]-(b:Build)',
        'optional match (p)-[:has_listings]-(l:Listing)',
        'optional match (p)-[:partComment]-(c:Comment)-[:forSpecs]-(s)',

        'return m, collect (l), count (b), count (c), ts, p',
      ].join ('\n')
    , params = {
      partId_: props.partId,
      specId_: props.specId,
    },
    session = driver.session()

  session.run (query, params)
        .then (function (record) {
          callback (null, util.parsePartDetails (record.records))
        })
        .catch (function (err) {
          console.error ('Error: Tuning.get', err)
          callback (err)
        })
}

Tuning.getTags = function (props, callback) {
  var query = [
    'match (s:Specs {specId: {specId_}})-[:has_tuning]-(p:Part)-[:has_tag]-(t:Tag) return distinct (t.name)',
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
            var matches = util.parseTags (res)
              , nextPageUrl = (matches.length >= props.pageSize)?('?pageNum=' + (parseInt (props.pageNum) + 1)): null
              , result = objectAssign ({}, {data: matches}, {nextPageUrl: nextPageUrl})
            callback (null, result)
         })
         .catch (function (err) {
           console.error (err)
           callback (err)
         })

}

Tuning.listByTag = function (props, callback) {
    var query = [
        'match (t:Tag)-[:has_tag]-(p:Part)-[ts:has_tuning]-(s:Specs {specId: {specId_}}) where t.name = {tag}',
        'return p, ts',
      ].join ('\n')
      , params = {
        tag: props.tag,
        specId_: props.specId
      },
      session = driver.session()

      session.run (query, params)
              .then (function (record) {
                callback (null, util.parseParts (record.records))
              })
              .catch (function (err){
                callback (err)
              })
}

Tuning.listManufacturers = function (props, callback) {
    var query = [
      'match (s:Specs {specId: {specId_}})-[:has_tuning]-(p:Part)-[:manufacture]-(m:Manufacturer) return distinct (m)',
    ].join ('\n')
    , params = {specId_: props.specId}
    , session = driver.session()

    session.run (query, params)
            .then (function (record) {
              callback (null, {data: util.parseManufacturers (record)})
            })
            .catch (function (err) {
              console.error (err)
              callback (err)
            })
}