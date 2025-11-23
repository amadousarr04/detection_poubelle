# 🚀 Guide de Déploiement sur Render

## 📋 Prérequis

- Compte GitHub avec le projet poussé
- Compte Render.com
- Fichier `best.pt` dans le repository (via Git LFS)

## 🔧 Étape 1 : Déployer le Backend

1. Aller sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquer sur **New** → **Web Service**
3. Connecter votre repository GitHub `detection_poubelle`
4. Configuration du service :
   - **Name** : `detecteur-poubelles-backend` (⚠️ Important : gardez ce nom exact)
   - **Environment** : `Python`
   - **Build Command** : `pip install -r backend/requirements.txt`
   - **Start Command** : `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type** : `Free`

5. Variables d'environnement (optionnel) :
   - `PYTHON_VERSION` : `3.11`

6. Cliquer sur **Create Web Service**

7. **Attendre le déploiement** (⏳ 10-15 minutes la première fois)

8. Une fois déployé, votre backend sera disponible à :
   ```
   https://detecteur-poubelles-backend.onrender.com
   ```

9. Testez l'API :
   - Health check : https://detecteur-poubelles-backend.onrender.com/health
   - Documentation : https://detecteur-poubelles-backend.onrender.com/docs

## 🎨 Étape 2 : Déployer le Frontend

1. Sur Render Dashboard, cliquer sur **New** → **Static Site**
2. Connecter le même repository
3. Configuration :
   - **Name** : `detection-poubelle-frontend`
   - **Build Command** : `echo "No build needed"`
   - **Publish Directory** : `frontend`

4. Cliquer sur **Create Static Site**

5. Le frontend sera disponible à :
   ```
   https://detection-poubelle-frontend.onrender.com
   ```

## 🔄 Étape 3 : Vérifier la Configuration

### Vérifier l'URL du Backend dans le Frontend

Si vous avez changé le nom du backend, mettez à jour `frontend/script.js` :

```javascript
const API_URL = isLocal
    ? 'http://127.0.0.1:8000'
    : 'https://VOTRE-NOM-BACKEND.onrender.com';  // ⚠️ Changez ici
```

### Tester la Connexion

1. Ouvrez la console du navigateur (F12) sur votre frontend
2. Vous devriez voir :
   ```
   🗑️ Application Détecteur de Poubelles chargée
   🌍 Environnement: PRODUCTION
   📡 API URL: https://detecteur-poubelles-backend.onrender.com
   ✅ API connectée: {status: "healthy", ...}
   ```

## ⚠️ Problèmes Courants

### Erreur CORS / Failed to fetch

**Cause** : Le backend n'est pas encore déployé ou l'URL est incorrecte

**Solution** :
1. Vérifiez que le backend est bien en ligne (vert sur Render Dashboard)
2. Testez l'URL du backend directement dans le navigateur
3. Vérifiez que le nom du service correspond dans `script.js`

### Backend trop lent / Timeout

**Cause** : Le plan gratuit de Render met les services en veille après 15 min d'inactivité

**Solution** :
- Le premier chargement peut prendre 30-60 secondes (réveil du service)
- Les requêtes suivantes seront rapides
- Pour éviter la veille : passer à un plan payant

### Modèle best.pt non trouvé

**Cause** : Git LFS n'est pas configuré ou le fichier n'a pas été poussé

**Solution** :
```bash
# Installer Git LFS
git lfs install

# Tracker le fichier
git lfs track "backend/best.pt"

# Commit et push
git add .gitattributes backend/best.pt
git commit -m "Add model via Git LFS"
git push origin main
```

## 📊 Logs et Monitoring

### Voir les logs du Backend
1. Aller sur Render Dashboard
2. Sélectionner votre service backend
3. Cliquer sur **Logs**

### Logs utiles à chercher :
- `✅ Modèle chargé depuis:` → Le modèle est bien chargé
- `INFO:     Application startup complete` → Le serveur est prêt
- `ERROR:` → Erreurs à résoudre

## 🎯 URLs Finales

Une fois déployé avec succès :

- **Frontend** : https://detection-poubelle-frontend.onrender.com
- **Backend** : https://detecteur-poubelles-backend.onrender.com
- **API Docs** : https://detecteur-poubelles-backend.onrender.com/docs

## 🔐 Sécurité

Pour la production, considérez :
- Restreindre CORS à votre domaine frontend uniquement
- Ajouter une authentification API si nécessaire
- Utiliser des variables d'environnement pour les secrets

---

**Bon déploiement ! 🚀**
