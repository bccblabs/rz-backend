
/**
 * Module dependencies.
 */

var app = require('express')()
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , dotenv = require('dotenv')
  , jwt = require('express-jwt')
  , cors = require('cors')
  , routes = require ('./routes')

/**
 * Initialize environments.
 */
app.use(cors())
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('port', process.env.PORT || 8080);
dotenv.load()

var authenticate = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
})

/*
  /user/
  - accepts query parameter for autocomplete search

  - likes
    - can be anything
    - like/unlike target will be encapsulated in req.body

  - watchlist
    - can either be car, car listing, part, part listing
    - no update needed
*/
app.get('/socialSignIn', routes.user.fetchAuth0Profile);
app.get('/user/:user_id', routes.user.get)
app.put('/user/:user_id', routes.user.edit);
app.delete('/user/:user_id', routes.user.del);

/*
  /cars/
    - create trim level specs node, tags/media rels and nodes if not exist
    - favorites crud: '/cars/:genmodel_id/watchlist/:listingId
    - through listing, retrive the link to the product (cars, tuningItems, etc)
    - "sort like a duality: tuning->listings; listing->tuning"
    - return elasticsearch {make: {model: {genModel: {trim: [year]}}}}
*/
app.post ('/car', routes.car.create)
app.post ('/car/category', routes.car.createCategories)
app.get ('/car/category', routes.car.listCategories)

app.put ('/car/makes/:make_name/models/:model_name/submodels/:submodel_name', routes.car.update)
app.delete ('/car/makes/:make_name/models/:model_name/submodels/:submodel_name', routes.car.delete)

app.get ('/car/makes', routes.car.getMakes)
app.get ('/car/makes/:make_name/models', routes.car.getModels)
app.get ('/car/makes/:make_name/models/:model_name/submodels', routes.car.getSubmodels)
app.get ('/car/makes/:make_name/models/:model_name/submodels/:submodel_name', routes.car.getSpecs)
app.get ('/car/specs/:specId', routes.car.getSpecsDetails)

app.post ('/car/search', routes.car.searchSubmodels)
app.post ('/car/makes/:make_name/models/:model_name/submodels/:submodel_name/comments', routes.car.createComment)
app.delete ('/car/makes/:make_name/models/:model_name/submodels/:submodel_name/:comment_id', routes.car.deleteComment)



/*
  /tuning
    to get tuning options
    (genmodel)-[:has_tuning]-(tuningItem)
    (genmodel)-[:has_tuning]-(tuningItem)-[:has_listing]-(listing)

    - create tuning level node, tags/media/cars rels and nodes if not exist
    - create a link between tuning item and the car trim level specs node
    - favorites tuning items crud: '/user/:user_id/watchlist/:listingId
    - through listing, retrive the link to the product (cars, tuningItems, etc)
    - "sort like a duality: tuning->listings; listing->tuning"
    - do we want to put genmodel_id into search body?
    - when tuning item is deleted, all relations too
*/
app.post ('/tuning/category', routes.tuning.createCategories)
app.get ('/tuning/category', routes.tuning.listCategories)

app.post ('/tuning/parts', routes.tuning.create)
app.get ('/tuning/parts/:partId', routes.tuning.get)
app.put ('/tuning/parts/:partId', routes.tuning.update)
app.delete ('/tuning/parts/:delete', routes.tuning.delete)

app.get ('/tuning/spec/:specId', routes.tuning.search)
app.get ('/tuning/spec/:specId/tags', routes.tuning.getTags)
app.get ('/tuning/spec/:specId/tags/:tagName', routes.tuning.listByTag)

app.get ('/tuning/spec/:specId/manufacturers', routes.tuning.listManufacturers)
app.post ('/tuning/manufacturer/:manufacturerId/spec/:specId', routes.tuning.searchByManufacturer)
app.get ('/tuning/manufacturer/:manufacturerId/parts', routes.tuning.listPartsByManufacturer)

app.get ('/manufacturer', routes.manufacturer.list)
app.get ('/manufacturer/:manufacturerId', routes.manufacturer.get)


// show posts
app.get ('/post', routes.post.list)
app.post ('/post', routes.post.create)
app.get ('/post/build/:buildId', routes.post.listByBuild)
app.get ('/post/part/:partId', routes.post.listByPart)
app.get ('/post/spec/:specId', routes.post.listBySpecs)
app.get ('/post/user/:userId', routes.post.listByUser)

// create posts

// get post 
app.get ('/post/:postId', routes.post.get)
app.put ('/post/:postId', routes.post.update)
app.delete ('/post/:postId', routes.post.delete)

// post comments
app.get ('/post/:postId/comments', routes.post.getComments)
app.post ('/post/:postId/comments', routes.post.createComment)
app.delete ('/post/:postId/comments/:comment_id', routes.post.deleteComment)


// create builds
app.post ('/build', routes.build.create)
app.post ('/build/:buildId', routes.build.update)
app.post ('/build/batchCreate', routes.build.batchCreate)
app.post ('/build/:buildId/part', routes.build.addPart)

// show builds
app.get ('/build', routes.build.list)
app.get ('/build/part/:partId', routes.build.listByPart)
app.get ('/build/specs/:specId', routes.build.listBySpecs)
app.get ('/build/user/:userId', routes.build.listByUser)
app.get ('/build/manufacturer/:manufacturerId', routes.build.listByManufacturer)

// get build
app.get ('/build/details/:buildId', routes.build.get)
app.get ('/build/details/:buildId/part/:category', routes.build.listBuildPart)

var port = process.env.PORT || 8080;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://localhost:' + port);
});
