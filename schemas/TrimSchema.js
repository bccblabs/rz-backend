exports = module.exports = {
  // map photos, media, videos to new nodes
  make: {type: String, required: true},
  model: {type: String, required: true},
  trim: {type: String, required: true},
  year: {type: Number, required: true},
  bodyType: {type: String, required: false},
  platform: {type: String, required: false},
  horsepower: {type: Number, required: false},
  torque: {type: Number, required: false},
  zeroSixty: {type: Number, required: false},
  wheelBase: {type: Number, required: false},
  interiorVol: {type: Number, required: false},
  cargoCapacity: {type: Number, required: false},
  curbWeight: {type: Number, required: false},
  groundClearance: {type: Number, required: false},
  turningDiameter: {type: Number, required: false},
  drag: {type: Number, required: false},
  mpgCity: {type: Number, required: false},
  mpgHighway: {type: Number, required: false},
  driveTrain: {type: String, required: false},
  transmissionType: {type: String, required: false},
  transmissionSpeeds: {type: Number, required: false}
}
