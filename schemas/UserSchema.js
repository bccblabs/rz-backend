exports = module.exports = {
  updated_time: {type: Date},
  locale: {type: String},

  user_id: {type: String, required: true},
  user_name: {type: String},
  picture: {type: String},
  gender: {type: String},
  name: {type: String},

  zipcode: {type: String},
  address: {type: String},
  state: {type: String},
  city: {type: String},
  country: {type: String},
  phone: {type: String},
  email: {type: String}
}
