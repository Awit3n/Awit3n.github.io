// Configuration globale
const CONFIG = {
    MODS_PER_PAGE: 6,
    DATA_FILE: 'data/mods.json'
};

// État de l'application
let state = {
    mods: [],
    filteredMods: [],
    currentPage: 1,
    filters: {
        game: 'all',
        category: 'all',
        type: 'all',
        author: '',
        version: ''
    }
};

// Fonction principale d'initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadMods();
    setupFilters();
    setupEventListeners();
    updateModsDisplay();
});

// Chargement des données
async function loadMods() {
    try {
        const response = await fetch(CONFIG.DATA_FILE);
        if (!response.ok) throw new Error('Erreur de chargement des données');
        
        const data = await response.json();
        state.mods = data.mods;
        state.filteredMods = [...state.mods];
        
        updateFiltersUI();
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les mods. Veuillez réessayer plus tard.');
    }
}

// Configuration des filtres
function setupFilters() {
    const filterSelects = [
        'game-filter',
        'category-filter',
        'type-filter',
        'author-filter',
        'version-filter'
    ];
    
    filterSelects.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', handleFilterChange);
            element.addEventListener('input', handleFilterChange);
        }
    });
    
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

// Mise à jour des options de filtres
function updateFiltersUI() {
    // Remplir les filtres avec les données disponibles
    updateFilterOptions('game-filter', getUniqueValues('game'));
    updateFilterOptions('category-filter', getUniqueValues('category'));
    updateFilterOptions('type-filter', getUniqueValues('type'));
}

function getUniqueValues(property) {
    const values = new Set(state.mods.map(mod => mod[property]));
    return Array.from(values).filter(Boolean);
}

function updateFilterOptions(filterId, values) {
    const select = document.getElementById(filterId);
    if (!select) return;
    
    // Sauvegarder la sélection actuelle
    const currentValue = select.value;
    
    // Remplir avec les nouvelles valeurs
    select.innerHTML = '<option value="all">Tous</option>';
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = formatFilterLabel(value);
        select.appendChild(option);
    });
    
    // Restaurer la sélection si possible
    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
}

function formatFilterLabel(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
}

// Gestion des changements de filtres
function handleFilterChange(event) {
    const { id, value } = event.target;
    
    switch(id) {
        case 'game-filter':
            state.filters.game = value;
            break;
        case 'category-filter':
            state.filters.category = value;
            break;
        case 'type-filter':
            state.filters.type = value;
            break;
        case 'author-filter':
            state.filters.author = value.toLowerCase();
            break;
        case 'version-filter':
            state.filters.version = value;
            break;
    }
    
    applyFilters();
}

function applyFilters() {
    state.filteredMods = state.mods.filter(mod => {
        // Filtre par jeu
        if (state.filters.game !== 'all' && mod.game !== state.filters.game) {
            return false;
        }
        
        // Filtre par catégorie
        if (state.filters.category !== 'all' && mod.category !== state.filters.category) {
            return false;
        }
        
        // Filtre par type
        if (state.filters.type !== 'all' && mod.type !== state.filters.type) {
            return false;
        }
        
        // Filtre par auteur
        if (state.filters.author && !mod.author.toLowerCase().includes(state.filters.author)) {
            return false;
        }
        
        // Filtre par version
        if (state.filters.version) {
            const modVersion = parseFloat(mod.version);
            const filterVersion = parseFloat(state.filters.version);
            if (isNaN(modVersion) || modVersion < filterVersion) {
                return false;
            }
        }
        
        return true;
    });
    
    state.currentPage = 1;
    updateModsDisplay();
}

