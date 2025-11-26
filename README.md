# Pokédex Project
This is a simple Pokédex app with a frontend + backend.

# FRONT END SIDE
A **simple, interactive Pokédex web application** built using **plain JavaScript, Bootstrap, and a Node.js backend**.  
Users can search, filter, and explore Pokémon with features like favorites, recent searches, and pagination.

---

## 📝 Features

- Search Pokémon by Name or ID – Supports partial matches and live suggestions.
- Filter by Type – Easily filter Pokémon by type (e.g., Fire, Water, Grass).
- Favorites System – Mark/unmark Pokémon as favorite and view them separately.
- Recent Searches – Keeps track of the last 10 searches in local storage.
- Pagination – Efficiently browse large lists of Pokémon.
- Pokémon Details Modal – Displays height, weight, stats, and top moves.
- Responsive UI – Works on mobile, tablet, and desktop using Bootstrap.

---

## 💻 Tech Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js + Express (serving API and frontend)
- HTTP Requests: Axios
- Data Source: PokeAPI (via backend proxy)
- Storage: LocalStorage (for favorites and recent searches)

---

# BACK END SIDE
## Pokédex API Backend

This is the **backend server for the Pokédex project**, built using **Node.js, Express, Axios, and MongoDB**.  
It serves Pokémon data from the **PokeAPI**, caches results, and optionally persists them in a MongoDB database.

---

## 🛠️ Features

- Search Pokémon by Name or ID – Fetch a single Pokémon from API, cache, or database fallback.
- Get All Pokémon – Supports pagination (`limit` & `offset`) and type filtering.
- Get Pokémon by Type – Fetch Pokémon filtered by type.
- Partial Name Search – Search Pokémon by partial names (minimum 2 characters).
- Caching Layer – In-memory caching with TTL and automatic cleanup.
- Database Persistence – Optional MongoDB storage for fetched Pokémon.
- Cache Management – Endpoints to view cache stats and clear cache.
- Health Check – Endpoint to check server status.

---

## 📦 Tech Stack

- Backend: Node.js + Express  
- Database: MongoDB (via Mongoose)  
- API Requests: Axios  
- Caching: Custom in-memory cache with TTL  
- Middleware: CORS, Compression (optional), Express JSON parser

---

## 🚀 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API health and uptime |
| `/api/pokemon/:nameOrId` | GET | Fetch a single Pokémon by name or ID |
| `/api/pokemon` | GET | Fetch all Pokémon with optional pagination and type filter (`limit`, `offset`, `type`) |
| `/api/type/:typeName` | GET | Fetch Pokémon by type |
| `/api/search?q=partialName` | GET | Search Pokémon by partial name (min 2 chars) |
| `/api/cache/stats` | GET | Retrieve cache statistics |
| `/api/cache/clear` | POST | Clear all cache entries |

---

## ⚙️ Installation & Setup

1. **Clone the repository:**

```bash
git clone https://github.com/Thodetinarender/pokedex-project.git
cd pokedex-project
