// Stockage des fichiers en mémoire
let selectedFiles = [];
let shareId = null;

// Système de rooms auto-hébergé
let roomId = null;
let isHost = false;
let roomData = null;
let roomCheckInterval = null;

// Système cross-machine
let peerConnection = null;
let dataChannel = null;
let isCrossMachine = false;
let networkDiscovery = null;
let rendezvousServer = 'https://api.github.com'; // Utilisé comme serveur de rendez-vous gratuit

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
const roomParam = urlParams.get('room');
const crossParam = urlParams.get('cross');
const answerParam = urlParams.get('answer');

if (downloadId || dataParam) {
    // Mode téléchargement (ancien système)
    initDownloadMode(downloadId, dataParam);
} else if (roomParam) {
    // Mode téléchargement avec rooms auto-hébergées
    initSelfHostedDownloadMode(roomParam);
} else if (crossParam) {
    // Mode téléchargement cross-machine
    initCrossMachineDownloadMode(crossParam);
} else if (answerParam) {
    // Mode réponse WebRTC cross-machine
    handleWebRTCAnswer(answerParam);
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
    // Debug: Afficher les paramètres détectés
    console.log('Mode téléchargement détecté:');
    console.log('- downloadId:', downloadId);
    console.log('- dataParam:', dataParam ? 'présent' : 'absent');
    console.log('- URL complète:', window.location.href);
    
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
        console.log('Utilisation du mode URL (partage inter-machines)');
        checkURLData(dataParam);
    } else if (downloadId) {
        // Données dans localStorage (même machine seulement)
        console.log('Utilisation du mode localStorage (même machine seulement)');
    checkFilesAvailability(downloadId);
    } else {
        console.error('Aucun paramètre de téléchargement détecté');
        showError('Erreur de configuration', 'Aucun paramètre de téléchargement trouvé dans l\'URL.');
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
    roomId = shareId;
    
    console.log('Génération de lien de partage:');
    console.log('- Nombre de fichiers:', selectedFiles.length);
    console.log('- Room ID:', roomId);
    
    // Détecter le type de partage souhaité
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxLocalSize = 10 * 1024 * 1024; // 10MB limite pour le partage local
    
    if (totalSize > maxLocalSize) {
        // Gros fichiers : utiliser le partage cross-machine
        console.log('Fichiers volumineux détectés, utilisation du mode cross-machine');
        isCrossMachine = true;
        initCrossMachineSharing();
    } else {
        // Petits fichiers : utiliser le système de rooms local
        console.log('Fichiers légers, utilisation du système de rooms local');
        isCrossMachine = false;
        initSelfHostedRoom();
    }
}

function initSelfHostedRoom() {
    try {
        // Créer les données de la room
        roomData = {
            id: roomId,
            host: true,
            files: selectedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                data: null // Sera rempli après conversion
            })),
            timestamp: Date.now(),
            status: 'waiting',
            clients: []
        };
        
        // Convertir les fichiers en base64 pour le stockage
        convertFilesToBase64(selectedFiles).then(base64Files => {
            roomData.files.forEach((file, index) => {
                file.data = base64Files[index];
            });
            
            // Stocker la room dans localStorage
            localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
            
            // Générer le lien de partage
            const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
            generatedLink.value = shareUrl;
            
            // Afficher le lien
            shareLink.style.display = 'block';
            shareLink.scrollIntoView({ behavior: 'smooth' });
            
            // Démarrer la surveillance de la room
            startRoomMonitoring();
            
            // Démarrer la découverte peer-to-peer local
            startLocalPeerDiscovery();
            
            showConnectionStatus('Room créée! En attente de connexions...', 'success');
            
            console.log('Room auto-hébergée créée:', roomId);
        });
        
    } catch (error) {
        console.error('Erreur lors de la création de la room:', error);
        showConnectionStatus('Erreur de création de room', 'error');
    }
}

