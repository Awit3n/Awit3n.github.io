# FileShare - Améliorations de partage

## 🔧 Problème résolu

Le problème que vous rencontriez était que FileShare utilisait uniquement le `localStorage` du navigateur, ce qui empêchait le partage entre différentes machines.

## ✅ Solution implémentée

J'ai ajouté un système hybride qui détecte automatiquement la taille des fichiers et choisit la meilleure méthode de partage :

### 📁 Petits fichiers (< 5MB)
- **Méthode** : Encodage direct dans l'URL
- **Avantage** : ✅ Fonctionne entre toutes les machines
- **Limitation** : Taille limitée par la longueur d'URL du navigateur

### 📁 Gros fichiers (> 5MB)
- **Méthode** : localStorage (système original)
- **Avantage** : Pas de limite de taille
- **Limitation** : ⚠️ Fonctionne seulement sur la même machine

## 🎯 Comment ça marche maintenant

1. **Sélectionnez vos fichiers** comme avant
2. **Le système détecte automatiquement** la taille totale
3. **Pour les petits fichiers** : Génération d'un lien universel
4. **Pour les gros fichiers** : Génération d'un lien local avec avertissement

## 🔍 Indicateurs visuels

- **✅ Partage inter-machines activé** : Le lien fonctionne partout
- **⚠️ Partage local uniquement** : Le lien ne fonctionne que sur la même machine

## 📊 Limites techniques

### Limites des URLs
- **Chrome/Edge** : ~2MB d'URL
- **Firefox** : ~65KB d'URL
- **Safari** : ~80KB d'URL

### Recommandations
- **< 1MB** : Partage universel garanti
- **1-5MB** : Partage universel probable
- **> 5MB** : Partage local uniquement

## 🚀 Alternatives pour gros fichiers

Pour partager de gros fichiers entre machines, considérez :

1. **Services cloud** : Google Drive, Dropbox, OneDrive
2. **Services de partage temporaire** : WeTransfer, SendAnywhere
3. **Serveur personnel** : Nextcloud, ownCloud
4. **WebRTC avancé** : Nécessite un serveur de signalisation

## 🔧 Personnalisation

Vous pouvez ajuster la limite de taille dans `script.js` :

```javascript
const maxSize = 5 * 1024 * 1024; // 5MB - modifiez cette valeur
```

## 📝 Notes importantes

- Les liens avec données encodées sont plus longs mais fonctionnent partout
- Les liens locaux sont plus courts mais limités à la même machine
- Le système choisit automatiquement la meilleure méthode
- Les avertissements visuels informent l'utilisateur du type de partage
