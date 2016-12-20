var driver = require ('../driver')
  , _ = require ('lodash')
  , util = require ('../util/neo4j')

var Car = module.exports = function Car(_node) {
      // All we'll really store is the node; the rest of our properties will be
      // derivable or just pass-through properties (see below).
      this._node = _node
}

Car.createAndPatch = function (props, callback) {
  var query = [
      'merge (mk:Make {name: {make_}})',
      'with (mk)',
      'merge (mk)-[:has_model]->(md:Model {name: {model_}})',
      'with (md)',
      'merge (model)-[:has_submodel]->(submodel:Submodel {name: {submodel_}})',
      'with (submodel)',
      'unwind {tags} as tagName',
      'merge (submodel)-[:has_tag]->(tag:Tag {name: tagName})',
      'unwind {specs} as spec',
      'merge (submodel)-[:has_specs]->(sp:Specs {horsepower: spec.horsepower, displacement: spec.displacement}) set sp=spec',
      'with (sp)',
      'unwind {years} as yr',
      'merge (specs)-[:has_year]->(year:Year {year: yr})',
    ].join ('\n'),
      params = {
          make_: props.make,
          model_: props.model,
          submodel_: props.submodel,
          tags: props.tags,
          specs: props.specs,
          years: props.years
      },
      session = driver.session()

  session.run (query, params)
         .then (function (record) {
           callback (null, record.records[0]._fields[0].properties)
         })
         .catch (function (err) {
           console.error ('Error: Car.createAndPatch', err)
           callback (err)
         })
}

Car.prototype.update = function (props, callback) {
  callback (null)
}

Car.prototype.delete = function (props, callback) {
  var session = driver.session()
     ,query = [
        'match (mk:Make {name: {make_}})-[:has_model]->(md:Model {name: {model_}})-[:has_submodel]->(submodel:Submodel {name: {submodel_}})-[:has_specs]->(sp:Specs)',
        'with (sp)-[r]-()',
        'delete sp, r'
      ].join ('\n')
     ,params = {
        make_: props.make,
        model_: props.model,
        submodel_: props.submodel
      }
    session.run (query, params)
           .then (function () {
             callback (null)
           })
           .catch (function (err) {
             console.error ('Error: Car.prototype.delete', err)
             callback (err)
           })
}


Car.createComment = function (params, props, callback) {
  var session = driver.session()
      query = [
        'match (mk:Make {name: {make_}})-[:has_model]->(md:Model {name: {model_}})-[:has_submodel]->(submodel:Submodel {name: {submodel_}})',
        'with (submodel)',
        'merge (submodel)-[:has_comment]->(comment:Comment {commentProps})',
      ].join ('\n')
     ,params = {
       make_: params.make,
       model_: params.model,
       submodel_: params.submodel,
       commentProps: props.comment,
     }

  session.run (query, params)
        .then (function () {
          callback (null)
        })
        .catch (function (err) {
          console.error ('Error: Car.createComment', err)
          callback (err)
        })
}

Car.deleteComment = function (props, callback) {
  var session = driver.session(),
      query = [
        'match (comment:Comment {comment_id: commentId})',
        'delete comment'
      ].join ('\n')

  session.run (query, params)
        .then (function () {
          callback (null)
        })
        .catch (function (err) {
          console.error ('Error: Car.deleteComment', err)
          callback (err)
        })
}

Car.getMakes = function (callback) {
  var session = driver.session()
     ,query = [
       'match (n:Make) where (n)-[:has_model]-()-[:has_submodel]-()-[:has_specs]-()-[:has_tuning]-() return n'
     ].join ('\n')

  session.run (query)
         .then (function (record) {
           callback (null, util.parseProps (record))
         })
         .catch (function (err){
           console.error ('Error: Car.getMakes', err)
           callback (err)
         })
}

