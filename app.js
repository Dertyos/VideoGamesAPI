// Configuración entorno de consumo
const API_KEY = "3da1209fc32c46c696a07ca78dd07f40" // API generada desde la Pagina (https://rawg.io/apidocs)
const BASE_URL = "https://api.rawg.io/api"
const GAMES_PER_PAGE = 12


// Estados
let currentPage = 1
let currentSearch = ""
let currentGenre = "all"
let allGames = []

// Alamacenamiento Local
const STORAGE_KEYS = {
  FAVORITES: "gameExplorer_favorites",
  THEME: "gameExplorer_theme",
  RECENT_SEARCHES: "gameExplorer_recentSearches",
}

// Inicializar Proyecto
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  initializeEventListeners()
  loadRecentSearches()
  loadPopularGames()
  updateFavoritesCount()
})

// Manejo de Tema (Claro - Oscuro)
function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
}

// Eventos del Sistema
function initializeEventListeners() {
  // Cambio de Tema
  document.getElementById("btnTheme").addEventListener("click", toggleTheme)
  
  // Busqueda
  document.getElementById("btnSearch").addEventListener("click", handleSearch)
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch()
    })
  
  // Filtros
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", handleFilterClick)
  })
  
  // Activar sección de favoritos
  document.getElementById("btnFavorites").addEventListener("click", showFavorites)
  document.getElementById("btnCloseModal").addEventListener("click", closeModal)
  document.getElementById("btnCloseDetailModal").addEventListener("click", closeDetailModal)
  
  // Cargar mas videojuegos
  document.getElementById("btnLoadMore").addEventListener("click", loadMoreGames)
  
  // Cerrar el modal de favoritos
  document.getElementById("favoritesModal").addEventListener("click", (e) => {
    if (e.target.id === "favoritesModal") closeModal()
    })
  
  document.getElementById("gameDetailModal").addEventListener("click", (e) => {
    if (e.target.id === "gameDetailModal") closeDetailModal()
    })
}

// Funciones incorporadas de la API
async function fetchGames(search = "", genre = "all", page = 1) {
  const loading = document.getElementById("loading")
  loading.classList.add("active")
  
  try {
    let url = `${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=${GAMES_PER_PAGE}`
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    
    if (genre !== "all") {
      url += `&genres=${genre}`
    }
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.results
  } catch (error) {
    console.error("Error consumiendo servicio de API:", error)
    return []
  } finally {
    loading.classList.remove("active")
  }
}