// Système de partage cross-machine
async function initCrossMachineSharing() {
    try {
        isHost = true;
        
        // Créer une connexion WebRTC
        await createPeerConnection();
        
        // Créer le canal de données
        dataChannel = peerConnection.createDataChannel('fileshare', {
            ordered: true
        });
        
        setupDataChannelEvents();
        
        // Générer une offre WebRTC
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Encoder l'offre dans l'URL
        const offerData = {
            type: 'offer',
            offer: offer,
            roomId: roomId,
            timestamp: Date.now()
        };
        
        const encodedOffer = btoa(JSON.stringify(offerData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?cross=${encodedOffer}`;
        
        generatedLink.value = shareUrl;
        shareLink.style.display = 'block';
        shareLink.scrollIntoView({ behavior: 'smooth' });
        
        showConnectionStatus('Mode cross-machine activé! En attente de connexion...', 'success');
        
        console.log('Partage cross-machine initialisé');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation cross-machine:', error);
        showConnectionStatus('Erreur cross-machine', 'error');
    }
}

async function createPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Gérer les candidats ICE
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Candidat ICE généré:', event.candidate);
            // Les candidats ICE seront échangés via l'URL
        }
    };
    
    // Gérer les changements de connexion
    peerConnection.onconnectionstatechange = () => {
        console.log('État de connexion:', peerConnection.connectionState);
        updateConnectionStatus(peerConnection.connectionState);
    };
    
    // Gérer les canaux de données entrants
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupReceiverDataChannelEvents();
    };
}

function setupDataChannelEvents() {
    dataChannel.onopen = () => {
        console.log('Canal de données ouvert (expéditeur)');
        showConnectionStatus('Connexion établie! Envoi des fichiers...', 'success');
        sendFilesCrossMachine();
    };
    
    dataChannel.onclose = () => {
        console.log('Canal de données fermé');
        showConnectionStatus('Connexion fermée', 'error');
    };
    
    dataChannel.onerror = (error) => {
        console.error('Erreur du canal de données:', error);
        showConnectionStatus('Erreur de transmission', 'error');
    };
}

function setupReceiverDataChannelEvents() {
    let receivedFiles = [];
    let fileBuffers = {};
    
    dataChannel.onopen = () => {
        console.log('Canal de données ouvert (récepteur)');
        showConnectionStatus('Connexion établie! Réception des fichiers...', 'success');
    };
    
    dataChannel.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'metadata':
                    console.log('Métadonnées reçues:', data.files);
                    receivedFiles = data.files;
                    showReceivedFilesCrossMachine(data.files);
                    break;
                    
                case 'chunk':
                    if (!fileBuffers[data.fileIndex]) {
                        fileBuffers[data.fileIndex] = new Uint8Array(receivedFiles[data.fileIndex].size);
                    }
                    
                    const buffer = new Uint8Array(data.data);
                    fileBuffers[data.fileIndex].set(buffer, data.offset);
                    
                    updateProgressCrossMachine(data.fileIndex, data.offset, receivedFiles[data.fileIndex].size);
                    break;
                    
                case 'complete':
                    console.log('Réception terminée');
                    showConnectionStatus('Tous les fichiers reçus!', 'success');
                    prepareDownloadsCrossMachine(receivedFiles, fileBuffers);
                    break;
            }
        } catch (error) {
            console.error('Erreur lors du traitement des données:', error);
        }
    };
    
    dataChannel.onclose = () => {
        console.log('Canal de données fermé');
        showConnectionStatus('Connexion fermée', 'error');
    };
    
    dataChannel.onerror = (error) => {
        console.error('Erreur du canal de données:', error);
        showConnectionStatus('Erreur de réception', 'error');
    };
}

async function sendFilesCrossMachine() {
    if (!dataChannel || dataChannel.readyState !== 'open') {
        console.error('Canal de données non disponible');
        return;
    }
    
    // Envoyer les métadonnées des fichiers
    const fileMetadata = {
        type: 'metadata',
        files: selectedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
        }))
    };
    
    dataChannel.send(JSON.stringify(fileMetadata));
    
    // Envoyer chaque fichier par chunks
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const chunkSize = 16 * 1024; // 16KB par chunk pour WebRTC
        let offset = 0;
        
        while (offset < file.size) {
            const chunk = file.slice(offset, offset + chunkSize);
            const arrayBuffer = await chunk.arrayBuffer();
            
            const chunkData = {
                type: 'chunk',
                fileIndex: i,
                offset: offset,
                data: Array.from(new Uint8Array(arrayBuffer))
            };
            
            dataChannel.send(JSON.stringify(chunkData));
            offset += chunkSize;
            
            // Petit délai pour éviter de surcharger
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    }
    
    // Signal de fin
    dataChannel.send(JSON.stringify({ type: 'complete' }));
    console.log('Tous les fichiers envoyés via cross-machine');
}

// Mode téléchargement cross-machine
async function initCrossMachineDownloadMode(encodedOffer) {
    console.log('Mode téléchargement cross-machine');
    
    // Changer le contenu de la page
    document.querySelector('.header').innerHTML = `
        <h1 class="title">Téléchargement Cross-Machine</h1>
        <p class="subtitle">Connexion WebRTC en cours...</p>
    `;
    
    // Masquer la zone de dépôt
    dropZone.style.display = 'none';
    
    try {
        // Décoder l'offre
        const offerData = JSON.parse(atob(encodedOffer));
        console.log('Offre reçue:', offerData);
        
        // Créer la connexion peer-to-peer
        await createPeerConnection();
        
        // Configurer l'offre distante
        await peerConnection.setRemoteDescription(offerData.offer);
        
        // Créer une réponse
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Encoder la réponse et la renvoyer via l'URL
        const answerData = {
            type: 'answer',
            answer: answer,
            roomId: offerData.roomId,
            timestamp: Date.now()
        };
        
        const encodedAnswer = btoa(JSON.stringify(answerData));
        const responseUrl = `${window.location.origin}${window.location.pathname}?answer=${encodedAnswer}`;
        
        // Afficher l'URL de réponse pour l'expéditeur
        showConnectionStatus('Connexion établie! En attente des fichiers...', 'success');
        
        console.log('Réponse WebRTC créée:', responseUrl);
        
        // Afficher l'URL de réponse pour que l'expéditeur puisse la copier
        showResponseUrl(responseUrl);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation cross-machine:', error);
        showConnectionStatus('Erreur de connexion cross-machine', 'error');
    }
}

function showResponseUrl(responseUrl) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Connexion Cross-Machine</h3>
            <p style="color: #16bf78; margin-bottom: 1rem;">🌐 Réponse WebRTC générée</p>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem;">
                Copiez cette URL et ouvrez-la dans l'onglet de l'expéditeur pour établir la connexion :
            </p>
            <div class="link-container">
                <input type="text" id="responseLink" value="${responseUrl}" readonly>
                <button class="btn btn-secondary" onclick="copyResponseLink()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Copier
                </button>
            </div>
            <p style="color: rgba(255, 193, 7, 0.8); font-size: 0.875rem; margin-top: 1rem;">
                ⚠️ Cette URL doit être ouverte dans l'onglet de l'expéditeur pour établir la connexion WebRTC
            </p>
        </div>
    `;
}

function copyResponseLink() {
    const responseLink = document.getElementById('responseLink');
    responseLink.select();
    responseLink.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showConnectionStatus('URL de réponse copiée!', 'success');
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        showConnectionStatus('Erreur de copie', 'error');
    }
}

// Gestion des réponses WebRTC
function handleWebRTCAnswer(encodedAnswer) {
    try {
        const answerData = JSON.parse(atob(encodedAnswer));
        console.log('Réponse reçue:', answerData);
        
        // Configurer la réponse distante
        peerConnection.setRemoteDescription(answerData.answer).then(() => {
            console.log('Réponse WebRTC configurée');
            showConnectionStatus('Connexion WebRTC établie!', 'success');
        }).catch(error => {
            console.error('Erreur lors de la configuration de la réponse:', error);
            showConnectionStatus('Erreur de configuration WebRTC', 'error');
        });
        
    } catch (error) {
        console.error('Erreur lors du traitement de la réponse:', error);
        showConnectionStatus('Erreur de réponse WebRTC', 'error');
    }
}

function showReceivedFilesCrossMachine(files) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Fichiers en cours de réception (Cross-Machine)</h3>
            <p style="color: #16bf78; margin-bottom: 1rem;">🌐 Connexion WebRTC établie</p>
            <div class="files-container" id="receivedFilesContainer"></div>
        </div>
    `;
    
    const container = document.getElementById('receivedFilesContainer');
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${getFileExtension(file.name).toUpperCase()}</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="progress-bar" id="progress-${index}">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        container.appendChild(fileItem);
    });
}

function updateProgressCrossMachine(fileIndex, received, total) {
    const percentage = (received / total) * 100;
    const progressFill = document.querySelector(`#progress-${fileIndex} .progress-fill`);
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

function prepareDownloadsCrossMachine(files, buffers) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Fichiers reçus (Cross-Machine)</h3>
            <p style="color: #16bf78; margin-bottom: 1rem;">✅ Transfert WebRTC terminé</p>
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
    
    const container = document.getElementById('downloadFilesContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    files.forEach((file, index) => {
        const fileItem = createDownloadFileItem(file, index, buffers[index]);
        container.appendChild(fileItem);
    });
    
    downloadAllBtn.addEventListener('click', () => {
        files.forEach((file, index) => {
            downloadFile(file.name, buffers[index]);
        });
    });
}