Car.getModels = function (params, callback) {
  var session = driver.session()
     ,query = [
       'match (n:Make {name: {make_}})-[:has_model]->(m:Model)-[:has_submodel]-(submodel:Submodel)-[:has_specs]-(:Specs)-[:has_tuning]-() return m'
     ].join ('\n')
     , params = {
       make_: params.make_name
     }
     session.run (query, params)
            .then (function (record) {
              callback (null, util.parseProps(record))
            })
            .catch (function (err){
              console.error ('Error: Car.getModels', err)
              callback (err)
            })
 }

 Car.getSubmodels = function (params, callback) {
   var session = driver.session()
      ,query = [
        'match (n:Make {name: {make_}})-[:has_model]->(m:Model {name: {model_}})-[:has_submodel]->(submodel:Submodel)-[:has_specs]-(:Specs)-[:has_tuning]-() return submodel'
      ].join ('\n')
      ,params = {
        make_: params.make_name,
        model_: params.model_name
      }

      session.run (query, params)
           .then (function (record) {
             callback (null, util.parseProps (record))
           })
           .catch (function (err){
             console.error ('Error: Car.getSubmodels', err)
             callback (err)
           })
}

Car.searchSubmodels = function (props, callback) {
  var session = driver.session()
     ,query = [
       'match (t:Tag) where t.name in {props.tags}',
       'with (t)',
       'match (t)<-[:has_tag]-(s:Specs)',
       'return s'
     ].join ('\n')

     session.run (query)
          .then (function (record) {
            callback (null, record.records)
          })
          .catch (function (err){
            console.error ('Error: Car.getSubmodels', err)
            callback (err)
          })
}


Car.getSpecs = function (params, callback) {
  var query = [
        'match (mk:Make {name: {make_}})-[:has_model]->(md:Model {name: {model_}})-[:has_submodel]->(submodel:Submodel {name: {submodel_}})-[:has_specs]->(sp:Specs)',
        'optional match (sp)-[:has_tag]->(tag:Tag)',
        'optional match (sp)-[:has_year]-(yr:Year)',
        'return sp, collect(distinct tag.name), collect(distinct yr.year), submodel'
      ].join ('\n')

      params = {
        make_: params.make_name,
        model_: params.model_name,
        submodel_: params.submodel_name,
      },
      session = driver.session()

  session.run (query, params)
         .then (function (record) {
           var recordList = []
           _.forEach (record.records, function (doc) {
             var rec = {}
             rec = doc._fields[0].properties
             rec.tags = doc._fields[1]
             rec.years = doc._fields[2]
             recordList.push (rec)
           })
           callback (null, recordList)
         })
         .catch (function (err) {
           console.error ('Error: Car.get', err)
           callback (err)
         })
}


Car.getSpecsDetails = function (params, callback) {
  var session = driver.session()
    , query = [
        'match (sp:Specs {specId: {specId_}})',
        'optional match (sp)-[:has_specs]-(sm:Submodel)-[:has_submodel]-(md:Model)-[:has_model]-(mk:Make)',
        'optional match (sp)-[]-(post:Post)',
        'return mk.name, md.name, sm.name, sp, collect (distinct post)'
      ].join ('\n')
     ,params = {
        specId_: params.specId,
      }

  session.run (query, params)
         .then (function (record) {
           callback (null, util.parseSpecsDetails (record))
         })
         .catch (function (err) {
           console.error ('Error: Car.getSpecsDetails', err)
           callback (err)
         })

}


Car.getPartsList = function (params, callback) {
  var session = driver.session()
    , query = [
        'match (sp:Specs {specId: {specId_}})',
        'optional match (sp)-[:has_tuning]-(spart:Part)-[:has_tag]-()-[:has_tag]-(t:TuningCategory)',
        'with t, collect (distinct spart.partId) as partIds',
        'optional match (t)-[:has_tag]-(:TuningTag)-[:has_tag]-(p:Part)-[:manufacture]-(m:Manufacturer) where p.partId in partIds',
        'return t, collect(distinct m)'
      ].join ('\n')
     ,params = {
        specId_: params.specId,
      }

  session.run (query, params)
         .then (function (record) {
           callback (null, util.partManufacturers (record))
         })
         .catch (function (err) {
           console.error ('Error: Car.getSpecsDetails', err)
           callback (err)
         })

}
