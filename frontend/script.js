// ============================================================================
// CONFIGURATION
// ============================================================================

// URL de l'API backend
// Détection automatique de l'environnement
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '';

// En développement local : http://127.0.0.1:8000
// En production : URL du backend déployé sur Render
const API_URL = isLocal
    ? 'http://127.0.0.1:8000'
    : 'https://detection-poubelle-backend.onrender.com';

console.log('🌍 Environnement:', isLocal ? 'LOCAL' : 'PRODUCTION');
console.log('📡 API URL:', API_URL);

// ============================================================================
// ELEMENTS DOM
// ============================================================================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const loader = document.getElementById('loader');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');
const downloadModelBtn = document.getElementById('downloadModelBtn');

let selectedFile = null;
let stats = {
    totalAnalyses: 0,
    totalConfidence: 0,
    totalTime: 0
};

// ============================================================================
// EVENT LISTENERS - NAVIGATION
// ============================================================================

// Menu mobile
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Fermer le menu au clic sur un lien
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Télécharger le modèle
downloadModelBtn.addEventListener('click', async () => {
    try {
        downloadModelBtn.disabled = true;
        downloadModelBtn.innerHTML = '<span class="link-icon">⏳</span> Téléchargement...';
        
        const response = await fetch(`${API_URL}/download-model`);
        
        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'best.pt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        downloadModelBtn.innerHTML = '<span class="link-icon">✅</span> Téléchargé !';
        setTimeout(() => {
            downloadModelBtn.innerHTML = '<span class="link-icon">📥</span> Télécharger le modèle';
            downloadModelBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Erreur téléchargement:', error);
        downloadModelBtn.innerHTML = '<span class="link-icon">❌</span> Erreur';
        setTimeout(() => {
            downloadModelBtn.innerHTML = '<span class="link-icon">📥</span> Télécharger le modèle';
            downloadModelBtn.disabled = false;
        }, 2000);
    }
});

// Smooth scroll avec offset pour la navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Changer l'état actif du menu au scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section, #home');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = 'home';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.slide-in, .about-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});

// ============================================================================
// EVENT LISTENERS - APPLICATION
// ============================================================================

// Bouton parcourir
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

// Sélection de fichier
fileInput.addEventListener('change', handleFileSelect);

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Boutons d'action
analyzeBtn.addEventListener('click', analyzeImage);
resetBtn.addEventListener('click', resetApp);
newAnalysisBtn.addEventListener('click', resetApp);

// ============================================================================
// FONCTIONS
// ============================================================================

/**
 * Gestion de la sélection de fichier
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

/**
 * Traitement du fichier sélectionné
 */
function handleFile(file) {
    // Validation du type
    if (!file.type.startsWith('image/')) {
        showError('Veuillez sélectionner une image valide (JPG, PNG, JPEG)');
        return;
    }
    
    // Validation de la taille (10 MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('L\'image est trop volumineuse. Taille maximum: 10 MB');
        return;
    }
    
    selectedFile = file;
    
    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        showPreview();
    };
    reader.readAsDataURL(file);
}

/**
 * Afficher la prévisualisation
 */