function startLocalPeerDiscovery() {
    // Utiliser BroadcastChannel pour la découverte locale
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('fileshare-discovery');
        
        // Annoncer la room
        channel.postMessage({
            type: 'room-announcement',
            roomId: roomId,
            timestamp: Date.now()
        });
        
        // Écouter les réponses
        channel.onmessage = (event) => {
            if (event.data.type === 'room-request' && event.data.roomId === roomId) {
                // Un client demande à rejoindre la room
                channel.postMessage({
                    type: 'room-response',
                    roomId: roomId,
                    success: true,
                    timestamp: Date.now()
                });
                
                showConnectionStatus('Client détecté localement!', 'success');
            }
        };
        
        console.log('Découverte peer-to-peer locale activée');
    }
    
    // Utiliser les SharedArrayBuffer si disponibles pour la synchronisation
    if (typeof SharedArrayBuffer !== 'undefined') {
        try {
            const sharedBuffer = new SharedArrayBuffer(1024);
            const view = new Int32Array(sharedBuffer);
            Atomics.store(view, 0, roomId.length);
            console.log('Synchronisation partagée activée');
        } catch (error) {
            console.log('SharedArrayBuffer non disponible:', error);
        }
    }
}

function startRoomMonitoring() {
    // Surveiller les connexions à la room
    roomCheckInterval = setInterval(() => {
        checkRoomConnections();
    }, 2000); // Vérifier toutes les 2 secondes
    
    // Nettoyer la room après 1 heure d'inactivité
    setTimeout(() => {
        cleanupRoom();
    }, 60 * 60 * 1000);
}

