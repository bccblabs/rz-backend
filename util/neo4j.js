'use strict'
var _ = require ('lodash')
  , objectAssign = require ('object-assign')

function parsePartNode (rec, omitList) {
  return Object.assign({}, _.omit (rec, omitList), {media: rec.original[0]})
}


exports.parseProps = function (record) {
 var props = _.map (record.records, function (rec) {
   return rec._fields[0].properties})
 return props
}

exports.parsePosts = function (rec) {
  var props = _.map (rec.records, function (rec) {
    return {
      post: _.omit (rec._fields[0].properties, ['postId']),
      tags: rec._fields[1],
      user: rec._fields[2].properties,
      likes: rec._fields[3],
      comments: rec._fields[4].high,
      postId: rec._fields[0].properties.postId,
      postType: rec._fields[5],
      build: rec._fields[6]?rec._fields[6].properties:null,
      part: rec._fields[7]?rec._fields[7].properties:null,
      specId: rec._fields[8]
    }
  })
  return props
}

exports.parseTags = function (rec) {
  var props = _.map (rec.records, function (rec) {
    return {name: rec._fields[0]}
  })
  return props
}

exports.parseManufacturers = function (rec) {
  var props = _.map (rec.records, function (rec) {
    return rec._fields[0].properties
  })
  return props
}

exports.parseBuilds = function (rec) {
  var props = _.map (rec.records, function (rec) {
    var name = rec._fields[0].properties.name
      , medium = rec._fields[0].properties.original?rec._fields[0].properties.original[0]:rec._fields[0].properties.media[0]
      , buildId = rec._fields[0].properties.buildId
      , created = rec._fields[0].properties.created
      , partDict = {}
    rec._fields[2].forEach((tag)=>{
      let name = tag.properties.name
      if (partDict.hasOwnProperty (name)) {
        partDict[name] = partDict[name] + 1
      } else {
        partDict[name] = 1
      }
    })
    return {
      media: medium,
      name: name,
      buildId: buildId,
      created: created,
      manufacturers: rec._fields[1].map ((manufacturer)=>{return manufacturer.properties}),
      tags: partDict,
      likes: rec._fields[3],
      comments: rec._fields[4].high,
      user: rec._fields[5].properties,
      specId: rec._fields[6],
    }
  })
  return props
}

exports.parseBuildDetails = function (rec) {
  var props = rec.records[0]

    , build = props._fields[0]
    , specs = props._fields[1].properties
    , partEffects = props._fields[2]
    , likes = props._fields[3]
    , owner = props._fields[4] 

    , name = build.properties.name
    , medium = build.properties.original?build.properties.original:build.properties.media
    , buildId = build.properties.buildId
    , created = build.properties.created

    , partDict = {}
    , tunedSpecs = _.reduce (partEffects, (res, val, key)=>{

      _.keys (val.properties).forEach ((keyName)=>{
        if (_.isNumber (val.properties[keyName])) {
          var currValue = res[keyName] || 0
            , entry = {[keyName]: currValue += val.properties[keyName]}
          Object.assign (res, entry)
        }
      })
      return res
    }, {})

    _.keys (tunedSpecs).forEach ((key)=> {
      if (key === 'hpGain')
        specs['horsepower'] += tunedSpecs[key]
      if (key === 'tqGain')
        specs['torque'] += tunedSpecs[key]
    })


    props._fields[5].forEach((tag)=>{
      let name = tag.properties.name
      if (partDict.hasOwnProperty (name)) {
        partDict[name] = partDict[name] + 1
      } else {
        partDict[name] = 1
      }
    })


  return {
    buildId: buildId,
    created: created,

    likes: likes,
    media: medium,
    name: name,

    specs: specs,

    tags: partDict,
    user: owner.properties,

  }
}

exports.parseCategories = function (rec) {
  var data = {}
    , res = {data: []}
  _.forEach (rec.records, function (rec) {
    var name = rec._fields[0].properties.name
      , opt = rec._fields[1].properties


    if (!data[name]) data[name] = []
    data[name].push ({name: opt.name, media: opt.media || opt.medium[0]})
  })

  _.forEach (_.keys (data), function (name) {
    res['data'].push ({name: name, options: data[name]})
  })
  return res
}

var parseTuningTags = function (recs) {
  var data = {}
    , res = {data: []}

  _.forEach (recs, function (record) {
    var mediaString = record.properties.original.split ('/')
    var tuningCategory = mediaString[mediaString.length-1].split ('#')[0]
    if (!data[tuningCategory]) data[tuningCategory] = []
    data[tuningCategory].push (record.properties)
  })

  _.forEach (_.keys (data), function (name) {
    res['data'].push ({name: name, options: data[name]})
  })
  return res

}

exports.parseSpecsDetails = function (rec) {
  var payload = rec.records[0]
    , make = payload._fields[0]
    , model = payload._fields[1]
    , submodel = payload._fields[2]

    , spec = payload._fields[3].properties
    , posts = _.map (payload._fields[4], (fields)=> {
      return Object.assign ({}, {labels: fields.labels}, _.omit (fields.properties, ['original', 'medium', 'thumb']), {media: fields.properties.medium})
    })

  var data = Object.assign ({},
    {specId: spec.specId},
    {specs: _.omit(spec, 'specId')},
    {posts: posts},
    {make: make, model: model, submodel: submodel})

  return data
}

exports.parseParts = function (records) {
  return {
    data: records.map (record=>{
      var part = record._fields[0]
        , specs = record._fields[1]
      return Object.assign ({}, parsePartNode (part.properties, ['details', 'description','original', 'medium', 'thumb']), specs.properties)
    })
  }
}


exports.partManufacturers = function (records) {
  var tuning = []
  _.forEach (records.records, function (rec) {
    if (rec._fields[0] && rec._fields[1].length) {
    var name = rec._fields[0].properties.name
      , data = rec._fields[1].map ((manufacturer)=>manufacturer.properties)
      , payload = Object.assign ({}, {name}, {data})
    tuning.push (payload)
    }
  })
  return tuning
}

exports.parsePartsByManufacturers = function (recs) {
  var tuning = []
      , manufacturer

  recs.records.forEach ((rec) => {
    var tag = rec._fields[0].properties.name
      , data = rec._fields[1].map ((part)=>{
    console.log (part)
          return Object.assign ({}, 
                {media: part.properties.medium?part.properties.medium[0]:''}, 
                {partId: part.properties.partId}, 
                {name: part.properties.name}
          )
      })
      , payload = Object.assign ({}, {name: tag}, {data})
      manufacturer = rec._fields[2].properties
    tuning.push (payload)
  })
  return {tuning: tuning, manufacturer: manufacturer}
}

exports.parsePartDetails = function (records) {
  var fields = records[0]._fields
    , manufacturer = fields[0].properties
    , listings = fields[1]
    , builds = fields[2].low
    , comments  = fields[3]
    , ts = fields[4].properties
    , detail = fields[5].properties
    , part = Object.assign({}, _.omit(detail, ['original', 'medium', 'thumb']), {media: detail.original})

  return objectAssign ({},
    {part: part},
    {manufacturer: manufacturer},
    {listings: listings},
    {buildCnt: builds},
    {comments: comments},
    {tuning: ts}
  )
}