function resetFilters() {
    state.filters = {
        game: 'all',
        category: 'all',
        type: 'all',
        author: '',
        version: ''
    };
    
    // Réinitialiser les champs UI
    document.getElementById('game-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('type-filter').value = 'all';
    document.getElementById('author-filter').value = '';
    document.getElementById('version-filter').value = '';
    
    applyFilters();
}

// Affichage des mods
function updateModsDisplay() {
    const container = document.getElementById('mods-container');
    const loading = document.getElementById('loading');
    
    if (!container || !loading) return;
    
    if (state.filteredMods.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>Aucun mod ne correspond aux filtres</h3>
                <p>Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        loading.style.display = 'none';
        return;
    }
    
    loading.style.display = 'none';
    
    // Calculer les mods à afficher pour la page actuelle
    const startIndex = (state.currentPage - 1) * CONFIG.MODS_PER_PAGE;
    const endIndex = startIndex + CONFIG.MODS_PER_PAGE;
    const modsToShow = state.filteredMods.slice(startIndex, endIndex);
    
    container.innerHTML = modsToShow.map(mod => createModCard(mod)).join('');
    
    updatePagination();
}

function createModCard(mod) {
    const gameClass = mod.game === 'beamng' ? 'beamng' : 'assetto';
    const description = mod.description.length > 150 
        ? mod.description.substring(0, 150) + '...'
        : mod.description;
    
    const badges = mod.badges.map(badge => 
        `<span class="badge ${badge}">${formatBadgeLabel(badge)}</span>`
    ).join('');
    
    return `
        <article class="mod-card" data-id="${mod.id}">
            <div class="mod-image">
                ${mod.images && mod.images.length > 0 
                    ? `<img src="${mod.images[0]}" alt="${mod.title}" loading="lazy">`
                    : '<span>Image non disponible</span>'}
            </div>
            <div class="mod-content">
                <div class="mod-header">
                    <h3 class="mod-title">${mod.title}</h3>
                    <div class="mod-meta">
                        <span class="mod-game ${gameClass}">${formatGameName(mod.game)}</span>
                        <span>${mod.author}</span>
                        <span>v${mod.version}</span>
                    </div>
                </div>
                <p class="mod-description">${description}</p>
                <div class="mod-footer">
                    <div class="mod-rating">
                        <div class="rating-stars">${generateStars(mod.rating)}</div>
                        <span>${mod.rating}/5</span>
                    </div>
                    <div class="badges">
                        ${badges}
                    </div>
                </div>
                <a href="mod.html?id=${mod.id}" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    Voir la fiche technique
                </a>
            </div>
        </article>
    `;
}

function formatGameName(game) {
    const names = {
        'beamng': 'BeamNG.drive',
        'assetto': 'Assetto Corsa'
    };
    return names[game] || game;
}

function formatBadgeLabel(badge) {
    const labels = {
        'tested': 'Testé',
        'stable': 'Stable',
        'optimized': 'Optimisé',
        'recommended': 'Recommandé'
    };
    return labels[badge] || badge;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (halfStar) stars += '★';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    
    return stars;
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(state.filteredMods.length / CONFIG.MODS_PER_PAGE);
    
    if (totalPages <= 1) {
        // Cacher la pagination si une seule page
        const existingPagination = document.getElementById('pagination');
        if (existingPagination) existingPagination.remove();
        return;
    }
    
    let pagination = document.getElementById('pagination');
    if (!pagination) {
        pagination = document.createElement('div');
        pagination.id = 'pagination';
        pagination.className = 'pagination';
        document.getElementById('mods-list').appendChild(pagination);
    }
    
    let html = `
        <button class="page-btn prev-btn" ${state.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${state.currentPage - 1})">
            Précédent
        </button>
        <div class="page-numbers">
    `;
    
    // Afficher jusqu'à 5 numéros de page
    const startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="${i === state.currentPage ? 'page-btn active' : 'page-btn '}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    html += `
        </div>
        <button class="page-btn next-btn" ${state.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${state.currentPage + 1})">
            Suivant
        </button>
    `;
    
    pagination.innerHTML = html;
}

// Fonction accessible globalement pour la pagination
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.filteredMods.length / CONFIG.MODS_PER_PAGE)) return;
    state.currentPage = page;
    updateModsDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Navigation des mods
    document.addEventListener('click', (e) => {
        if (e.target.closest('.mod-card')) {
            const card = e.target.closest('.mod-card');
            const modId = card.dataset.id;
            window.location.href = `mod.html?id=${modId}`;
        }
    });
    
    // Recherche instantanée
    const searchInput = document.getElementById('author-filter');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                handleFilterChange(e);
            }, 300);
        });
    }
}

// Gestion des erreurs
function showError(message) {
    const container = document.getElementById('mods-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>Erreur</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary">
                    Réessayer
                </button>
            </div>
        `;
    }
}

// Initialisation des pages mods individuelles
if (window.location.pathname.includes('mod.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        await initializeModPage();
    });
}