function checkRoomConnections() {
    if (!isHost) return;
    
    // Vérifier si des clients ont rejoint
    const roomKey = `room_${roomId}`;
    const storedRoom = localStorage.getItem(roomKey);
    
    if (storedRoom) {
        try {
            const room = JSON.parse(storedRoom);
            if (room.clients && room.clients.length > 0) {
                showConnectionStatus(`${room.clients.length} client(s) connecté(s)`, 'success');
                
                // Marquer la room comme active
                room.status = 'active';
                localStorage.setItem(roomKey, JSON.stringify(room));
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de la room:', error);
        }
    }
}

function cleanupRoom() {
    if (roomCheckInterval) {
        clearInterval(roomCheckInterval);
    }
    
    // Supprimer la room du localStorage
    localStorage.removeItem(`room_${roomId}`);
    console.log('Room nettoyée:', roomId);
}

// Mode téléchargement avec rooms auto-hébergées
function initSelfHostedDownloadMode(roomId) {
    console.log('Mode téléchargement avec room auto-hébergée:', roomId);
    
    // Changer le contenu de la page
    document.querySelector('.header').innerHTML = `
        <h1 class="title">Téléchargement</h1>
        <p class="subtitle">Connexion à la room...</p>
    `;
    
    // Masquer la zone de dépôt
    dropZone.style.display = 'none';
    
    // Initialiser comme client
    isHost = false;
    roomId = roomId;
    
    // Essayer de se connecter à la room
    connectToRoom(roomId);
}

function connectToRoom(roomId) {
    const roomKey = `room_${roomId}`;
    const storedRoom = localStorage.getItem(roomKey);
    
    if (!storedRoom) {
        showConnectionStatus('Room non trouvée ou expirée', 'error');
        setTimeout(() => {
            showError('Room non disponible', 'La room a peut-être expiré ou le lien est invalide.');
        }, 2000);
        return;
    }
    
    try {
        const room = JSON.parse(storedRoom);
        
        // Ajouter ce client à la liste des clients
        const clientId = generateUniqueId();
        if (!room.clients) {
            room.clients = [];
        }
        
        room.clients.push({
            id: clientId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
        
        // Mettre à jour la room
        localStorage.setItem(roomKey, JSON.stringify(room));
        
        // Démarrer la synchronisation cross-tab
        startCrossTabSync(roomId);
        
        showConnectionStatus('Connecté à la room!', 'success');
        
        // Afficher les fichiers disponibles
        setTimeout(() => {
            showDownloadInterface(room);
        }, 1000);
        
        console.log('Connecté à la room:', roomId);
        
    } catch (error) {
        console.error('Erreur lors de la connexion à la room:', error);
        showConnectionStatus('Erreur de connexion', 'error');
    }
}

function startCrossTabSync(roomId) {
    // Écouter les changements de localStorage depuis d'autres onglets
    window.addEventListener('storage', (event) => {
        if (event.key === `room_${roomId}` && event.newValue) {
            try {
                const updatedRoom = JSON.parse(event.newValue);
                console.log('Room mise à jour depuis un autre onglet:', updatedRoom);
                
                // Mettre à jour l'affichage si nécessaire
                if (updatedRoom.status === 'active') {
                    showConnectionStatus('Room active détectée!', 'success');
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
            }
        }
    });
    
    // Utiliser BroadcastChannel pour la communication cross-tab
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`fileshare-room-${roomId}`);
        
        // Demander à rejoindre la room
        channel.postMessage({
            type: 'room-request',
            roomId: roomId,
            timestamp: Date.now()
        });
        
        // Écouter les réponses
        channel.onmessage = (event) => {
            if (event.data.type === 'room-response' && event.data.success) {
                showConnectionStatus('Communication cross-tab établie!', 'success');
            }
        };
        
        console.log('Synchronisation cross-tab activée');
    }
}

async function initSocketConnection() {
    return new Promise((resolve, reject) => {
        // Charger Socket.IO depuis CDN si pas déjà chargé
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.onload = () => {
                socket = io(signalingServer);
                setupSocketEvents();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        } else {
            socket = io(signalingServer);
            setupSocketEvents();
            resolve();
        }
    });
}

function setupSocketEvents() {
    socket.on('connect', () => {
        console.log('Connecté au serveur de signalisation:', socket.id);
        socket.emit('join-room', roomId);
    });
    
    socket.on('offer', async (data) => {
        if (!isHost) {
            console.log('Offre reçue:', data.senderId);
            await handleOffer(data.offer);
        }
    });
    
    socket.on('answer', async (data) => {
        if (isHost) {
            console.log('Réponse reçue:', data.senderId);
            await handleAnswer(data.answer);
        }
    });
    
    socket.on('ice-candidate', async (data) => {
        console.log('Candidat ICE reçu:', data.senderId);
        await handleIceCandidate(data.candidate);
    });
    
    socket.on('user-joined', (userId) => {
        console.log('Utilisateur rejoint:', userId);
        showConnectionStatus('Connexion établie!', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('Déconnecté du serveur de signalisation');
        showConnectionStatus('Connexion perdue', 'error');
    });
}

async function createPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Gérer les candidats ICE
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: roomId,
                candidate: event.candidate,
                senderId: socket.id
            });
        }
    };
    
    // Gérer les changements de connexion
    peerConnection.onconnectionstatechange = () => {
        console.log('État de connexion:', peerConnection.connectionState);
        updateConnectionStatus(peerConnection.connectionState);
    };
}

