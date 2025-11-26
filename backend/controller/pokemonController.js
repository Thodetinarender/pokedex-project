const PokemonService = require('../services/pokemonService');

class PokemonController {
  static async searchPokemon(req, res) {
    try {
      const { nameOrId } = req.params;

      if (!nameOrId) {
        return res.status(400).json({
          success: false,
          message: 'Pokemon name or ID is required'
        });
      }

      const data = await PokemonService.searchPokemon(nameOrId);

      return res.status(200).json({
        success: true,
        message: `Pokemon found (source: ${data.source})`,
        data: data
      });
    } catch (error) {
      console.error('Controller error:', error.message);
      return res.status(404).json({
        success: false,
        message: error.message || 'Pokemon not found'
      });
    }
  }

  static async getAllPokemon(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = parseInt(req.query.offset) || 0;
      const typeFilter = req.query.type || null;

      if (limit < 1 || offset < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters'
        });
      }

      const data = await PokemonService.getAllPokemon(limit, offset, typeFilter);

      res.set('X-Total-Count', String(data.total || 0));
      res.set('X-Source', data.source || 'api');

      return res.status(200).json({
        success: true,
        message: `Fetched ${data.pokemon.length} Pokemon (source: ${data.source})`,
        pagination: {
          limit,
          offset,
          total: data.total
        },
        source: data.source || 'api',
        data: data.pokemon
      });
    } catch (error) {
      console.error('Controller error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch Pokemon list'
      });
    }
  }

  static async getPokemonByType(req, res) {
    try {
      const { typeName } = req.params;

      if (!typeName) {
        return res.status(400).json({
          success: false,
          message: 'Type name is required'
        });
      }

      const data = await PokemonService.getPokemonByType(typeName);

      return res.status(200).json({
        success: true,
        message: `Found ${data.count} ${typeName}-type Pokemon (source: ${data.source})`,
        data: {
          type: data.type,
          count: data.count,
          pokemon: data.pokemon.slice(0, 50)
        }
      });
    } catch (error) {
      console.error('Controller error:', error.message);
      return res.status(404).json({
        success: false,
        message: error.message || 'Type not found'
      });
    }
  }


  static async searchByName(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      try {
        const data = await PokemonService.searchPokemon(q);
        return res.status(200).json({
          success: true,
          message: 'Pokemon found',
          data: [data]
        });
      } catch (error) {
        return res.status(200).json({
          success: true,
          message: 'No exact matches found',
          data: []
        });
      }
    } catch (error) {
      console.error('Controller error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Search failed'
      });
    }
  }

  static getCacheStats(req, res) {
    try {
      const stats = PokemonService.getCacheStats();
      return res.status(200).json({
        success: true,
        message: 'Cache statistics',
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get cache stats'
      });
    }
  }

  static clearCache(req, res) {
    try {
      PokemonService.clearCache();
      return res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cache'
      });
    }
  }

  static healthCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = PokemonController;
