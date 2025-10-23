# Awit3n Portfolio

Portfolio personnel avec une page d'accueil moderne et des projets organisés de manière modulaire.

## Structure du projet

```
/
├── index.html          # Page d'accueil
├── style.css          # Styles de la page d'accueil
├── script.js          # JavaScript de navigation
├── FileShare/         # Projet FileShare
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## Fonctionnalités

- **Page d'accueil moderne** : Design épuré avec animations fluides
- **Navigation modulaire** : Système facile pour ajouter de nouveaux projets
- **Responsive design** : Compatible mobile et desktop
- **Même palette de couleurs** : Cohérence visuelle entre tous les projets

## Comment ajouter un nouveau projet

### 1. Créer le dossier du projet
```bash
mkdir MonNouveauProjet
```

### 2. Ajouter les fichiers du projet
Placez vos fichiers HTML, CSS et JS dans le dossier :
```
MonNouveauProjet/
├── index.html
├── style.css
└── script.js
```

### 3. Mettre à jour la configuration
Modifiez le fichier `script.js` à la racine pour ajouter votre projet :

```javascript
const projects = {
    'FileShare': {
        path: '/FileShare/',
        title: 'FileShare',
        description: 'Partagez vos fichiers instantanément, sans serveur'
    },
    'MonNouveauProjet': {
        path: '/MonNouveauProjet/',
        title: 'Mon Nouveau Projet',
        description: 'Description de votre projet'
    }
};
```

### 4. Ajouter la carte sur la page d'accueil
Modifiez le fichier `index.html` pour ajouter une nouvelle carte de projet :

```html
<div class="project-card" onclick="navigateToProject('MonNouveauProjet')">
    <div class="project-icon">
        <!-- Votre icône SVG ici -->
    </div>
    <h3>Mon Nouveau Projet</h3>
    <p>Description de votre projet</p>
    <div class="project-tags">
        <span class="tag">Technologie 1</span>
        <span class="tag">Technologie 2</span>
    </div>
</div>
```

## Projets actuels

### FileShare
- **URL** : `/FileShare/`
- **Description** : Partagez vos fichiers instantanément, sans serveur
- **Technologies** : JavaScript, WebRTC, P2P

## Palette de couleurs

Le portfolio utilise une palette de couleurs cohérente :
- **Fond principal** : `#0d1f22` (bleu-vert sombre)
- **Fond secondaire** : `#1a2f33` (bleu-vert moyen)
- **Accent** : `#16bf78` (vert émeraude)
- **Texte** : `#ffffff` (blanc)

## Technologies utilisées

- HTML5
- CSS3 (avec animations et effets visuels)
- JavaScript (ES6+)
- Fonts Google (Inter)

## Déploiement

Pour déployer sur GitHub Pages :

1. Poussez votre code sur GitHub
2. Activez GitHub Pages dans les paramètres du repository
3. Sélectionnez la branche principale
4. Votre portfolio sera accessible à `https://votre-username.github.io`

## Développement local

1. Clonez le repository
2. Ouvrez `index.html` dans votre navigateur
3. Pour tester les projets, servez les fichiers via un serveur local :
   ```bash
   python -m http.server 8000
   # ou
   npx serve .
   ```

## Licence

MIT License - Libre d'utilisation et de modification.