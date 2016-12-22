// users.js
// Routes to CRUD users.

var URL = require('url')
  , request = require ('request-promise')
  , errors = require('../models/errors')
  , User = require('../models/user')

function getUserURL(user) {
    return '/users/' + encodeURIComponent(user.user_id) + '/profile';
}

/**
 * GET /users
 */
exports.list = function (req, res, next) {
    User.getAll(function (err, users) {
        if (err) {
          return next (err)
        }
        res.status (200).json({
            users: users,
        });
    });
};

/**
 * POST /users {user_id, ...}
 * req.body: auth0 profile data
 */
exports.create = function (req, res, next) {
    User.create({
      userData: req.body
    }, function (err, user) {
        if (err) {
          return next (err)
        } else {
          res.status (201).end ()
        }
    });
};

/**
 * GET /users/:user_id
 */
exports.get = function (req, res, next) {
    User.get(req.params.user_id, function (err, user) {
        if (err) {
          return next (err)
        } else {
          res.status (200).json (user)
        }
    });
};

/**
 * POST /users/:user_id
 */
exports.edit = function (req, res, next) {
    User.get(req.params.user_id, function (err, user) {
        if (err) return next(err);
        user.patch(req.body, function (err) {
            if (err) {
              return next(err);
            } else {
              res.status(201).end()
            }
        });
    });
};

/**
 * DELETE /users/:user_id
 */
exports.del = function (req, res, next) {
    User.get(req.params.user_id, function (err, user) {
        if (err) return next(err);
        user.del(function (err) {
            if (err) return next(err);
            res.status(202).end()
        });
    });
};

/**
 * POST /users/:user_id/follow {otherUsername}
 */
exports.follow = function (req, res, next) {
    User.get(req.params.user_id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user_id, function (err, other) {
            if (err) return next(err);
            user.follow(other, function (err) {
                if (err) return next(err);
                res.status(201).end();
            });
        });
    });
};

/**
 * POST /users/:user_id/unfollow {otherUsername}
 */
exports.unfollow = function (req, res, next) {
    User.get(req.params.user_id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user_id, function (err, other) {
            if (err) return next(err);
            user.unfollow(other, function (err) {
                if (err) return next(err);
                res.status (201).end()
            });
        });
    });
};

/**
 * GET /token
 */
exports.fetchAuth0Profile = function (req, res, next) {
  var opts = {
    method: 'POST',
    uri: process.env.AUTH0_USERINFO,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify ({
      id_token: req.query.id_token
    })
  }

  request (opts)
  .then (function (body) {
    var profileBody = JSON.parse (body)            
    console.log  (JSON.stringify (body,null, 2))
        User.createAndPatch (profileBody, function (userCreateError, newUser) {
          if (userCreateError) {
            console.error('UserCreateError\nerror=', userCreateError)
            return next(userCreateError)
          } else {
            res.status (201).json (newUser)
          }
        })
  })
  .catch (function (err) {
    return next (err)
  })
}

