const axios = require('axios');
const Cache = require('../utils/cache');
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const MAX_CACHE_ENTRIES = process.env.CACHE_MAX_ENTRIES ? parseInt(process.env.CACHE_MAX_ENTRIES, 10) : 500;
const DEFAULT_CACHE_TTL = process.env.CACHE_TTL_MS ? parseInt(process.env.CACHE_TTL_MS, 10) : 7200000; // 2 hours
const CLEANUP_INTERVAL_MS = process.env.CACHE_CLEANUP_MS ? parseInt(process.env.CACHE_CLEANUP_MS, 10) : 600000; // 10 minutes

const cache = new Cache({
  maxEntries: MAX_CACHE_ENTRIES,
  defaultTTL: DEFAULT_CACHE_TTL,
  cleanupInterval: CLEANUP_INTERVAL_MS
});

class PokemonService {
  static async searchPokemon(nameOrId) {
    try {
      if (!nameOrId || typeof nameOrId !== 'string') {
        throw new Error('Invalid Pokemon name or ID');
      }

      const searchKey = nameOrId.toLowerCase().trim();
      const cacheKey = `pokemon:${searchKey}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] ${searchKey}`);
        return { ...cachedData, source: 'cache' };
      }
      console.log(`[API CALL] Fetching ${searchKey} from PokeAPI...`);
      const apiResponse = await axios.get(
        `${POKEAPI_BASE}/pokemon/${searchKey}`,
        { timeout: 10000 }
      );

      const pokemonData = this.formatPokemonData(apiResponse.data);
      