async function fetchGameDetails(gameId) {
  try {
    const response = await fetch(`${BASE_URL}/games/${gameId}?key=${API_KEY}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro consumiendo detalles del Videojuego:", error)
    return null
  }
}

// Mostrar Funcionalidades
function displayGames(games, append = false) {
  const grid = document.getElementById("gamesGrid")
  
  if (!append) {
    grid.innerHTML = ""
    allGames = []
  }
  
  allGames = [...allGames, ...games]
  
  games.forEach((game) => {
    const card = createGameCard(game)
    grid.appendChild(card)
  })
}

// Crear tarjeta de videjuego
function createGameCard(game) {
  const card = document.createElement("div")
  card.className = "game-card"
  
  const isFavorite = checkIfFavorite(game.id)
  const rating = game.rating || 0
  const stars = generateStars(rating)

  card.innerHTML = `
  <img src="${game.background_image || "/placeholder.svg?height=200&width=300"}" alt="${game.name}" class="game-image">
  <div class="game-content">
  <div class="game-header">
  <h3 class="game-title">${game.name}</h3>
                <button class="btn-favorite ${isFavorite ? "active" : ""}" data-game-id="${game.id}">
                    <img src="${isFavorite ? "svg/heart-full.svg" : "svg/heart-empty.svg"}" width="24" height="24" alt="Favorito">
                </button>
            </div>
  
  <div class="game-rating">
  <div class="rating-stars">${stars}</div>
  <span class="rating-number">${rating.toFixed(1)}</span>
  </div>
  
  <div class="game-genres">
  ${
    game.genres
    ? game.genres
    .slice(0, 3)
    .map((g) => `<span class="genre-tag">${g.name}</span>`)
    .join("")
    : ""
  }
  </div>
  
  <div class="game-platforms">
  ${getPlatformIcons(game.platforms)}
  </div>
  </div>
  `
  
  // Verificador de evento (Agregar a favoritos)
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".btn-favorite")) {
      showGameDetail(game.id)
    }
  })
  
  const favoriteBtn = card.querySelector(".btn-favorite")
  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    toggleFavorite(game)
  })
  
  return card
}

// Manejo de iconos
const PLATFORM_ICONS = {
  pc: "svg/plataform/Computer.svg",
  playstation: "svg/plataform/PlayStation.svg",
  playstation3: "svg/plataform/PlayStation.svg",
  playstation4: "svg/plataform/PlayStation.svg",
  playstation5: "svg/plataform/PlayStation.svg",
  xbox: "svg/plataform/Xbox.svg",
  "xbox-one": "svg/plataform/Xbox.svg",
  "xbox-series-x": "svg/plataform/Xbox.svg",
  nintendo: "svg/plataform/Nintendo.svg",
  "nintendo-switch": "svg/plataform/Nintendo.svg",
  ios: "svg/plataform/iOS.svg",
  android: "svg/plataform/Android.svg",
  linux: "svg/plataform/Linux.svg",
  macos: "svg/plataform/MacOS.svg",
}

function getPlatformIcons(platforms) {
  if (!platforms) return ""
  const seen = new Set()
  const icons = []
  for (const p of platforms) {
    const slug = p.platform.slug.toLowerCase()
    const icon = PLATFORM_ICONS[slug]
    if (icon && !seen.has(icon)) {
      seen.add(icon)
      icons.push(`<img src="${icon}" class="platform-icon">`)
      if (icons.length === 4) break
    }
  }
  return icons.join("")
}


// Generación de calificación mediante estrellas.
function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  let stars = ""

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
    } else if (i === fullStars && hasHalfStar) {
      stars +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" opacity="0.5"></polygon></svg>'
    } else {
      stars +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
    }
  }

  return stars
}

// Obtener iconos de la plataforma
function getPlatformIcon(platformName) {
  const name = platformName.toLowerCase()

  if (name.includes("playstation")) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8.985 2.596v17.548l3.664 1.244V0zm10.368 12.36c-.696.563-2.028.876-3.412.876-1.387 0-2.72-.313-3.412-.876v3.335c0 .696.875 1.084 3.412 1.084 2.54 0 3.412-.388 3.412-1.084zm-3.412-9.956v8.68c1.664 0 3.108-.466 3.108-1.663 0-1.197-1.444-1.663-3.108-1.663 0-1.66-.132-3.353.132-5.354h3.412C19.485 2.596 16.508 0 12.845 0c-3.664 0-6.641 2.596-6.641 5.354z"/></svg>'
  } else if (name.includes("xbox")) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4.102 21.033A11.947 11.947 0 0012 24a11.96 11.96 0 007.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0024 12.004a11.95 11.95 0 00-3.57-8.536 12.14 12.14 0 00-1.913-1.535 20.467 20.467 0 00-3.255 4.694zM12 3.59S9.977 1.922 7.846.384C5.842-.89 3.992.701 2.668 2.05A11.956 11.956 0 000 12.004c0 2.854.998 5.473 2.662 7.533 1.384-2.599 6.371-9.95 8.871-12.912.001 0 .001-.001.001-.001.002.001.465-.026.466-.034zm2.277 5.014s-4.076 4.82-6.57 7.576c-2.494 2.756-3.854 4.514-4.21 4.893.229.201.469.39.718.567 2.136 1.538 7.694 6.767 7.694 6.767s-.924-1.91-.924-7.868c0-5.958.924-7.868.924-7.868l6.646-6.646-4.278-4.278z"/></svg>'
  } else if (name.includes("nintendo")) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v24h24V0zm15.5 19a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>'
  } else if (name.includes("pc")) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM4 14V4h16v10H4zm18 6H2v-2h20v2z"/></svg>'
  }

  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>'
}

// Manejo sección favoritos
function toggleFavorite(game) {
  const favorites = getFavorites()
  const index = favorites.findIndex((fav) => fav.id === game.id)

  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push({
      id: game.id,
      name: game.name,
      image: game.background_image,
      rating: game.rating,
      genres: game.genres,
    })
  }

  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
  updateFavoritesCount()

  // Actualizar interfaz
  document.querySelectorAll(`.btn-favorite[data-game-id="${game.id}"]`).forEach((btn) => {
    btn.classList.toggle("active")
    const img = btn.querySelector("img")
    if (img) {
      const nowFavorite = checkIfFavorite(game.id)
      img.setAttribute("src", nowFavorite ? "svg/heart-full.svg" : "svg/heart-empty.svg")
    }
  })
}

// Obtener Favoritos
function getFavorites() {
  const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES)
  return favorites ? JSON.parse(favorites) : []
}

// Verificar si hace parte de los favoritos
function checkIfFavorite(gameId) {
  const favorites = getFavorites()
  return favorites.some((fav) => fav.id === gameId)
}

// Actualizar el conteo de favoritos
function updateFavoritesCount() {
  const count = getFavorites().length
  document.querySelector(".favorites-count").textContent = count
}

// Mostrar videojuegos guardados en favoritos
function showFavorites() {
  const favorites = getFavorites()
  const modal = document.getElementById("favoritesModal")
  const content = document.getElementById("favoritesContent")

  if (favorites.length === 0) {
    content.innerHTML = `
            <div class="empty-state">
                <img src="svg/heart-empty.svg" width="24" height="24" alt="Vacío">
                <h3>No tienes favoritos aún</h3>
                <p>Empieza a explorar juegos y guarda tus favoritos aquí</p>
            </div>
        `
  } else {
    content.innerHTML = `
            <div class="games-grid">
                ${favorites
                  .map(
                    (game) => `
                    <div class="game-card">
                        <img src="${game.image}" alt="${game.name}" class="game-image">
                        <div class="game-content">
                            <div class="game-header">
                                <h3 class="game-title">${game.name}</h3>
                                <button class="btn-favorite active" data-game-id="${game.id}" onclick="toggleFavorite({id: ${game.id}, name: '${game.name}', background_image: '${game.image}', rating: ${game.rating}})">
                                    <img src="svg/heart-full.svg" width="24" height="24" alt="Favorito">
                                </button>
                            </div>
                            <div class="game-rating">
                                <div class="rating-stars">${generateStars(game.rating)}</div>
                                <span class="rating-number">${game.rating.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `
  }

  modal.classList.add("active")
}

// Cerrar el modal de favoritos
function closeModal() {
  document.getElementById("favoritesModal").classList.remove("active")
}

// Manejo de consulta (Filtros)
function handleSearch() {
  const searchInput = document.getElementById("searchInput")
  const query = searchInput.value.trim()

  if (!query) return

  currentSearch = query
  currentPage = 1

  saveRecentSearch(query)
  loadRecentSearches()

  document.getElementById("sectionTitle").textContent = `Resultados para "${query}"`
  document.getElementById("sectionSubtitle").textContent = "Juegos encontrados"

  fetchGames(query).then((games) => displayGames(games))
}

// Almacenar consultas recientes (cache consultas)
function saveRecentSearch(query) {
  let searches = getRecentSearches()
  searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase())
  searches.unshift(query)
  searches = searches.slice(0, 5)

  localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches))
}

