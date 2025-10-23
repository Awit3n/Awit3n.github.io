// Stockage des fichiers en mémoire
let selectedFiles = [];
let shareId = null;

// WebRTC pour le partage entre machines
let peerConnection = null;
let dataChannel = null;
let isHost = false;

// Éléments DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const filesContainer = document.getElementById('filesContainer');
const generateLinkBtn = document.getElementById('generateLinkBtn');
const shareLink = document.getElementById('shareLink');
const generatedLink = document.getElementById('generatedLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');

// Vérifier si on est sur la page de téléchargement
const urlParams = new URLSearchParams(window.location.search);
const downloadId = urlParams.get('download');
const dataParam = urlParams.get('data');

if (downloadId || dataParam) {
    // Mode téléchargement
    initDownloadMode(downloadId, dataParam);
} else {
    // Mode envoi
    initUploadMode();
}

function initUploadMode() {
    // Événements drag & drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Événement sélection de fichiers
    fileInput.addEventListener('change', handleFileSelect);
    
    // Bouton génération de lien
    generateLinkBtn.addEventListener('click', generateShareLink);
    
    // Bouton copie de lien
    copyLinkBtn.addEventListener('click', copyToClipboard);
}

function initDownloadMode(downloadId, dataParam) {
    // Changer le contenu de la page pour le mode téléchargement
    document.querySelector('.header').innerHTML = `
        <h1 class="title">Téléchargement</h1>
        <p class="subtitle">Préparation du téléchargement...</p>
    `;
    
    // Masquer la zone de dépôt
    dropZone.style.display = 'none';
    
    // Vérifier le type de données
    if (dataParam) {
        // Données encodées dans l'URL (partage inter-machines)
        checkURLData(dataParam);
    } else if (downloadId) {
        // Données dans localStorage (même machine seulement)
        checkFilesAvailability(downloadId);
    }
}

function checkURLData(encodedData) {
    try {
        // Décoder les données de l'URL
        const fileData = JSON.parse(atob(encodedData));
        showDownloadInterface(fileData);
    } catch (error) {
        showError('Erreur de données', 'Impossible de décoder les fichiers depuis l\'URL.');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    files.forEach(file => {
        // Vérifier si le fichier n'est pas déjà ajouté
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            selectedFiles.push(file);
        }
    });
    
    displayFiles();
}

function displayFiles() {
    if (selectedFiles.length === 0) {
        filesList.style.display = 'none';
        return;
    }
    
    filesList.style.display = 'block';
    filesContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        filesContainer.appendChild(fileItem);
    });
}

function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExtension = getFileExtension(file.name);
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${fileExtension.toUpperCase()}</div>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>${fileSize}</p>
            </div>
        </div>
        <button class="btn btn-secondary" onclick="removeFile(${index})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
    
    return fileItem;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFiles();
}

function getFileExtension(filename) {
    return filename.split('.').pop() || 'file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateShareLink() {
    if (selectedFiles.length === 0) {
        alert('Veuillez sélectionner au moins un fichier');
        return;
    }
    
    // Générer un ID unique pour le partage
    shareId = generateUniqueId();
    
    // Vérifier la taille totale des fichiers
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 5 * 1024 * 1024; // 5MB limite pour l'URL
    
    if (totalSize > maxSize) {
        // Pour les gros fichiers, utiliser le système local avec avertissement
        generateLocalShareLink();
    } else {
        // Pour les petits fichiers, utiliser l'URL directe
        generateURLShareLink();
    }
}

