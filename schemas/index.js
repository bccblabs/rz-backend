var db = require('seraph')('http://neo4j:test@localhost:7474')
  , model = require('seraph-model')


/* Schemas Definitions */
var TagSchema = require ('./TagSchema')
  , MediaSchema = require ('./MediaSchema')

  , SocialIdentitySchema = require ('./SocialIdentitySchema')
  , UserSchema = require ('./UserSchema')
  , BusinessSchema = require ('./BusinessSchema')

  , PostSchema = require ('./PostSchema')
  , CommentSchema = require ('./CommentSchema')
  , RatingSchema = require ('./RatingSchema')

  , EventSchema = require ('./EventSchema')
  , ListingSchema = require ('./ListingSchema')

  , EngineSchema = require ('./EngineSchema')
  , CarSchema = require ('./CarSchema')
  , TrimSchema = require ('./TrimSchema')

  , TuningItemSchema = require ('./TuningItemSchema')

/* Models Definitions */
var Tag = model (db, 'Tag')
  , Media = model (db, 'Media')

  , SocialIdentity = model (db, 'SocialIdentity')
  , User = model (db, 'User')
  , BusinessEntity = model (db, 'BusinessEntity')

  , Post = model (db, 'Post')
  , Comment = model (db, 'Comment')
  , Rating = model (db, 'Rating')

  , CarEvent = model (db, 'CarEvent')
  , Listing = model (db, 'Listing')

  , Engine = model (db, 'Engine')
  , Car = model (db, 'Car')
  , Trim = model (db, 'Trim')

  , Powertrain = model (db, 'Powertrain')
  , Suspension = model (db, 'Suspension')
  , Brake = model (db, 'Brake')
  , Exhaust = model (db, 'Exhaust')
  , BodyKit = model (db, 'BodyKit')
  , Interior = model (db, 'Gauge')
  , Rim = model (db, 'Rim')
  , Infotainment = model (db, 'Infotainment')

/* Tag Model */
{
  Tag.schema = TagSchema
}
exports.TagModel = module.exports.TagModel = Tag

/* Media Model */
{
  Media.schema = MediaSchema
}
exports.MediaModel = module.exports.MediaModel = Media


/* Social Identity */
{
  SocialIdentity.schema = SocialIdentitySchema
  SocialIdentity.setUniqueKey ('user_id', true, function (){})
  SocialIdentity.fields = [
    'access_token',
    'provider',
    'user_id',
    'connection',
    'isSocial',
  ]
}
exports.SocialIdentityModel = module.exports.SocialIdentityModel = SocialIdentity

/* User Model */
{
  User.schema = UserSchema
  User.setUniqueKey ('user_id', true, function (){})
  User.fields = [
    'picture',
    'updated_time',
    'locale',
    'user_id',
    'name',
    'nickName',
    'gender',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'country',
    'zipcode',
  ]
  User.compose (SocialIdentity, 'identities', 'has_identity')
}
exports.UserModel = module.exports.UserModel = User

/* BusinessEntity Model */
{
  BusinessEntity.schema = BusinessSchema
  BusinessEntity.compose (Media, 'media', 'has_media')
}
exports.BusinessEntityModel = module.exports.BusinessEntityModel = BusinessEntity


/* Post Model */
{
  Post.schema = PostSchema
  Post.fields = [
    'createdAt',
    'text',
    'title',
  ]
  Post.compose (Tag, 'tags', 'has_tag')
  Post.compose (Media, 'media', 'has_media')
}
exports.PostModel = module.exports.PostModel = Post

/* Comment Model */
{
  Comment.schema = CommentSchema
  Comment.fields = [
    'createdAt',
    'text',
  ]
  Comment.compose (Tag, 'tags', 'has_tag')
  Comment.compose (Media, 'media', 'has_media')
}
exports.CommentModel = module.exports.CommentModel = Comment

/* Rating Model */
{
  Rating.schema = RatingSchema
}
exports.RatingModel = module.exports.RatingModel = Rating


/* Car Event Model */
{
  CarEvent.schema = EventSchema
  CarEvent.compose (Tag, 'tags', 'has_tag')
  CarEvent.compose (Media, 'media', 'has_media')
}
exports.CarEventModel = module.exports.CarEventModel = CarEvent
/* Listing Model */
{
  Listing.schema = ListingSchema
  Listing.compose (Media, 'media', 'has_media')
  Listing.compose (Tag, 'tags', 'has_tag')
}
exports.ListingModel = module.exports.ListingModel = Listing


/* Engine Model */
{
  Engine.schema = EngineSchema
}
exports.EngineModel = module.exports.EngineModel = Engine

/* Car Model */
{
  Car.schema = CarSchema
}
exports.CarModel = module.exports.CarModel = Car

/* Trim */
{
  Trim.schema = TrimSchema
  Trim.compose (Engine, 'engine', 'has_engine')
  Trim.compose (Media, 'media', 'has_media')
  Trim.addComputedField ('name', function (car) {
    return car.year + ' ' + car.make + ' ' + car.model + ' ' + car.trim + ' ' + car.platform
  })
}
exports.TrimModel = module.exports.TrimModel = Trim


/* Powertrain Tuning */
{
  Powertrain.schema = TuningItemSchema
  Powertrain.compose (Tag, 'tags', 'has_tag')
  Powertrain.compose (Media, 'media', 'has_media')
}
exports.PowertrainModel = module.exports.PowertrainModel = Powertrain

/* Suspension Tuning */
{
  Suspension.schema = TuningItemSchema
  Suspension.compose (Tag, 'tags', 'has_tag')
  Suspension.compose (Media, 'media', 'has_media')
}
exports.SuspensionModel = module.exports.SuspensionModel = Suspension

/* Brakes Tuning */
{
  Brake.schema = TuningItemSchema
  Brake.compose (Tag, 'tags', 'has_tag')
  Brake.compose (Media, 'media', 'has_media')
}
exports.BrakesModel = module.exports.BrakesModel = Brake

/* Exhaust Tuning */
{
  Exhaust.schema = TuningItemSchema
  Exhaust.compose (Tag, 'tags', 'has_tag')
  Exhaust.compose (Media, 'media', 'has_media')
}
exports.ExhaustModel = module.exports.ExhaustModel = Exhaust

/* Bodykit Tuning */
{
  BodyKit.schema = TuningItemSchema
  BodyKit.compose (Tag, 'tags', 'has_tag')
  BodyKit.compose (Media, 'media', 'has_media')
}
exports.BodyKitModel = module.exports.BodyKitModel = BodyKit

/* Interior Tuning */
{
  Interior.schema = TuningItemSchema
  Interior.compose (Tag, 'tags', 'has_tag')
  Interior.compose (Media, 'media', 'has_media')
}
exports.InteriorModel = module.exports.InteriorModel = Interior

/* Rims */
{
  Rim.schema = TuningItemSchema
  Rim.compose (Tag, 'tags', 'has_tag')
  Rim.compose (Media, 'media', 'has_media')
}
exports.RimsModel = module.exports.RimsModel = Rim

/* Infotainment Model */
{
  Infotainment.schema = TuningItemSchema
  Infotainment.compose (Tag, 'tags', 'has_tag')
  Infotainment.compose (Media, 'media', 'has_media')
}
exports.InfotainmentModel = module.exports.InfotainmentModel = Infotainment