// Obtener consultas recientes
function getRecentSearches() {
  const searches = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
  return searches ? JSON.parse(searches) : []
}

// Cargar consolidado de consultas recientes
function loadRecentSearches() {
  const searches = getRecentSearches()
  const container = document.getElementById("recentSearches")

  if (searches.length === 0) {
    container.innerHTML = ""
    return
  }

  container.innerHTML = searches
    .map(
      (search) => `
        <div class="recent-tag" onclick="document.getElementById('searchInput').value='${search}'; handleSearch();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            ${search}
        </div>
    `,
    )
    .join("")
}

// Botón de favoritos (Ejecutar visualización)
function handleFilterClick(e) {
  const btn = e.target
  const filter = btn.dataset.filter

  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
  btn.classList.add("active")

  currentGenre = filter
  currentSearch = ""
  currentPage = 1

  document.getElementById("searchInput").value = ""
  document.getElementById("sectionTitle").textContent =
    filter === "all" ? "Juegos Populares" : `Juegos de ${btn.textContent}`
  document.getElementById("sectionSubtitle").textContent =
    `Los mejores juegos ${filter === "all" ? "del momento" : "de " + btn.textContent.toLowerCase()}`

  fetchGames("", filter).then((games) => displayGames(games))
}

// Cargar Funciones sistema
function loadPopularGames() {
  fetchGames().then((games) => displayGames(games))
}

