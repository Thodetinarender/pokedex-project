// Frontend logic for simple Pokédex (plain JS + Bootstrap)
let allPokemons = [];   // store whole fetched list
let itemsPerPage = 10;  // show how many per page


function normalizePokemon(p) {
  if (!p) return p;
  const raw = p.data || p;

  return {
    id: raw.id,
    name: raw.name,
    height: raw.height || raw.heightMeters || null,
    weight: raw.weight || raw.weightKg || null,

    sprites: {
      front_default: raw.sprites?.front_default || raw.sprites?.frontDefault || raw.sprite || ''
    },

    stats: (raw.stats || []).map(s => ({
      stat: { name: s.stat?.name || s.name || "unknown" },
      base_stat: s.base_stat || s.value || 0
    })),

    moves: (raw.moves || []).map(m => ({
      move: { name: m.move?.name || m.name || "unknown" }
    })),

    types: (raw.types || raw.type || []).map(t => ({
      type: { name: t.type?.name || t.name || t }
    }))
  };
}

(function () {
  const API_BASE = '';   // same-origin backend

  // ❤️ FAVORITE SYSTEM (LOCALSTORAGE)
  const FAV_KEY = 'pokedex_favorites_v1';

  function getFavorites() {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  }
  function saveFavorites(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
  }
  function isFavorite(id) {
    return getFavorites().includes(id);
  }
  function toggleFavorite(pokemon, button) {
    let list = getFavorites();
    if (isFavorite(pokemon.id)) {
      list = list.filter(x => x !== pokemon.id);
      button.innerHTML = '🤍';
    } else {
      list.push(pokemon.id);
      button.innerHTML = '❤️';
    }
    saveFavorites(list);
  }

  // Elements
  const searchBox = document.getElementById('searchBox');
  const searchBtn = document.getElementById('searchBtn');
  const typeFilter = document.getElementById('typeFilter');
  const limitInput = document.getElementById('limitInput');
  const offsetInput = document.getElementById('offsetInput');
  const fetchAllBtn = document.getElementById('fetchAllBtn');
  const showRecentBtn = document.getElementById('showRecentBtn');
  const recentContainer = document.getElementById('recentContainer');
  const recentSearchesEl = document.getElementById('recentSearches');
  const singleResult = document.getElementById('singleResult');
  const pokemonGrid = document.getElementById('pokemonGrid');
  const modalEl = document.getElementById('pokemonModal');
  const modalName = document.getElementById('modalName');
  const modalDetails = document.getElementById('modalDetails');
  const showFavBtn = document.getElementById('showFavBtn');  // NEW BUTTON

  const recentKey = 'pokedex_recent_searches_v1';
  const typesStatic = [
  { name: "normal", icon: "⚪" },
  { name: "fire", icon: "🔥" },
  { name: "water", icon: "💧" },
  { name: "grass", icon: "🌿" },
  { name: "electric", icon: "⚡" },
  { name: "ice", icon: "❄️" },
  { name: "fighting", icon: "🥊" },
  { name: "poison", icon: "☠️" },
  { name: "ground", icon: "🌍" },
  { name: "flying", icon: "🕊️" },
  { name: "psychic", icon: "🔮" },
  { name: "bug", icon: "🐛" },
  { name: "rock", icon: "🪨" },
  { name: "ghost", icon: "👻" },
  { name: "dragon", icon: "🐉" },
  { name: "dark", icon: "🌑" },
  { name: "steel", icon: "⚙️" },
  { name: "fairy", icon: "🧚" }
];


  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function populateTypes() { fillTypeSelect(typesStatic); }
  function fillTypeSelect(list) {
  list.forEach(t => {
    const value = t.name.toLowerCase();
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = `${t.icon}  ${value[0].toUpperCase() + value.slice(1)}`;
    typeFilter.appendChild(opt);
  });
}


  // RECENT SEARCHES
  function loadRecent() {
    try {
      const raw = localStorage.getItem(recentKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveRecent(item) {
    const list = loadRecent();
    const normalized = item.toString().toLowerCase();
    const filtered = [normalized, ...list.filter(x => x !== normalized)].slice(0, 10);
    localStorage.setItem(recentKey, JSON.stringify(filtered));
    renderRecent();
  }
  function renderRecent() {
    const items = loadRecent();
    recentSearchesEl.innerHTML = '';
    items.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = s;
      btn.addEventListener('click', () => doSearch(s));
      recentSearchesEl.appendChild(btn);
    });
  }

  // FETCH FULL DETAILS WHEN CLICK VIEW DETAILS
  async function showDetailsFromSummary(name) {
    try {
      modalName.textContent = `Loading ${name}...`;
      modalDetails.innerHTML = `<div class="d-flex justify-content-center py-4"><div class="spinner-border"></div></div>`;
      const res = await fetchPokemonByName(name);
      const full = normalizePokemon(res);
      showModal(full);
    } catch (err) {
      modalName.textContent = "Error";
      modalDetails.innerHTML = `<div class="alert alert-danger">Failed to load details</div>`;
      new bootstrap.Modal(modalEl).show();
    }
  }

  // CARD RENDERING (FAVORITE ADDED HERE)
 function makeCard(pokemonSummary) {
  const name = pokemonSummary.name;
  const col = document.createElement('div');
  col.className = 'col';

  const card = document.createElement('div');
  card.className = 'card pokemon-card h-100';

  const img = document.createElement('img');
  img.className = 'card-img-top sprite p-3 bg-light';
  img.src = pokemonSummary.sprites?.front_default || '';
  img.alt = pokemonSummary.name;

  const body = document.createElement('div');
  body.className = 'card-body';

  const title = document.createElement('h5');
  title.className = 'card-title text-capitalize';
  title.textContent = `${pokemonSummary.name} (#${pokemonSummary.id})`;

  const typesWrap = document.createElement('div');
  (pokemonSummary.types || []).forEach(t => {
    const span = document.createElement('span');
    const typeName = t.type?.name || t;  
    span.className = `badge ${typeName} text-capitalize`;
    span.textContent = typeName;
    typesWrap.appendChild(span);
  });

  // ⭐ ADD FAVORITE BUTTON
  const favBtn = document.createElement('button');
  favBtn.className = 'btn btn-outline-danger btn-sm ms-2';
  favBtn.innerHTML = isFavorite(pokemonSummary.id) ? '❤️' : '🤍'; 
  favBtn.onclick = () => toggleFavorite(pokemonSummary, favBtn); 

  const footer = document.createElement('div');
  footer.className = 'card-footer bg-transparent d-flex justify-content-between';
  
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm btn-outline-primary';
  btn.textContent = 'View Details';
  btn.onclick = () => showDetailsFromSummary(name);

  body.appendChild(title);
  body.appendChild(typesWrap);

  footer.appendChild(btn);
  footer.appendChild(favBtn);  // ⭐ ADD HERE

  card.appendChild(img);
  card.appendChild(body);
  card.appendChild(footer);
  col.appendChild(card);

  return col;
}


  function renderSingle(pokemon) {
  singleResult.innerHTML = '';   // Clear old
  const wrapper = document.createElement('div');
  wrapper.className = 'pokemon-search-card mx-auto shadow-lg p-4 rounded-4';

  const card = makeCard(pokemon);   // creates DOM element WITH events
  wrapper.appendChild(card);
  singleResult.appendChild(wrapper);

  pokemonGrid.innerHTML = ''; // Hide list
}



  function renderGrid(list) {
  singleResult.innerHTML = '';
  pokemonGrid.innerHTML = '';

  list.forEach((p, i) => {
    const card = makeCard(p);
    card.style.animation = `fadeIn .4s ease ${(i * 0.05)}s forwards`;
    pokemonGrid.appendChild(card);
  });
}


 function showModal(pokemon) {
  const p = normalizePokemon(pokemon);

  modalName.textContent = `${p.name} (#${p.id})`;

  // ⭐ Conditionally styled progress bar for stats
  const statsHTML = (p.stats || []).map(s => {
    const val = s.base_stat;
    let color = "bg-danger";   // < 50
    if (val > 75) color = "bg-success";     // > 75
    else if (val >= 50) color = "bg-warning"; // 50–75

    return `
      <div class="mb-2">
        <strong>${s.stat.name}</strong>
        <div class="progress">
          <div class="progress-bar ${color}" role="progressbar"
            style="width: ${val}%;" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="100">
            ${val}
          </div>
        </div>
      </div>
    `;
  }).join('');

  modalDetails.innerHTML = `
    <div class="row align-items-center mb-3">
      <div class="col-md-4 text-center">
        <img src="${p.sprites.front_default}" class="img-fluid shadow-sm rounded">
      </div>
      <div class="col-md-8">
        <h5 class="mb-2"><span class="badge bg-primary">Height: ${p.height}</span></h5>
        <h5><span class="badge bg-secondary">Weight: ${p.weight}</span></h5>
      </div>
    </div>

    <hr>

    <h5 class="text-center mb-3">⚡ Stats</h5>
    ${statsHTML}

    <hr>

    <h5 class="text-center mt-3">✨ Top Moves</h5>
    <div class="d-flex flex-wrap gap-2">
      ${(p.moves || []).slice(0,10).map(m => `
        <span class="badge bg-dark">${m.move.name}</span>
      `).join('')}
    </div>
  `;

  new bootstrap.Modal(modalEl).show();
}


  async function fetchPokemonByName(name) {
    const res = await axios.get(`/api/pokemon/${encodeURIComponent(name)}`);
    return res.data;
  }

  async function fetchPokemonList(limit=50, offset=0, type='') {
    const params = new URLSearchParams({ limit, offset, type });
    const res = await axios.get(`/api/pokemon?${params}`);
    return res.data;
  }

  // async function doSearch(term) {
  //   if (!term) return;
  //   showLoading(singleResult);
  //   try {
  //     const res = await fetchPokemonByName(term);
  //     renderSingle(normalizePokemon(res));
  //     saveRecent(term);
  //   } catch {
  //     singleResult.innerHTML = `<div class="alert alert-warning">Not found</div>`;
  //   }
  // }

  async function doSearch(term) {
  if (!term) return;

  showLoading(singleResult);
  clearUI();  // <--- NEW (clear old content)

  try {
    // 1️⃣ Try exact match first
    const res = await fetchPokemonByName(term);
    renderSingle(normalizePokemon(res));
    saveRecent(term);
  } catch {
    // 2️⃣ If exact not found → do partial search
    await searchPartial(term.toLowerCase());
  }
}

async function searchPartial(term) {
  showLoading(pokemonGrid);

  // if list not loaded yet → fetch all
  if (allPokemons.length === 0) {
    const res = await fetchPokemonList(1400, 0, '');
    allPokemons = res.data.map(normalizePokemon);
  }

  // filter by starting letters
  const results = allPokemons.filter(p => p.name.startsWith(term));

  if (results.length === 0) {
    pokemonGrid.innerHTML = `<div class="alert alert-warning">No matches found</div>`;
    return;
  }

  renderGrid(results.slice(0, 20));  // show first 20 matches
}

searchBox.addEventListener('keyup', debounce(() => {
  const term = searchBox.value.trim().toLowerCase();
  doSearch(term);
}, 400));


async function doFetchList(page = 1) {
  let limit = 1400;
  const offset = 0;
  const type = typeFilter.value;

  // ⬇️ If type selected → request more Pokémon
  if (type) {
    limit = 1000;  // fetch all Pokémon once
  }

  showLoading(pokemonGrid);

  const res = await fetchPokemonList(limit, offset, type);
  allPokemons = res.data.map(normalizePokemon); 

  const total = allPokemons.length;

  if (total === 0) {
    pokemonGrid.innerHTML = `<div class="alert alert-warning">No Pokémon found!</div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const itemsPerPage = 20; // STILL PAGINATE AFTER FETCH
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const selectedPageData = allPokemons.slice(startIndex, endIndex);

  renderGrid(selectedPageData);

  const totalPages = Math.ceil(total / itemsPerPage);
  renderPagination(page, totalPages);
}




function renderPagination(currentPage, totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const createButton = (text, page, isActive = false) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `btn btn-sm ${isActive ? "btn-primary" : "btn-outline-secondary"}`;
    button.onclick = () => doFetchList(page);
    return button;
  };

  // 🔹 PREVIOUS BUTTON
  if (currentPage > 1) {
    pagination.appendChild(createButton("Prev", currentPage - 1));
  }

  if (currentPage > 2) {
    pagination.appendChild(createButton(1, 1, currentPage === 1));

    if (currentPage > 3) {
      pagination.appendChild(createButton("...", currentPage - 2));
    }
  }

  for (let page = currentPage - 1; page <= currentPage + 1; page++) {
    if (page >= 1 && page <= totalPages) {
      pagination.appendChild(createButton(page, page, page === currentPage));
    }
  }

  if (currentPage < totalPages - 1) {
    if (currentPage < totalPages - 2) {
      pagination.appendChild(createButton("...", currentPage + 2));
    }
    pagination.appendChild(createButton(totalPages, totalPages, currentPage === totalPages));
  }

  if (currentPage < totalPages) {
    pagination.appendChild(createButton("Next", currentPage + 1));
  }
}




  function showLoading(container) {
    container.innerHTML = `<div class="d-flex justify-content-center py-4"><div class="spinner-border"></div></div>`;
  }

  // SHOW ❤️ FAVORITES PAGE
  async function showFavorites() {
    const favIds = getFavorites();
    const list = [];
    for (const id of favIds) {
      const res = await fetchPokemonByName(id);
      list.push(normalizePokemon(res));
    }
    renderGrid(list);
  }

  // UI Events
  const debouncedSearch = debounce(() => doSearch(searchBox.value.trim()), 350);
  searchBtn.addEventListener('click', () => doSearch(searchBox.value.trim()));
  typeFilter.addEventListener('change', () => { doFetchList(1); });

function clearUI() {
  singleResult.innerHTML = '';
  pokemonGrid.innerHTML = '';
  document.getElementById("pagination").innerHTML = '';
  recentContainer.style.display = "none";
}

// UI EVENTS
fetchAllBtn.addEventListener('click', () => {
  clearUI();
  doFetchList(1);
});

showFavBtn.addEventListener('click', async () => {
  clearUI();
  await showFavorites();
});

showRecentBtn.addEventListener('click', () => {
  clearUI();
  recentContainer.style.display = "block";
  renderRecent();
});


  


  (function init() {
    populateTypes();
    renderRecent();
    searchBox.focus();
  })();
})();
