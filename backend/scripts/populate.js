/*run command ="cd C:\Users\Admin\OneDrive\Desktop\pokedex-project\backend
node scripts/populate.js*/

//if we need to store pokemon data into mongodb then exescute below code using above command.

// and add this in package.json scripts section ="  populate": "node scripts/populate.js"



// // backend/scripts/populate.js
// require("dotenv").config({ path: "../.env" });
// const axios = require('axios');
// const mongoose = require('mongoose');
// const Pokemon = require('../models/Pokemon');  // make sure this exists
// const connectDB = require('../config/db');
// const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// // ---- STEP 1: CONNECT TO MONGODB ----
// async function start() {
//   await connectDB();

//   console.log('Fetching list of all Pokémon...');

//   // ---- STEP 2: GET LIST OF ALL POKEMON ----
//   const list = await axios.get(`${POKEAPI_BASE}/pokemon?limit=2000`);
//   const pokemonList = list.data.results;
//   console.log(`Total Pokémon found: ${pokemonList.length}`);

//   // ---- STEP 3: FETCH EACH DETAIL & STORE IN DB ----
//   let count = 0;
//   for (const p of pokemonList) {
//     try {
//       const res = await axios.get(p.url);
//       const data = res.data;
      
//       await Pokemon.findOneAndUpdate(
//         { id: data.id },
//         {
//           id: data.id,
//           name: data.name,
//           name_lower: data.name.toLowerCase(),
//           types: data.types,
//           abilities: data.abilities,
//           stats: data.stats,
//           sprites: data.sprites,
//           moves: data.moves,
//           height: data.height,
//           weight: data.weight,
//           base_experience: data.base_experience,
//           species: data.species,
//           apiResponse: data
//         },
//         { upsert: true }
//       );

//       count++;
//       console.log(`Saved: ${data.name} (${count})`);
//     } catch (err) {
//       console.log(`Error fetching ${p.name}`);
//     }
//   }

//   console.log('✔ DONE! ALL Pokémon stored in MongoDB.');
//   process.exit(1);
// }

// start();

