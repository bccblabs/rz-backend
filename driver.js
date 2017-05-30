 var neo4j = require('neo4j-driver').v1
  , dotenv = require('dotenv').config()

const {
  DB_HOST,
  DB_USERNAME,
  DB_PASS
} = process.env

const driver = neo4j.driver(DB_HOST, neo4j.auth.basic(DB_USERNAME, DB_PASS));
 // var neo4j = require('neo4j-driver').v1
 //   , driver = neo4j.driver("bolt://0.0.0.0", neo4j.auth.basic("neo4j", "test"))

module.exports = driver