async function initializeModPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const modId = urlParams.get('id');
    
    if (!modId) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(CONFIG.DATA_FILE);
        const data = await response.json();
        const mod = data.mods.find(m => m.id === modId);
        
        if (!mod) {
            window.location.href = 'index.html';
            return;
        }
        
        renderModPage(mod);
        setupCommentSystem(modId);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function renderModPage(mod) {
    // Mettre à jour le titre de la page
    document.title = `${mod.title} - ModHub`;
    
    // Mettre à jour le breadcrumb
    updateBreadcrumb(mod);
    
    // Remplir les données du mod
    document.getElementById('mod-title').textContent = mod.title;
    document.getElementById('mod-author').textContent = `par ${mod.author}`;
    document.getElementById('mod-rating').innerHTML = generateStars(mod.rating);
    document.getElementById('mod-version').textContent = `Version ${mod.version}`;
    document.getElementById('mod-game').textContent = formatGameName(mod.game);
    document.getElementById('mod-category').textContent = mod.category;
    
    // Description
    document.getElementById('mod-description').innerHTML = 
        mod.longDescription || mod.description;
    
    // Changelog
    const changelogList = document.getElementById('changelog-list');
    if (changelogList && mod.changelog) {
        changelogList.innerHTML = mod.changelog.map(change => 
            `<li><strong>${change.version}</strong>: ${change.description}</li>`
        ).join('');
    }
    
    // Spécifications
    const specsTable = document.getElementById('specs-table');
    if (specsTable && mod.specifications) {
        specsTable.innerHTML = mod.specifications.map(spec => 
            `<tr>
                <td>${spec.name}</td>
                <td>${spec.value}</td>
                <td>${spec.notes || '-'}</td>
            </tr>`
        ).join('');
    }
    
    // Compatibilité
    const compatibilityList = document.getElementById('compatibility-list');
    if (compatibilityList && mod.compatibility) {
        compatibilityList.innerHTML = mod.compatibility.map(item => 
            `<li>${item}</li>`
        ).join('');
    }
    
    // Performances
    const performanceList = document.getElementById('performance-list');
    if (performanceList && mod.performance) {
        performanceList.innerHTML = Object.entries(mod.performance).map(([key, value]) => 
            `<li><strong>${formatPerformanceKey(key)}</strong>: ${value}</li>`
        ).join('');
    }
    
    // Comparatif
    const comparisonGrid = document.getElementById('comparison-grid');
    if (comparisonGrid && mod.comparison) {
        comparisonGrid.innerHTML = mod.comparison.map(comp => 
            `<div class="comparison-item">
                <h4>${comp.name}</h4>
                <p><strong>Points forts:</strong> ${comp.strengths}</p>
                <p><strong>Points faibles:</strong> ${comp.weaknesses}</p>
            </div>`
        ).join('');
    }
    
    // Points forts/limites
    const strengthsList = document.getElementById('strengths-list');
    const limitsList = document.getElementById('limits-list');
    
    if (strengthsList && mod.strengths) {
        strengthsList.innerHTML = mod.strengths.map(strength => 
            `<li>${strength}</li>`
        ).join('');
    }
    
    if (limitsList && mod.limits) {
        limitsList.innerHTML = mod.limits.map(limit => 
            `<li>${limit}</li>`
        ).join('');
    }
    
    // Tutoriel
    const tutorialSteps = document.getElementById('tutorial-steps');
    if (tutorialSteps && mod.tutorial) {
        tutorialSteps.innerHTML = mod.tutorial.map((step, index) => `
            <div class="tutorial-step">
                <div class="step-content">
                    <h4>Étape ${index + 1}: ${step.title}</h4>
                    <p>${step.description}</p>
                    ${step.warning ? `<p class="warning"><strong>⚠ Attention:</strong> ${step.warning}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // Galerie
    const gallery = document.getElementById('mod-gallery');
    if (gallery && mod.images) {
        gallery.innerHTML = mod.images.map((image, index) => `
            <div class="gallery-item">
                <img src="${image}" alt="${mod.title} - Image ${index + 1}" loading="lazy">
            </div>
        `).join('');
    }
    
    // Mise à jour du schéma JSON-LD
    updateJsonLd(mod);
}

function formatPerformanceKey(key) {
    const translations = {
        'fpsImpact': 'Impact sur les FPS',
        'stability': 'Stabilité',
        'memoryUsage': 'Utilisation mémoire',
        'loadingTime': 'Temps de chargement',
        'physicsLoad': 'Charge physique'
    };
    return translations[key] || key;
}

function updateBreadcrumb(mod) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="index.html">Accueil</a> > 
            <a href="mods.html">Mods</a> > 
            <a href="index.html?game=${mod.game}">${formatGameName(mod.game)}</a> > 
            <span>${mod.title}</span>
        `;
    }
}

function updateJsonLd(mod) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": mod.title,
        "applicationCategory": "GameMod",
        "operatingSystem": "Windows",
        "softwareVersion": mod.version,
        "datePublished": mod.releaseDate,
        "author": {
            "@type": "Person",
            "name": mod.author
        },
        "description": mod.description,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": mod.rating,
            "ratingCount": 1
        }
    });
    document.head.appendChild(script);
}

function setupCommentSystem(modId) {
    // Cette fonction sera complétée dans comments.js
    console.log('Système de commentaires initialisé pour le mod:', modId);
}