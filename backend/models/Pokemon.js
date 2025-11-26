const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  id: Number,
  name: String,
  name_lower: String,
  types: Array,
  abilities: Array,
  stats: Array,
  sprites: Object,
  moves: Array,
  height: Number,
  weight: Number,
  base_experience: Number,
  species: Object,
  apiResponse: Object,
}, { timestamps: true });

module.exports = mongoose.model('Pokemon', PokemonSchema);
