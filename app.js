/**
 * App.js - Logique principale pour la page d'accueil
 * Gère le chargement des mods, le filtrage et la pagination
 */

document.addEventListener('DOMContentLoaded', function () {
    // Éléments DOM
    const modsGrid = document.getElementById('modsGrid');
    const pagination = document.getElementById('pagination');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Variables d'état
    let allMods = [];
    let filteredMods = [];
    let currentFilter = 'all';
    let currentPage = 1;
    const modsPerPage = 13; // 4 colonnes × 3 lignes

    /**
     * Initialise l'application
     */
    async function init() {
        try {
            // Charger les mods depuis le fichier JSON
            const response = await fetch('mods.json');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            allMods = await response.json();

            // Initialiser les mods filtrés
            filteredMods = [...allMods];

            // Afficher les mods
            renderMods();
            renderPagination();

            // Initialiser les filtres
            initFilters();

        } catch (error) {
            console.error('Erreur lors du chargement des mods:', error);
            modsGrid.innerHTML = `
                <div class="error-message">
                    <h2>Erreur de chargement</h2>
                    <p>Impossible de charger les mods. Veuillez réessayer plus tard.</p>
                </div>
            `;
        }
    }

    /**
     * Initialise les boutons de filtre
     */
    function initFilters() {
        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Retirer la classe active de tous les boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));

                // Ajouter la classe active au bouton cliqué
                this.classList.add('active');

                // Mettre à jour le filtre courant
                currentFilter = this.dataset.filter;
                currentPage = 1; // Retour à la première page

                // Filtrer les mods
                if (currentFilter === 'all') {
                    filteredMods = [...allMods];
                } else {
                    filteredMods = allMods.filter(mod => mod.game === currentFilter);
                }

                // Re-rendre les mods et la pagination
                renderMods();
                renderPagination();
            });
        });
    }

    /**
     * Affiche les mods dans la grille
     */
    function renderMods() {
        const startIndex = (currentPage - 1) * modsPerPage;
        const endIndex = startIndex + modsPerPage;
        const modsToShow = filteredMods.slice(startIndex, endIndex);

        if (modsToShow.length === 0) {
            modsGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>Aucun mod trouvé</h3>
                    <p>Aucun mod ne correspond à vos critères de recherche.</p>
                </div>
            `;
            return;
        }

        let modsHTML = '';

        modsToShow.forEach((mod, index) => {
            modsHTML += `
                <article class="mod-card">
                    <img src="${mod.images[0]}" alt="${mod.titre}" class="mod-image" loading="lazy">
                    <div class="mod-content">
                        <span class="mod-game ${mod.game === 'BeamNG' ? 'beamng' : 'assetto'}">
                            ${mod.game}
                        </span>
                        <h3 class="mod-title">${mod.titre}</h3>
                        <a href="mod.html?id=${mod.id}" class="btn btn-secondary">Voir le mod</a>
                    </div>
                </article>
            `;

            // Tous les 6 blocs, insérer une Google Ads Display
            if ((index + 1) % 4 === 0) {
                modsHTML += `
                    <div class="google-ads-container" style="width: 100%; margin: 2rem 0; text-align: center;">
                        <ins class="adsbygoogle"
                            style="display:block"
                            data-ad-client="ca-pub-6673051296949586"
                            data-ad-slot="3291285424"
                            data-ad-format="auto"
                            data-full-width-responsive="true"></ins>
                    </div>
                `;
            }
        });

        modsGrid.innerHTML = modsHTML;

        // Initialiser les ads Google pour ce nouveau contenu
        if (window.adsbygoogle && window.adsbygoogle.loaded !== undefined) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('Adsense error', e);
            }
        }
    }


    /**
     * Génère les boutons de pagination
     */
    function renderPagination() {
        // Calculer le nombre total de pages
        const totalPages = Math.ceil(filteredMods.length / modsPerPage);

        // Si une seule page ou moins, ne pas afficher la pagination
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        // Générer les boutons de pagination
        let paginationHTML = '';

        // Bouton précédent
        paginationHTML += `
            <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
                &laquo; Précédent
            </button>
        `;

        // Boutons de page
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 2)) {
                paginationHTML += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 3) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }

        // Bouton suivant
        paginationHTML += `
            <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                Suivant &raquo;
            </button>
        `;

        // Mettre à jour la pagination
        pagination.innerHTML = paginationHTML;

        // Ajouter les événements de pagination
        initPaginationEvents();
    }

    /**
     * Initialise les événements de pagination
     */
    function initPaginationEvents() {
        // Boutons de page
        document.querySelectorAll('.page-btn[data-page]').forEach(button => {
            button.addEventListener('click', function () {
                currentPage = parseInt(this.dataset.page);
                renderMods();
                renderPagination();
                window.scrollTo({ top: modsGrid.offsetTop - 100, behavior: 'smooth' });
            });
        });

        // Bouton précédent
        const prevBtn = document.querySelector('.prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                if (currentPage > 1) {
                    currentPage--;
                    renderMods();
                    renderPagination();
                    window.scrollTo({ top: modsGrid.offsetTop - 100, behavior: 'smooth' });
                }
            });
        }

        // Bouton suivant
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                const totalPages = Math.ceil(filteredMods.length / modsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderMods();
                    renderPagination();
                    window.scrollTo({ top: modsGrid.offsetTop - 100, behavior: 'smooth' });
                }
            });
        }
    }

    // Initialiser l'application
    init();
});
