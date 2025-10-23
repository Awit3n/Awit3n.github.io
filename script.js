// Configuration des projets
const projects = {
    'FileShare': {
        path: '/FileShare/',
        title: 'FileShare',
        description: 'Partagez vos fichiers instantanément, sans serveur'
    }
    // Ajoutez de nouveaux projets ici
};

// Navigation vers un projet
function navigateToProject(projectName) {
    if (projects[projectName]) {
        window.location.href = projects[projectName].path;
    } else {
        console.log('Projet non trouvé:', projectName);
    }
}

// Animation d'entrée des éléments
document.addEventListener('DOMContentLoaded', function() {
    // Animation des cartes de projet
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Animation de la section à propos
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
        aboutSection.style.opacity = '0';
        aboutSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            aboutSection.style.transition = 'all 0.6s ease-out';
            aboutSection.style.opacity = '1';
            aboutSection.style.transform = 'translateY(0)';
        }, 300);
    }
});

// Effet de parallaxe sur les blobs
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const blobs = document.querySelectorAll('.blob');
    
    blobs.forEach((blob, index) => {
        const speed = 0.5 + (index * 0.1);
        blob.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Gestion des interactions tactiles pour mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        // Ajouter des effets de swipe si nécessaire
        console.log('Swipe détecté:', diff > 0 ? 'vers le haut' : 'vers le bas');
    }
}

// Préchargement des projets pour améliorer les performances
function preloadProjects() {
    Object.keys(projects).forEach(projectName => {
        const project = projects[projectName];
        if (project.path) {
            // Créer un lien invisible pour précharger
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = project.path;
            document.head.appendChild(link);
        }
    });
}

// Initialiser le préchargement
preloadProjects();

// Gestion des erreurs de navigation
window.addEventListener('error', function(e) {
    if (e.message.includes('Failed to load resource')) {
        console.log('Erreur de chargement de ressource:', e.filename);
    }
});

// Analytics ou tracking des interactions (optionnel)
function trackProjectClick(projectName) {
    // Ajouter votre code de tracking ici
    console.log('Projet cliqué:', projectName);
}

// Améliorer l'accessibilité
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('project-card')) {
            e.preventDefault();
            focusedElement.click();
        }
    }
});

// Mode sombre/clair (pour future extension)
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Charger le thème sauvegardé
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
}