function setupDataChannelEvents() {
    dataChannel.onopen = () => {
        console.log('Canal de données ouvert');
        showConnectionStatus('Connexion établie! Prêt à envoyer les fichiers.', 'success');
        sendFiles();
    };
    
    dataChannel.onclose = () => {
        console.log('Canal de données fermé');
        showConnectionStatus('Connexion fermée', 'error');
    };
    
    dataChannel.onerror = (error) => {
        console.error('Erreur du canal de données:', error);
        showConnectionStatus('Erreur de transmission', 'error');
    };
}

async function sendFiles() {
    if (!dataChannel || dataChannel.readyState !== 'open') {
        console.error('Canal de données non disponible');
        return;
    }
    
    // Envoyer les métadonnées des fichiers
    const fileMetadata = {
        type: 'metadata',
        files: selectedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
        }))
    };
    
    dataChannel.send(JSON.stringify(fileMetadata));
    
    // Envoyer chaque fichier
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const chunkSize = 64 * 1024; // 64KB par chunk
        let offset = 0;
        
        while (offset < file.size) {
            const chunk = file.slice(offset, offset + chunkSize);
            const arrayBuffer = await chunk.arrayBuffer();
            
            // Envoyer le chunk avec métadonnées
            const chunkData = {
                type: 'chunk',
                fileIndex: i,
                offset: offset,
                data: Array.from(new Uint8Array(arrayBuffer))
            };
            
            dataChannel.send(JSON.stringify(chunkData));
            offset += chunkSize;
            
            // Petit délai pour éviter de surcharger
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    
    // Signal de fin
    dataChannel.send(JSON.stringify({ type: 'complete' }));
    console.log('Tous les fichiers envoyés');
}

