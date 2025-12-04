// Système de commentaires local
const COMMENTS = {
    STORAGE_KEY: 'modhub_comments',
    MAX_COMMENTS_PER_PAGE: 50,
    SORT_OPTIONS: {
        newest: 'Plus récents',
        oldest: 'Plus anciens',
        rating: 'Meilleures notes'
    }
};

// Initialisation des commentaires
function setupCommentSystem(modId) {
    loadComments(modId);
    setupCommentForm(modId);
    setupCommentFilters();
}

// Chargement des commentaires
function loadComments(modId) {
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');
    
    if (!commentsList) return;
    
    // Récupérer les commentaires depuis le stockage local
    const allComments = getStoredComments();
    const modComments = allComments[modId] || [];
    
    // Mettre à jour le compteur
    if (commentsCount) {
        commentsCount.textContent = `(${modComments.length})`;
    }
    
    // Trier les commentaires (plus récents d'abord par défaut)
    const sortedComments = sortComments(modComments, 'newest');
    
    // Afficher les commentaires
    if (sortedComments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <p>Aucun commentaire pour l'instant. Soyez le premier à partager votre avis !</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = sortedComments.map(comment => createCommentHTML(comment)).join('');
}

// Création du HTML d'un commentaire
function createCommentHTML(comment) {
    const date = new Date(comment.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const ratingStars = '★'.repeat(comment.rating) + '☆'.repeat(5 - comment.rating);
    
    return `
        <article class="comment" data-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author-info">
                    <span class="comment-author">${comment.author}</span>
                    ${comment.isVerified ? '<span class="verified-badge">✓ Vérifié</span>' : ''}
                </div>
                <div class="comment-meta">
                    <span class="comment-date">${date}</span>
                    <div class="comment-rating">
                        <span class="rating-stars">${ratingStars}</span>
                        <span class="rating-value">${comment.rating}/5</span>
                    </div>
                </div>
            </div>
            <div class="comment-content">
                ${comment.content}
            </div>
            ${comment.replyTo ? `<div class="comment-reply-to">En réponse à @${comment.replyTo}</div>` : ''}
            <div class="comment-actions">
                <button class="btn-reply" onclick="replyToComment('${comment.id}', '${comment.author}')">
                    Répondre
                </button>
                <button class="btn-report" onclick="reportComment('${comment.id}')">
                    Signaler
                </button>
            </div>
        </article>
    `;
}

// Configuration du formulaire de commentaire
function setupCommentForm(modId) {
    const commentForm = document.getElementById('comment-form');
    if (!commentForm) return;
    
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const author = document.getElementById('comment-author').value.trim();
        const rating = parseInt(document.getElementById('comment-rating').value);
        const content = document.getElementById('comment-content').value.trim();
        const replyTo = document.getElementById('comment-reply-to').value;
        
        // Validation
        if (!author || author.length < 2) {
            showFormError('Le nom doit contenir au moins 2 caractères');
            return;
        }
        
        if (!rating || rating < 1 || rating > 5) {
            showFormError('Veuillez sélectionner une note valide');
            return;
        }
        
        if (!content || content.length < 10) {
            showFormError('Le commentaire doit contenir au moins 10 caractères');
            return;
        }
        
        if (content.length > 1000) {
            showFormError('Le commentaire ne doit pas dépasser 1000 caractères');
            return;
        }
        
        // Créer le commentaire
        const comment = {
            id: generateCommentId(),
            modId: modId,
            author: author,
            rating: rating,
            content: content,
            date: new Date().toISOString(),
            replyTo: replyTo || null,
            isVerified: false,
            likes: 0,
            reports: 0
        };
        
        // Sauvegarder
        saveComment(comment);
        
        // Réinitialiser le formulaire
        commentForm.reset();
        document.getElementById('comment-reply-to').value = '';
        document.getElementById('reply-to-indicator').style.display = 'none';
        
        // Recharger les commentaires
        loadComments(modId);
        
        // Afficher un message de succès
        showFormSuccess('Commentaire publié avec succès !');
    });
}

// Configuration des filtres de commentaires
function setupCommentFilters() {
    const sortSelect = document.getElementById('comments-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const modId = getCurrentModId();
            if (modId) {
                const allComments = getStoredComments();
                const modComments = allComments[modId] || [];
                const sortedComments = sortComments(modComments, this.value);
                
                const commentsList = document.getElementById('comments-list');
                if (commentsList) {
                    commentsList.innerHTML = sortedComments.map(comment => createCommentHTML(comment)).join('');
                }
            }
        });
    }
}

// Tri des commentaires
function sortComments(comments, sortBy) {
    const sorted = [...comments];
    
    switch(sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating);
        default:
            return sorted;
    }
}

// Gestion du stockage local
function getStoredComments() {
    try {
        const stored = localStorage.getItem(COMMENTS.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Erreur de lecture des commentaires:', error);
        return {};
    }
}

function saveComment(comment) {
    try {
        const allComments = getStoredComments();
        
        if (!allComments[comment.modId]) {
            allComments[comment.modId] = [];
        }
        
        allComments[comment.modId].push(comment);
        localStorage.setItem(COMMENTS.STORAGE_KEY, JSON.stringify(allComments));
        
        return true;
    } catch (error) {
        console.error('Erreur de sauvegarde du commentaire:', error);
        showFormError('Erreur lors de la publication du commentaire');
        return false;
    }
}

// Fonctions utilitaires
function generateCommentId() {
    return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getCurrentModId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function replyToComment(commentId, author) {
    document.getElementById('comment-reply-to').value = commentId;
    document.getElementById('comment-content').value = `@${author} `;
    document.getElementById('comment-content').focus();
    
    const indicator = document.getElementById('reply-to-indicator');
    indicator.textContent = `Réponse à ${author}`;
    indicator.style.display = 'block';
}

function reportComment(commentId) {
    if (!confirm('Signaler ce commentaire comme inapproprié ?')) {
        return;
    }
    
    const allComments = getStoredComments();
    const modId = getCurrentModId();
    
    if (allComments[modId]) {
        const comment = allComments[modId].find(c => c.id === commentId);
        if (comment) {
            comment.reports = (comment.reports || 0) + 1;
            
            // Si trop de signalements, masquer le commentaire
            if (comment.reports >= 3) {
                comment.hidden = true;
            }
            
            localStorage.setItem(COMMENTS.STORAGE_KEY, JSON.stringify(allComments));
            loadComments(modId);
            alert('Merci pour votre signalement. Notre équipe examinera ce commentaire.');
        }
    }
}

// Gestion des messages du formulaire
function showFormError(message) {
    const status = document.getElementById('comment-form-status');
    if (status) {
        status.textContent = message;
        status.className = 'form-status error';
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

function showFormSuccess(message) {
    const status = document.getElementById('comment-form-status');
    if (status) {
        status.textContent = message;
        status.className = 'form-status success';
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// Exposer les fonctions nécessaires au scope global
window.replyToComment = replyToComment;
window.reportComment = reportComment;