 var neo4j = require('neo4j-driver').v1
  , driver = neo4j.driver("bolt://hobby-cocipiliojekgbkeacihoool.dbs.graphenedb.com:24786", 
  					neo4j.auth.basic("staging", "I784FAPYOzxULbAOsSFL")
  			);

 // var neo4j = require('neo4j-driver').v1
 //   , driver = neo4j.driver("bolt://0.0.0.0", neo4j.auth.basic("neo4j", "test"))

module.exports = driver