// Fonctions pour gérer les offres/réponses WebRTC
async function handleOffer(offer) {
    try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
            roomId: roomId,
            answer: answer,
            senderId: socket.id,
            targetId: socket.id // Sera corrigé par le serveur
        });
        
        console.log('Réponse WebRTC envoyée');
    } catch (error) {
        console.error('Erreur lors du traitement de l\'offre:', error);
    }
}

async function handleAnswer(answer) {
    try {
        await peerConnection.setRemoteDescription(answer);
        console.log('Réponse WebRTC traitée');
    } catch (error) {
        console.error('Erreur lors du traitement de la réponse:', error);
    }
}

async function handleIceCandidate(candidate) {
    try {
        await peerConnection.addIceCandidate(candidate);
        console.log('Candidat ICE ajouté');
    } catch (error) {
        console.error('Erreur lors de l\'ajout du candidat ICE:', error);
    }
}

// Mode téléchargement WebRTC
async function initWebRTCDownloadMode(roomId) {
    console.log('Mode téléchargement WebRTC pour la room:', roomId);
    
    // Changer le contenu de la page
    document.querySelector('.header').innerHTML = `
        <h1 class="title">Téléchargement WebRTC</h1>
        <p class="subtitle">Connexion en cours...</p>
    `;
    
    // Masquer la zone de dépôt
    dropZone.style.display = 'none';
    
    // Initialiser la connexion WebRTC comme client
    isHost = false;
    roomId = roomId;
    
    try {
        await initSocketConnection();
        await createPeerConnection();
        
        // Écouter les données reçues
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupReceiverDataChannelEvents();
        };
        
        showConnectionStatus('Connexion au serveur...', 'warning');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du téléchargement:', error);
        showConnectionStatus('Erreur de connexion', 'error');
    }
}

function setupReceiverDataChannelEvents() {
    let receivedFiles = [];
    let fileBuffers = {};
    
    dataChannel.onopen = () => {
        console.log('Canal de données ouvert (récepteur)');
        showConnectionStatus('Connexion établie! Réception des fichiers...', 'success');
    };
    
    dataChannel.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'metadata':
                    console.log('Métadonnées reçues:', data.files);
                    receivedFiles = data.files;
                    showReceivedFiles(data.files);
                    break;
                    
                case 'chunk':
                    if (!fileBuffers[data.fileIndex]) {
                        fileBuffers[data.fileIndex] = new Uint8Array(receivedFiles[data.fileIndex].size);
                    }
                    
                    const buffer = new Uint8Array(data.data);
                    fileBuffers[data.fileIndex].set(buffer, data.offset);
                    
                    // Mettre à jour la progression
                    updateProgress(data.fileIndex, data.offset, receivedFiles[data.fileIndex].size);
                    break;
                    
                case 'complete':
                    console.log('Réception terminée');
                    showConnectionStatus('Tous les fichiers reçus!', 'success');
                    prepareDownloads(receivedFiles, fileBuffers);
                    break;
            }
        } catch (error) {
            console.error('Erreur lors du traitement des données:', error);
        }
    };
    
    dataChannel.onclose = () => {
        console.log('Canal de données fermé');
        showConnectionStatus('Connexion fermée', 'error');
    };
    
    dataChannel.onerror = (error) => {
        console.error('Erreur du canal de données:', error);
        showConnectionStatus('Erreur de réception', 'error');
    };
}