function showPreview() {
    dropZone.classList.add('hidden');
    previewSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

/**
 * Analyser l'image
 */
async function analyzeImage() {
    if (!selectedFile) {
        showError('Aucune image sélectionnée');
        return;
    }
    
    // Afficher le loader
    previewSection.classList.add('hidden');
    loader.classList.remove('hidden');
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Préparer la requête
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Appel API
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Mettre à jour les statistiques
        updateStats(result);
        
        // Afficher les résultats
        displayResults(result);
        
    } catch (error) {
        console.error('Erreur:', error);
        showError(`Erreur lors de l'analyse: ${error.message}`);
        previewSection.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Afficher les résultats
 */
function displayResults(data) {
    loader.classList.add('hidden');
    resultSection.classList.remove('hidden');
    
    const resultCard = document.querySelector('.result-card');
    const resultHeader = document.querySelector('.result-header');
    
    // Dessiner l'image avec la bounding box
    drawImageWithBBox(data);
    
    // Emoji et statut
    document.getElementById('resultEmoji').textContent = data.emoji;
    document.getElementById('resultStatus').textContent = data.status;
    
    // Couleur du header
    resultHeader.style.backgroundColor = `${data.color}20`;
    document.getElementById('resultStatus').style.color = data.color;
    resultCard.style.borderColor = data.color;
    
    // Barre de confiance
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    confidenceBar.style.width = `${data.confidence_percent}%`;
    confidenceBar.style.backgroundColor = data.color;
    confidenceText.textContent = `${data.confidence_percent}%`;
    
    // Message
    document.getElementById('resultMessage').textContent = data.message;
    
    // Détails
    document.getElementById('className').textContent = data.class_name || 'N/A';
    document.getElementById('priority').textContent = data.priority || 'N/A';
    document.getElementById('numDetections').textContent = data.num_detections || 0;
    document.getElementById('processingTime').textContent = `${data.processing_time}s`;
}

/**
 * Dessiner l'image avec la bounding box
 */
function drawImageWithBBox(data) {
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Ajuster la taille du canvas
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        // Redimensionner si nécessaire
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Dessiner la bounding box si disponible
        if (data.bbox && data.num_detections > 0) {
            const scaleX = width / img.width;
            const scaleY = height / img.height;
            
            const x1 = data.bbox.x1 * scaleX;
            const y1 = data.bbox.y1 * scaleY;
            const x2 = data.bbox.x2 * scaleX;
            const y2 = data.bbox.y2 * scaleY;
            
            const boxWidth = x2 - x1;
            const boxHeight = y2 - y1;
            
            // Dessiner le rectangle
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x1, y1, boxWidth, boxHeight);
            
            // Fond pour le label
            const label = `${data.status} ${data.confidence_percent}%`;
            ctx.font = 'bold 18px Arial';
            const textWidth = ctx.measureText(label).width;
            const textHeight = 24;
            
            // Rectangle de fond pour le texte
            ctx.fillStyle = data.color;
            ctx.fillRect(x1, y1 - textHeight - 8, textWidth + 16, textHeight + 8);
            
            // Texte
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, x1 + 8, y1 - 10);
        }
    };
    
    img.src = previewImage.src;
}

/**
 * Afficher une erreur
 */
function showError(message) {
    loader.classList.add('hidden');
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    
    document.getElementById('errorMessage').textContent = message;
    
    // Masquer l'erreur après 5 secondes
    setTimeout(() => {
        errorSection.classList.add('hidden');
        if (!previewSection.classList.contains('hidden')) {
            previewSection.classList.remove('hidden');
        } else {
            dropZone.classList.remove('hidden');
        }
    }, 5000);
}

/**
 * Réinitialiser l'application
 */
function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    
    dropZone.classList.remove('hidden');
    previewSection.classList.add('hidden');
    loader.classList.add('hidden');
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

/**
 * Mettre à jour les statistiques
 */
function updateStats(result) {
    stats.totalAnalyses++;
    stats.totalConfidence += result.confidence || 0;
    stats.totalTime += result.processing_time || 0;
    
    // Afficher les statistiques
    document.getElementById('totalAnalyses').textContent = stats.totalAnalyses;
    document.getElementById('avgConfidence').textContent = 
        `${((stats.totalConfidence / stats.totalAnalyses) * 100).toFixed(1)}%`;
    document.getElementById('avgTime').textContent = 
        `${(stats.totalTime / stats.totalAnalyses).toFixed(2)}s`;
    
    // Animation des nombres
    animateValue('totalAnalyses', stats.totalAnalyses - 1, stats.totalAnalyses, 500);
}

/**
 * Animer un nombre
 */
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// ============================================================================
// INITIALISATION
// ============================================================================

console.log('🗑️ Application Détecteur de Poubelles chargée');

// Test de connexion à l'API
fetch(`${API_URL}/health`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ API connectée:', data);
        // Afficher un indicateur visuel de connexion réussie
        const badge = document.querySelector('.badge-success');
        if (badge) {
            badge.textContent = '✓ API Connectée';
            badge.style.animation = 'pulse 2s infinite';
        }
    })
    .catch(error => {
        console.error('❌ Erreur de connexion à l\'API:', error);
        console.error('🔍 Vérifiez que le backend est déployé sur:', API_URL);
        
        // Afficher un avertissement visuel
        const badge = document.querySelector('.badge-success');
        if (badge) {
            badge.textContent = '⚠️ Backend non disponible';
            badge.style.background = 'rgba(239, 68, 68, 0.2)';
            badge.style.color = '#fecaca';
            badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
        
        // Ne pas afficher d'erreur au chargement, juste un log
        console.warn('ℹ️ Le backend sera requis pour analyser les images');
    });
