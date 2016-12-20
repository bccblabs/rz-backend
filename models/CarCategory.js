'use strict'

var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')
  , objectAssign = require ('object-assign')


var CarCategory = module.exports = function CarCategory (_node) {
  this._node = _node
}


CarCategory.create = function (props, callback) {
  var query = [
        'merge (c:CarCategory {name: {categoryProps}.name})',
        'with c',
        'merge (t:Tag:CarOption {name: {tagProps}.name})-[:has_tag]-(c)',
        'on create set t={tagProps}'
      ].join ('\n')
    , params = {
      categoryProps: {
        name: props.name,
      },
      tagProps: {
        name: props.tag.replace ('.jpg', ''),
        media: props.media,
      }
    }
  , session = driver.session ()

  session.run (query, params)
         .then (function (record) {
           _.forEach (record.records, function (rec) {
           })
           callback (null)
         })
         .catch (function (err) {
           console.error (err)
           callback (err)
         })
}
CarCategory.list = function (callback) {
  var query = [
        'match (c:CarCategory)',
        'with c',
        'optional match (c)-[:has_tag]-(t:Tag)',
        'return c, t',
      ].join ('\n')
      , session = driver.session()

      session.run (query)
             .then (function (res) {
                var matches = util.parseCategories (res)
                callback (null, matches)
             })
             .catch (function (err) {
               console.error (err)
               callback (err)
             })
}