function generateLocalShareLink() {
    // Système original avec localStorage (fonctionne seulement sur la même machine)
    const fileData = {
        id: shareId,
        files: selectedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            data: null
        })),
        timestamp: Date.now()
    };
    
    convertFilesToBase64(selectedFiles).then(base64Files => {
        fileData.files.forEach((file, index) => {
            file.data = base64Files[index];
        });
        
        localStorage.setItem(`fileshare_${shareId}`, JSON.stringify(fileData));
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?download=${shareId}`;
        generatedLink.value = shareUrl;
        
        shareLink.style.display = 'block';
        shareLink.scrollIntoView({ behavior: 'smooth' });
        
        // Afficher un avertissement
        showSharingWarning();
    });
}

function generateURLShareLink() {
    // Encoder les fichiers directement dans l'URL
    convertFilesToBase64(selectedFiles).then(base64Files => {
        const fileData = {
            id: shareId,
            files: selectedFiles.map((file, index) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64Files[index]
            })),
            timestamp: Date.now()
        };
        
        // Encoder en base64 pour l'URL
        const encodedData = btoa(JSON.stringify(fileData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
        
        generatedLink.value = shareUrl;
        shareLink.style.display = 'block';
        shareLink.scrollIntoView({ behavior: 'smooth' });
    });
}

function showSharingWarning() {
    const warningElement = document.querySelector('.warning');
    if (warningElement) {
        warningElement.innerHTML = `
            ⚠️ <strong>Limitation :</strong> Ce lien ne fonctionne que sur la même machine et le même navigateur.<br>
            <small>Pour partager entre machines, utilisez des fichiers plus petits (&lt;5MB) ou un service de stockage cloud.</small>
        `;
    }
}

function convertFilesToBase64(files) {
    const promises = files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });
    
    return Promise.all(promises);
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function copyToClipboard() {
    generatedLink.select();
    generatedLink.setSelectionRange(0, 99999); // Pour mobile
    
    try {
        document.execCommand('copy');
        
        // Feedback visuel
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copié !
        `;
        
        setTimeout(() => {
            copyLinkBtn.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        alert('Impossible de copier le lien. Veuillez le sélectionner manuellement.');
    }
}

function checkFilesAvailability(downloadId) {
    const fileData = localStorage.getItem(`fileshare_${downloadId}`);
    
    if (!fileData) {
        showError('Fichiers non disponibles', 'Les fichiers ont peut-être expiré ou le lien est invalide.');
        return;
    }
    
    try {
        const data = JSON.parse(fileData);
        showDownloadInterface(data);
    } catch (error) {
        showError('Erreur de données', 'Impossible de charger les fichiers.');
    }
}

function showDownloadInterface(data) {
    const mainContent = document.querySelector('.main-content');
    
    // Déterminer le type de partage
    const isURLShare = window.location.search.includes('data=');
    const shareTypeInfo = isURLShare ? 
        '<p style="color: #16bf78; margin-bottom: 1rem;">✅ Partage inter-machines activé</p>' :
        '<p style="color: #ffc107; margin-bottom: 1rem;">⚠️ Partage local uniquement</p>';
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Fichiers disponibles</h3>
            ${shareTypeInfo}
            <div class="files-container" id="downloadFilesContainer"></div>
            <button class="btn btn-primary" id="downloadAllBtn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Télécharger tous les fichiers
            </button>
        </div>
    `;
    
    const downloadFilesContainer = document.getElementById('downloadFilesContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    // Afficher les fichiers
    data.files.forEach((file, index) => {
        const fileItem = createDownloadFileItem(file, index);
        downloadFilesContainer.appendChild(fileItem);
    });
    
    // Événement téléchargement
    downloadAllBtn.addEventListener('click', () => downloadAllFiles(data.files));
}

function createDownloadFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExtension = getFileExtension(file.name);
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${fileExtension.toUpperCase()}</div>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>${fileSize}</p>
            </div>
        </div>
        <button class="btn btn-secondary" onclick="downloadSingleFile('${file.name}', '${file.data}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Télécharger
        </button>
    `;
    
    return fileItem;
}

function downloadSingleFile(filename, base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadAllFiles(files) {
    files.forEach((file, index) => {
        setTimeout(() => {
            downloadSingleFile(file.name, file.data);
        }, index * 500); // Délai entre les téléchargements
    });
}

function showError(title, message) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3 style="color: #ff6b6b;">${title}</h3>
            <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 2rem;">${message}</p>
            <button class="btn btn-primary" onclick="window.location.href = window.location.pathname">
                Retour à l'accueil
            </button>
        </div>
    `;
}

// Nettoyage automatique des anciens fichiers (optionnel)
function cleanupOldFiles() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fileshare_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (now - data.timestamp > maxAge) {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                // Supprimer les données corrompues
                localStorage.removeItem(key);
            }
        }
    }
}

// Nettoyer les anciens fichiers au chargement
cleanupOldFiles();
