'use strict'

var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')

var Deal = module.exports = function Deal (_node) {
  this._node = _node
}

Deal.updateBySubmodelYear = function (props, callback) {
  var query = [
      'match (d:Deal {dealId: {dealId_}})',
      'optional match (mk:Make {name: {make}})-[:has_model]-(md:Model {name: {model}})-[:has_submodel]-(sm:Submodel {name: {submodel}})-[]-(s:Specs)-[:has_year]-(yr:Year) where yr.year in {years}',
      'merge (d)-[:has_deal]-(s)',
    ].join ('\n'),
    params = {
      dealId_: props.dealId,
      make: props.make,
      model: props.model,
      submodel: props.submodel,
      years: props.years
    },
    session = driver.session()

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

Deal.updateDealParts = function (props, callback) {
  var query = [
        'match (d:Deal {dealId: {dealId_}})',
        'match (p:TuningItem) where p.name in {partNames}',
        'with (d), (p)',
        'merge (p)-[:has_deal]-(d)',
      ],
      params = {
        dealId_: props.dealId,
        partNames: props.partNames
      },
      session = driver.session()

  session.run (query, params)
         .then (function (record) {
           var processedRecord = record.records[0]._fields[0].properties
           callback (null, processedRecord)
         })
         .catch (function (err) {
           callback (err)
         })
}

Deal.create = function (props, callback) {
  var query = 'merge (d:Deal {title: {dealProps}.title}) on create set d={dealProps} return d'
    , params = {
        dealProps: {
          dealId: props.dealId,
          title: props.title,
          description: props.description,
          dealImage: props.media[0],
          media: props.media.slice (1),
          created: props.created,
        }
      }
    , session = driver.session()

    session.run (query, params)
           .then (function (record) {
             var new_record = record.records[0]._fields.properties
             callback (null, new_record)
           })
           .catch (function (err) {
             console.error (err)
             callback (err)
           })
}

Deal.list = function (pagenum, pagesize, callback) {
  var query = [
        'match (d:Deal) return d.dealImage, d.title, d.dealId'
      ].join ('\n'),
      session = driver.session()
  session.run (query)
         .then (function (record) {
           var deals = _.map (record.records, function (rec) {
             return {
               dealImage: rec._fields[0],
               title: rec._fields[1],
               dealId: rec._fields[2]
             }
           })
           callback (null, {data: deals})
         })
         .catch (function (err) {
           console.error ('Error: Car.getMakes', err)
           callback (err)
         })
}
