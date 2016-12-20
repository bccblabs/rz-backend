'use strict'

var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , objectAssign = require ('object-assign')


var TuningCategory = module.exports = function TuningCategory (_node) {
  this._node = _node
}


TuningCategory.create = function (props, callback) {
  var query = [
        'merge (c:TuningCategory {name: {categoryProps}.name})',
        'with c',
        'merge (t:Tag:TuningTag {name: {tagProps}.name}) on create set t={tagProps}',
        'merge (t)-[:has_tag]-(c)',
      ].join ('\n')
    , params = {
      categoryProps: {
        name: props.name,
      },
      tagProps: {
        name: props.tag.replace ('.png', ''),
        original: props.original,
        medium: props.medium,
        thumb: props.thumb,
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
TuningCategory.list = function (props, callback) {
  var query = [
        'match (s:Specs {specId: {specId_}})-[:has_tuning]-()-[:has_tag]-(tag:Tag)-[:has_tag]-(cats:TuningCategory)',
        'with collect( distinct cats) as cs, collect ( distinct tag.name) as tags',
        'unwind cs as c',
        'optional match (c)-[:has_tag]-(t:Tag) where t.name in tags',
        'return c, t',
      ].join ('\n')
      , session = driver.session()
      , params = {
        specId_: props.specId
      }

      session.run (query, params)
             .then (function (res) {
                var matches = util.parseCategories (res)
                callback (null, matches)
             })
             .catch (function (err) {
               console.error (err)
               callback (err)
             })
}
