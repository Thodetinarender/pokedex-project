const express = require('express');
const router = express.Router();
const PokemonController = require('../controller/pokemonController');


router.get('/health', PokemonController.healthCheck);
router.get('/pokemon/:nameOrId', PokemonController.searchPokemon);
router.get('/type/:typeName', PokemonController.getPokemonByType);
router.get('/pokemon', PokemonController.getAllPokemon);
router.get('/search', PokemonController.searchByName);
router.get('/cache/stats', PokemonController.getCacheStats);
router.post('/cache/clear', PokemonController.clearCache);
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

module.exports = router;
