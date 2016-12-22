'use strict'
var driver = require ('../driver')
  , _ = require ('lodash')

var User = module.exports = function User(_node) {
    // All we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node
}

// Public constants:
function isConstraintViolation(err) {
    return err instanceof neo4j.ClientError &&
        err.neo4j.code === 'Neo.ClientError.Schema.ConstraintViolation';
}
// Public instance methods:

User.prototype.del = function (callback) {
    // Use a Cypher query to delete both this user and his/her following
    // relationships in one query and one network request:
    // (Note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (user:User {user_id: {user_id}})',
        'OPTIONAL MATCH (user) -[rel:follows]- (other)',
        'DELETE user, rel',
    ].join('\n')

    var params = {
        user_id: this.user_id,
    };

    db.cypher({
        query: query,
        params: params,
    }, function (err) {
        callback(err);
    });
};

User.prototype.follow = function (other, callback) {
    var query = [
        'MATCH (user:User {user_id: {thisUserId}})',
        'MATCH (other:User {user_id: {otherUserId}})',
        'MERGE (user) -[rel:follows]-> (other)',
    ].join('\n')

    var params = {
        thisUserId: this.user_id,
        otherUserId: other.user_id,
    };

    db.cypher({
        query: query,
        params: params,
    }, function (err) {
        callback(err);
    });
};

User.prototype.unfollow = function (other, callback) {
    var query = [
        'MATCH (user:User {user_id: {thisUserId}})',
        'MATCH (other:User {user_id: {otherUserId}})',
        'MATCH (user) -[rel:follows]-> (other)',
        'DELETE rel',
    ].join('\n')

    var params = {
        thisUserId: this.user_id,
        otherUserId: other.user_id,
    };

    db.cypher({
        query: query,
        params: params,
    }, function (err) {
        callback(err);
    });
};

// Calls callback w/ (err, following, others), where following is an array of
// users this user follows, and others is all other users minus him/herself.
User.prototype.getFollowingAndOthers = function (callback) {
    // Query all users and whether we follow each one or not:
    var query = [
        'MATCH (user:User {user_id: {thisUserId}})',
        'MATCH (other:User)',
        'OPTIONAL MATCH (user) -[rel:follows]-> (other)',
        'RETURN other, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n')

    var params = {
        thisUserId: this.user_id,
    };

    var user = this;
    db.cypher({
        query: query,
        params: params,
    }, function (err, results) {
        if (err) return callback(err);

        var following = [];
        var others = [];

        for (var i = 0; i < results.length; i++) {
            var other = new User(results[i]['other']);
            var follows = results[i]['COUNT(rel)'];

            if (user.user_id === other.user_id) {
                continue;
            } else if (follows) {
                following.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, following, others);
    });
};

User.prototype.patch = function (callback) {
}

// Static methods:
User.get = function (user_id, callback) {
    var query = [
          'match (user:User {user_id: {userId}})',
          'return user',
        ].join ('\n')
        , params = {userId: user_id}
        , session = driver.session()

    session.run (query, params)
           .then (function (record) {
              callback (null, record.records[0]._fields[0].properties)
           })
           .catch (function (err) {
               console.error ('Error: User.get', err)
               callback (err)
           })

    // Schemas.UserModel.where ({user_id: user_id}, function (err, users) {
    //   if (err) {
    //     console.error ('user.get', err)
    //     callback (err)
    //   } else if (users.length < 1) {
    //     var userNotFound = new errors.UserNotFoundError ('user not found', user_id)
    //     callback (userNotFound)
    //   } else {
    //     console.log ('user.get', users)
    //     callback (null, users[0])
    //   }
    // })
};

User.getAll = function (callback) {
    var query = [
        'MATCH (user:User)',
        'RETURN user',
    ].join('\n');

    db.cypher({
        query: query,
    }, function (err, results) {
        if (err) return callback(err);
        var users = results.map(function (result) {
            return new User(result['user']);
        });
        callback(null, users);
    });
};

// Creates the user and persists (saves) it to the db, incl. indexing it:
User.createAndPatch = function (props, callback) {
  var query = [
      'merge (user:User {user_id: {user_id_}})',
      'set user.accessed = timestamp()',
      'set user.picture = {picture}',
      'set user.updated = {updated_time_}',
      'set user.name={name_}',
      'with {identities} as identities',
      'unwind identities as identity',
      'match (u:User {user_id: {user_id_}})',
      'merge (u)-[rel:has_identity]->(social:SocialIdentity {provider: identity.provider})',
      'return u',
      ].join ('\n'),
      params = {
        user_id_: props.user_id,
        name_: props.name,
        picture: props.picture,
        nickname_: props.nickname,
        updated_time_: props.updated_time,
        identities: props.identities
      },
      session = driver.session()

  session.run (query, params)
         .then (function (record) {
            // _.forEach (record.records, function (result) {
            //   console.log (result)
            // })
            //  console.log ('User.createAndPatch', record.records[0]._fields[0].properties)
             callback (null, record.records[0]._fields[0].properties)
         })
         .catch (function (err) {
             console.error ('Error: User.createAndPatch', err)
             callback (err)
         })
};

User.prototype.view = function (objectId, callback) {
  var query = [
        'merge (user:User {user_id: {userId}) -[:has_viewed]->(node {object_id: {objectId}})',
        'return user, node'
      ],
      params = {
        userId: this.user_id,
        objectId: objectId,
      },
      session = this.driver.session()

  session.run (query, params)
         .then (function (record) {
           callback ()
         })
         .catch (function (err) {
           console.error ('Error: User.viewed', err)
           callback (err)
         })
}


// Static initialization:

// Register our unique user_id constraint.
// TODO: This is done async'ly (fire and forget) here for simplicity,
// but this would be better as a formal schema migration script or similar.
// var initializeSession = driver.session()
// initializeSession.run ('create constraint on (u:User) assert u.user_id is unique')
//                  .subscribe ({
//                    onNext: function (result) {
//                      console.log ('User.initializeSession result', result)
//                    },
//                    onCompleted: function () {
//                      initializeSession.close()
//                    },
//                    onError: function (err) {
//                      console.error ('User.initializeSession error,', err)
//                    }
//                  })