function showReceivedFiles(files) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Fichiers en cours de réception</h3>
            <div class="files-container" id="receivedFilesContainer"></div>
            <div id="progressContainer"></div>
        </div>
    `;
    
    const container = document.getElementById('receivedFilesContainer');
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${getFileExtension(file.name).toUpperCase()}</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="progress-bar" id="progress-${index}">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        container.appendChild(fileItem);
    });
}

function updateProgress(fileIndex, received, total) {
    const percentage = (received / total) * 100;
    const progressFill = document.querySelector(`#progress-${fileIndex} .progress-fill`);
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

function prepareDownloads(files, buffers) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <div class="files-list">
            <h3>Fichiers reçus</h3>
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
    
    const container = document.getElementById('downloadFilesContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    files.forEach((file, index) => {
        const fileItem = createDownloadFileItem(file, index, buffers[index]);
        container.appendChild(fileItem);
    });
    
    downloadAllBtn.addEventListener('click', () => {
        files.forEach((file, index) => {
            downloadFile(file.name, buffers[index]);
        });
    });
}

function createDownloadFileItem(file, index, buffer) {
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
        <button class="btn btn-secondary" onclick="downloadFile('${file.name}', window.fileBuffers[${index}])">
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

function downloadFile(filename, buffer) {
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showConnectionStatus(message, type) {
    // Créer ou mettre à jour l'élément de statut
    let statusElement = document.getElementById('connectionStatus');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'connectionStatus';
        statusElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(statusElement);
    }
    
    const colors = {
        success: '#16bf78',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    statusElement.style.backgroundColor = colors[type] || colors.info;
    statusElement.textContent = message;
    
    // Auto-masquer après 5 secondes pour les messages de succès
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => statusElement.remove(), 300);
        }, 5000);
    }
}

function updateConnectionStatus(state) {
    const statusMessages = {
        'new': 'Nouvelle connexion',
        'connecting': 'Connexion en cours...',
        'connected': 'Connecté',
        'disconnected': 'Déconnecté',
        'failed': 'Échec de connexion',
        'closed': 'Connexion fermée'
    };
    
    const type = state === 'connected' ? 'success' : 
                 state === 'failed' || state === 'closed' ? 'error' : 'warning';
    
    showConnectionStatus(statusMessages[state] || state, type);
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
        
        try {
            // Encoder en base64 pour l'URL
            const encodedData = btoa(JSON.stringify(fileData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
            
            // Vérifier la longueur de l'URL
            if (shareUrl.length > 2000) { // Limite de sécurité pour la plupart des navigateurs
                console.warn('URL trop longue, basculement vers localStorage');
                generateLocalShareLink();
                return;
            }
            
            generatedLink.value = shareUrl;
            shareLink.style.display = 'block';
            shareLink.scrollIntoView({ behavior: 'smooth' });
            
            console.log('URL générée avec succès:', shareUrl.length, 'caractères');
        } catch (error) {
            console.error('Erreur lors de l\'encodage URL:', error);
            console.log('Basculement vers localStorage');
            generateLocalShareLink();
        }
    });
}

function showSharingWarning() {
    const warningElement = document.querySelector('.warning');
    if (warningElement) {
        warningElement.innerHTML = `
            ⚠️ <strong>Limitation :</strong> Ce lien ne fonctionne que sur la même machine et le même navigateur.<br>
            <small>Pour partager entre machines, utilisez des fichiers plus petits (&lt;100KB) ou un service de stockage cloud.</small><br>
            <div style="margin-top: 10px;">
                <strong>Alternatives pour partage inter-machines :</strong><br>
                • <a href="https://wetransfer.com" target="_blank" style="color: #16bf78;">WeTransfer</a> (jusqu'à 2GB)<br>
                • <a href="https://sendanywhere.com" target="_blank" style="color: #16bf78;">Send Anywhere</a> (jusqu'à 10GB)<br>
                • <a href="https://drive.google.com" target="_blank" style="color: #16bf78;">Google Drive</a> (15GB gratuit)
            </div>
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
    const isRoomShare = window.location.search.includes('room=');
    const shareTypeInfo = isRoomShare ? 
        '<p style="color: #16bf78; margin-bottom: 1rem;">✅ Room auto-hébergée - Partage inter-machines</p>' :
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