      cache.set(cacheKey, pokemonData, DEFAULT_CACHE_TTL);
      try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          this.savePokemonToDB(pokemonData).catch(err => console.warn('[Service] savePokemonToDB failed:', err.message));
        } else {
        }
      } catch (err) {
        console.warn('[Service] DB write check failed:', err.message);
      }

      return { ...pokemonData, source: 'api' };
    } catch (error) {
      console.error(`Error searching for Pokemon ${nameOrId}:`, error.message);
      const dbData = await this.getPokemonFromDB(nameOrId);
      if (dbData) {
        console.log(`[Fallback] Found in database`);
        return { ...dbData.toObject(), source: 'database' };
      }

      throw new Error(`Pokemon not found: ${nameOrId}`);
    }
  }

  static async getAllPokemon(limit = 20, offset = 0, typeFilter = null) {
    try {
      const cacheKey = `pokemon:list:${limit}:${offset}:${typeFilter || 'all'}`;
      const cachedList = cache.get(cacheKey);
      if (cachedList) {
        console.log(`[Cache HIT] Pokemon list`);
        return { ...cachedList, source: 'cache' };
      }

      const params = { limit, offset };
      const response = await axios.get(`${POKEAPI_BASE}/pokemon`, {
        params,
        timeout: 15000
      });

      const LIST_CONCURRENCY = 6;
      const results = response.data.results || [];
      async function promisePool(items, worker, concurrency) {
        const ret = [];
        let i = 0;
        const executing = [];

        const enqueue = async () => {
          if (i >= items.length) return Promise.resolve();
          const idx = i++;
          const p = Promise.resolve().then(() => worker(items[idx], idx));
          ret[idx] = p;

          const e = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e);

          let r = Promise.resolve();
          if (executing.length >= concurrency) {
            r = Promise.race(executing);
          }
          await r;
          return enqueue();
        };

        await enqueue();
        return Promise.all(ret);
      }
      const worker = async (item) => {
        try {
          const name = item.name;
          const cacheKeyPokemon = `pokemon:${name}`;

          const cached = cache.get(cacheKeyPokemon);
          if (cached) {
            return {
              id: cached.id,
              name: cached.name,
              types: cached.types || [],
              sprite: (cached.sprites && (cached.sprites.frontDefault || cached.sprites.frontShiny)) || null
            };
          }

          const resp = await axios.get(item.url, { timeout: 7000 });
          const formatted = this.formatPokemonData(resp.data);
          cache.set(cacheKeyPokemon, formatted, DEFAULT_CACHE_TTL);

          return {
            id: formatted.id,
            name: formatted.name,
            types: formatted.types || [],
            sprite: (formatted.sprites && (formatted.sprites.frontDefault || formatted.sprites.frontShiny)) || null
          };
        } catch (err) {
          console.error(`Failed to fetch details for ${item.name}:`, err.message);
          return null;
        }
      };

      const summaries = await promisePool(results, worker, LIST_CONCURRENCY);
      let formattedSummaries = summaries.filter(s => s !== null && s.id);
      if (typeFilter) {
        const tf = typeFilter.toLowerCase();
        formattedSummaries = formattedSummaries.filter(p =>
          (p.types || []).some(t => t.type && t.type.name && t.type.name.toLowerCase() === tf)
        );
      }

      const result = {
        total: response.data.count,
        pokemon: formattedSummaries,
        limit,
        offset
      };
      const listTTL = Math.max(3600000, Math.floor(DEFAULT_CACHE_TTL / 2));
      cache.set(cacheKey, result, listTTL);

      return { ...result, source: 'api' };
    } catch (error) {
      console.error('Error fetching all Pokemon:', error.message);
      throw new Error('Failed to fetch Pokemon list');
    }
  }


  static async getPokemonByType(typeName) {
    try {
      const cacheKey = `pokemon:type:${typeName.toLowerCase()}`;
      
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] Type ${typeName}`);
        return { ...cachedData, source: 'cache' };
      }

      const response = await axios.get(
        `${POKEAPI_BASE}/type/${typeName.toLowerCase()}`,
        { timeout: 10000 }
      );

      const pokemonList = response.data.pokemon.map(p => ({
        name: p.pokemon.name,
        url: p.pokemon.url
      }));

      const result = {
        type: typeName,
        count: pokemonList.length,
        pokemon: pokemonList
      };

      cache.set(cacheKey, result, 3600000);

      return { ...result, source: 'api' };
    } catch (error) {
      console.error(`Error fetching type ${typeName}:`, error.message);
      throw new Error(`Type not found: ${typeName}`);
    }
  }

  static formatPokemonData(apiData) {
    return {
      id: apiData.id,
      name: apiData.name,
      height: apiData.height / 10, 
      weight: apiData.weight / 10,
      baseExperience: apiData.base_experience,
      types: apiData.types.map(t => ({
        slot: t.slot,
        type: {
          name: t.type.name,
          url: t.type.url
        }
      })),
      abilities: apiData.abilities.map(a => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        url: a.ability.url
      })),
      stats: apiData.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat
      })),
      sprites: {
        frontDefault: apiData.sprites.front_default,
        frontShiny: apiData.sprites.front_shiny,
        backDefault: apiData.sprites.back_default,
        backShiny: apiData.sprites.back_shiny
      },
      moves: apiData.moves.map(m => ({
        name: m.move.name,
        url: m.move.url
      })).slice(0, 10),
      species: {
        name: apiData.species.name,
        url: apiData.species.url
      }
    };
  }

  static async savePokemonToDB(pokemonData) {
    try {
      if (!(mongoose.connection && mongoose.connection.readyState === 1)) {
        return;
      }
      const dbDoc = {
        id: pokemonData.id,
        name: pokemonData.name,
        name_lower: pokemonData.name.toLowerCase(),
        types: pokemonData.types || [],
        abilities: pokemonData.abilities || [],
        stats: pokemonData.stats || [],
        sprites: pokemonData.sprites || {},
        moves: pokemonData.moves || [],
        height: pokemonData.height || null,
        weight: pokemonData.weight || null,
        base_experience: pokemonData.baseExperience || null,
        species: pokemonData.species || {},
        apiResponse: pokemonData.apiResponse || null
      };

      await Pokemon.findOneAndUpdate(
        { id: pokemonData.id },
        dbDoc,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving to DB:', error.message);
    }
  }

  static async getPokemonFromDB(nameOrId) {
    try {
      if (!(mongoose.connection && mongoose.connection.readyState === 1)) {
        return null;
      }

      if (isNaN(nameOrId)) {
        return await Pokemon.findOne({ name_lower: nameOrId.toLowerCase() });
      } else {
        return await Pokemon.findOne({ id: parseInt(nameOrId) });
      }
    } catch (error) {
      console.error('Error fetching from DB:', error.message);
      return null;
    }
  }

  static clearCache() {
    cache.clear();
    console.log('[Cache] Cleared');
  }

  static getCacheStats() {
    return cache.getStats();
  }
}

module.exports = PokemonService;