// Cargar mas videojuegos (asociado al boton de ver mas!)
function loadMoreGames() {
  currentPage++
  fetchGames(currentSearch, currentGenre, currentPage).then((games) => {
    displayGames(games, true)
  })
}

// Detalles del videjuego (Modal y data)
async function showGameDetail(gameId) {
  const modal = document.getElementById("gameDetailModal")
  const content = document.getElementById("gameDetailContent")

  content.innerHTML = '<div class="loading active"><div class="spinner"></div></div>'
  modal.classList.add("active")

  const game = await fetchGameDetails(gameId)

  if (!game) {
    content.innerHTML = '<div class="empty-state"><p>Error al cargar los detalles del juego</p></div>'
    return
  }

  const isFavorite = checkIfFavorite(game.id)

  content.innerHTML = `
        <div class="game-detail-hero">
            <img src="${game.background_image}" alt="${game.name}" class="game-detail-image">
            <div class="game-detail-overlay">
                <h2 class="game-detail-title">${game.name}</h2>
                <div class="game-detail-meta">
                    <span>⭐ ${game.rating}/5</span>
                    <span>📅 ${game.released || "TBA"}</span>
                    <span>🎮 ${game.playtime || 0} horas</span>
                </div>
            </div>
        </div>
        
        <div class="game-detail-info">
            <div style="display: flex; gap: 1rem;">
                <button class="btn-search" onclick="toggleFavorite({id: ${game.id}, name: '${game.name}', background_image: '${game.background_image}', rating: ${game.rating}, genres: ${JSON.stringify(game.genres).replace(/"/g, "&quot;")}})">
                    ${isFavorite ? "❤️ Quitar de Favoritos" : "🤍 Agregar a Favoritos"}
                </button>
                ${game.website ? `<a href="${game.website}" target="_blank" class="btn-load-more" style="text-decoration: none;">🌐 Sitio Web</a>` : ""}
            </div>
            
            <div class="info-section">
                <h3>📖 Descripción</h3>
                <p>${game.description_raw || "No hay descripción disponible."}</p>
            </div>
            
            <div class="info-section">
                <h3>🎯 Géneros</h3>
                <div class="game-genres">
                    ${game.genres ? game.genres.map((g) => `<span class="genre-tag">${g.name}</span>`).join("") : "N/A"}
                </div>
            </div>
            
            <div class="info-section">
                <h3>🎮 Plataformas</h3>
                <div class="platforms-list">
                    ${game.platforms ? game.platforms.map((p) => `<span class="platform-badge">${p.platform.name}</span>`).join("") : "N/A"}
                </div>
            </div>
            
            <div class="info-section">
                <h3>👥 Desarrolladores</h3>
                <p>${game.developers ? game.developers.map((d) => d.name).join(", ") : "N/A"}</p>
            </div>
            
            <div class="info-section">
                <h3>🏢 Publicadores</h3>
                <p>${game.publishers ? game.publishers.map((p) => p.name).join(", ") : "N/A"}</p>
            </div>
        </div>
    `
}

// Cerrar modal de detalles del videojuego
function closeDetailModal() {
  document.getElementById("gameDetailModal").classList.remove("active")
}
