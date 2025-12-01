/**
 * detail.js - Logique pour la page de détail d'un mod
 * Gère le chargement et l'affichage des détails d'un mod spécifique
 */

document.addEventListener('DOMContentLoaded', function () {
    // Éléments DOM
    const modDetails = document.getElementById('modDetails');
    const errorMessage = document.getElementById('errorMessage');

    /**
     * Récupère l'ID du mod depuis l'URL
     * @returns {string|null} L'ID du mod ou null si non trouvé
     */
    function getModIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Cache l'élément de chargement
     */
    function hideLoading() {
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Affiche le message d'erreur et cache le chargement
     */
    function showError() {
        hideLoading();
        if (modDetails) modDetails.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'block';
    }

    /**
     * Charge les détails du mod
     */
    async function loadModDetails() {
        const modId = getModIdFromURL();

        if (!modId) {
            showError();
            return;
        }

        try {
            // Charger tous les mods
            const response = await fetch('mods.json');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const allMods = await response.json();

            // Trouver le mod correspondant à l'ID
            const mod = allMods.find(m => m.id === modId);

            if (!mod) {
                showError();
                return;
            }

            // Afficher les détails du mod
            displayModDetails(mod);

            // Mettre à jour les métadonnées pour le SEO
            updateMetaTags(mod);

        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
            showError();
        }
    }

    /**
     * Affiche les détails du mod dans la page
     * @param {Object} mod - L'objet mod à afficher
     */
    function displayModDetails(mod) {
        // Générer le HTML pour la galerie d'images
        const imagesHTML = mod.images.map(img =>
            `<img src="${img}" alt="${mod.titre}" class="gallery-image" loading="lazy">`
        ).join('');

        // Déterminer la classe CSS pour le badge du jeu
        const gameClass = mod.game === 'BeamNG' ? 'beamng' : 'assetto';

        // Générer le HTML complet
        const modHTML = `
            <div class="mod-detail">
                <div class="mod-header">
                    <h2>${mod.titre}</h2>
                    <span class="mod-game-badge ${gameClass}">${mod.game}</span>
                </div>
                ${mod.images.length > 0 ? `
                    <div class="image-gallery">
                        <h3 class="section-title">Images</h3>
                        <div class="gallery-container">
                            ${imagesHTML}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mod-description-full">
                    <p>${mod.description}</p>
                </div>
                
                
                
                <div class="mod-actions">
                    <a href="${mod.download}" class="btn download-btn" target="_blank" rel="noopener noreferrer">
                        Télécharger le mod
                    </a>
                    <a href="http://127.0.0.1:5500/" class="btn btn-secondary">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        `;

        // Mettre à jour le contenu de la page
        if (modDetails) {
            modDetails.innerHTML = modHTML;
            hideLoading();
        }
    }

    /**
     * Met à jour les métadonnées pour le SEO
     * @param {Object} mod - L'objet mod
     */
    function updateMetaTags(mod) {
        // Mettre à jour le titre
        document.title = `ModHub - ${mod.titre}`;

        // Mettre à jour la méta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content',
                `${mod.titre} - ${mod.description.substring(0, 150)}... Téléchargez ce mod pour ${mod.game} sur ModHub.`);
        }

        // Mettre à jour les Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', `ModHub - ${mod.titre}`);
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content',
                `${mod.description.substring(0, 200)}...`);
        }

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && mod.images.length > 0) {
            ogImage.setAttribute('content', mod.images[0]);
        }
    }

    // Charger les détails du mod
    loadModDetails();
});