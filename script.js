let models = JSON.parse(localStorage.getItem('cb_dashboard_models')) || [];
let favorites = JSON.parse(localStorage.getItem('cb_dashboard_favs')) || [];
let hiddenModels = JSON.parse(localStorage.getItem('cb_dashboard_hidden')) || [];
let history = JSON.parse(localStorage.getItem('cb_dashboard_history')) || [];
let tags = JSON.parse(localStorage.getItem('cb_dashboard_tags')) || {};

let showOnlyFavorites = false;
let showHiddenModels = false;
let alphabeticalSort = false;
let currentLayout = parseInt(localStorage.getItem('cb_dashboard_layout_mode')) || 0;
let selectedTagFilter = '';
let targetTagUser = null;
let contextUser = null;

const grid = document.getElementById('grid');
const addModelForm = document.getElementById('addModelForm');
const newModelInput = document.getElementById('newModelInput');
const resetBtn = document.getElementById('resetBtn');
const favFilterBtn = document.getElementById('favFilterBtn');
const hideToggleBtn = document.getElementById('hideToggleBtn');
const sortToggleBtn = document.getElementById('sortToggleBtn');
const layoutToggleBtn = document.getElementById('layoutToggleBtn');
const hiddenCount = document.getElementById('hiddenCount');
const tagFilterSelect = document.getElementById('tagFilterSelect');
const historyBtn = document.getElementById('historyBtn');
const historyMenu = document.getElementById('historyMenu');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const unhideAllBtn = document.getElementById('unhideAllBtn');
const contextMenu = document.getElementById('contextMenu');

const focusOverlay = document.getElementById('focusOverlay');
const focusBody = document.getElementById('focusBody');
const focusTitle = document.getElementById('focusTitle');
const closeFocusBtn = document.getElementById('closeFocusBtn');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

const tagModal = document.getElementById('tagModal');
const modalTagInput = document.getElementById('modalTagInput');
const tagModalTitle = document.getElementById('tagModalTitle');
const existingTagsDatalist = document.getElementById('existingTagsDatalist');
const saveTagBtn = document.getElementById('saveTagBtn');
const cancelTagBtn = document.getElementById('cancelTagBtn');

function applyLayout() {
  grid.classList.remove('compact-mode', 'miniature-mode');
  layoutToggleBtn.classList.remove('active');

  if (currentLayout === 1) {
    grid.classList.add('compact-mode');
    layoutToggleBtn.classList.add('active');
    layoutToggleBtn.textContent = '📐 Mode Compact';
  } else if (currentLayout === 2) {
    grid.classList.add('miniature-mode');
    layoutToggleBtn.classList.add('active');
    layoutToggleBtn.textContent = '📐 Mode Miniature';
  } else {
    layoutToggleBtn.textContent = '📐 Mode Standard';
  }
  localStorage.setItem('cb_dashboard_layout_mode', currentLayout);
  renderGrid();
}

applyLayout();

const streamObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const container = entry.target;
    const iframe = container.querySelector('iframe');
    if (!iframe) return;

    const targetSrc = iframe.dataset.src;
    if (entry.isIntersecting) {
      if (iframe.src !== targetSrc) {
        iframe.src = targetSrc;
      }
    } else {
      if (iframe.src && iframe.src !== 'about:blank') {
        iframe.src = 'about:blank';
      }
    }
  });
}, {
  root: null,
  rootMargin: '100px',
  threshold: 0.05
});

function saveModels() { localStorage.setItem('cb_dashboard_models', JSON.stringify(models)); }
function saveFavorites() { localStorage.setItem('cb_dashboard_favs', JSON.stringify(favorites)); }
function saveHidden() { 
  localStorage.setItem('cb_dashboard_hidden', JSON.stringify(hiddenModels)); 
  updateHiddenCount();
}
function saveHistory() { 
  localStorage.setItem('cb_dashboard_history', JSON.stringify(history)); 
  updateHistoryMenu();
}
function saveTags() { localStorage.setItem('cb_dashboard_tags', JSON.stringify(tags)); }

function getAllExistingTags() {
  const set = new Set();
  Object.values(tags).forEach(list => list.forEach(t => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

function addModelToState(username) {
  const lower = username.toLowerCase();
  if (!models.map(m => m.toLowerCase()).includes(lower)) {
    models.push(username);
    saveModels();
  }
  history = [username, ...history.filter(h => h.toLowerCase() !== lower)];
  saveHistory();
  renderGrid();
}

function toggleFavorite(username) {
  const lower = username.toLowerCase();
  if (favorites.includes(lower)) {
    favorites = favorites.filter(f => f !== lower);
  } else {
    favorites.push(lower);
  }
  saveFavorites();
  renderGrid();
}

function toggleHideModel(username) {
  const lower = username.toLowerCase();
  if (hiddenModels.includes(lower)) {
    hiddenModels = hiddenModels.filter(h => h !== lower);
  } else {
    hiddenModels.push(lower);
  }
  saveHidden();
  renderGrid();
}

function openFocusMode(username) {
  focusTitle.textContent = `Direct - ${username}`;
  const embedUrl = `https://chaturbate.com/embed/${encodeURIComponent(username)}/?embed_video_only=0&scrolling=no`;
  focusBody.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  focusOverlay.classList.add('show');
}

function closeFocusMode() {
  focusBody.innerHTML = '';
  focusOverlay.classList.remove('show');
}

closeFocusBtn.addEventListener('click', closeFocusMode);
focusOverlay.addEventListener('click', (e) => {
  if (e.target === focusOverlay) closeFocusMode();
});

window.openTagModal = function(username) {
  targetTagUser = username;
  tagModalTitle.textContent = `Ajouter un tag pour ${username}`;
  modalTagInput.value = '';
  
  existingTagsDatalist.innerHTML = '';
  getAllExistingTags().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    existingTagsDatalist.appendChild(opt);
  });

  tagModal.classList.add('show');
  setTimeout(() => modalTagInput.focus(), 50);
};

function closeTagModal() {
  tagModal.classList.remove('show');
  targetTagUser = null;
}

function submitTagModal() {
  if (!targetTagUser) return;
  const val = modalTagInput.value.trim();
  if (val) {
    const lower = targetTagUser.toLowerCase();
    const current = tags[lower] || [];
    if (!current.includes(val)) {
      tags[lower] = [...current, val];
      saveTags();
      renderGrid();
    }
  }
  closeTagModal();
}

saveTagBtn.addEventListener('click', submitTagModal);
cancelTagBtn.addEventListener('click', closeTagModal);
modalTagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitTagModal();
  if (e.key === 'Escape') closeTagModal();
});

window.removeTag = function(username, tagToRemove) {
  const lower = username.toLowerCase();
  if (tags[lower]) {
    tags[lower] = tags[lower].filter(t => t !== tagToRemove);
    if (tags[lower].length === 0) delete tags[lower];
    saveTags();
    renderGrid();
  }
};

function updateTagFilterOptions() {
  const existingTags = getAllExistingTags();
  const totalModelsCount = models.length;

  tagFilterSelect.innerHTML = `<option value="">🏷️ (Tous) (${totalModelsCount})</option>`;
  
  existingTags.forEach(t => {
    const count = models.filter(m => {
      const mTags = tags[m.toLowerCase()] || [];
      return mTags.includes(t);
    }).length;

    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = `🏷️ ${t} (${count})`;
    if (t === selectedTagFilter) opt.selected = true;
    tagFilterSelect.appendChild(opt);
  });
}

function updateHiddenCount() {
  const count = models.filter(m => hiddenModels.includes(m.toLowerCase())).length;
  hiddenCount.textContent = `(${count})`;
}

function createCard(username) {
  const lower = username.toLowerCase();
  const isFav = favorites.includes(lower);
  const isHidden = hiddenModels.includes(lower);
  const modelTags = (tags[lower] || []).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  const card = document.createElement('div');
  card.className = `model-card ${isHidden ? 'is-hidden' : ''}`;

  const tagsHtml = modelTags.map(t => 
    `<span class="tag-badge" title="Cliquer pour supprimer" onclick="removeTag('${username}', '${t}')">${t} &times;</span>`
  ).join('');

  const embedUrl = `https://chaturbate.com/embed/${encodeURIComponent(username)}/?embed_video_only=0&scrolling=no`;
  const thumbUrl = `https://img.live-jasmin.com/photos/chaturbate/${encodeURIComponent(username)}.jpg`;

  let playerInnerHtml = '';
  if (currentLayout === 2) {
    playerInnerHtml = `
      <div class="thumbnail-preview" style="background-image: url('${thumbUrl}');"></div>
    `;
  } else {
    playerInnerHtml = `
      <iframe 
        data-src="${embedUrl}" 
        scrolling="no"
        allow="autoplay; fullscreen" 
        allowfullscreen>
      </iframe>
    `;
  }

  card.innerHTML = `
    <div class="model-header">
      <div class="model-title-area">
        <div class="status-dot" id="dot-${lower}" title="Statut"></div>
        <span class="model-name">${username}</span>
        <div class="tags-container">${tagsHtml}</div>
      </div>
      <div class="header-actions">
        <button class="btn-icon-subtle" title="Mode plein écran / Focus" onclick="openFocusMode('${username}')">🔍</button>
        <button class="btn-icon-subtle" title="${isHidden ? 'Démasquer' : 'Masquer'}" onclick="toggleHideModel('${username}')">
          ${isHidden ? '👁️' : '🙈'}
        </button>
        <button class="btn-icon-subtle" title="Ajouter un tag" onclick="openTagModal('${username}')">🏷️</button>
        <button class="btn-fav ${isFav ? 'is-favorite' : ''}" title="Mettre en favori" onclick="toggleFavorite('${username}')">&#9733;</button>
        <button class="btn-delete" title="Supprimer" onclick="removeModel('${username}')">&times;</button>
      </div>
    </div>
    <div class="player-container" id="container-${lower}">
      ${playerInnerHtml}
    </div>
  `;

  const playerContainer = card.querySelector('.player-container');
  
  if (currentLayout === 2) {
    playerContainer.addEventListener('click', () => {
      playerContainer.innerHTML = `<iframe src="${embedUrl}" scrolling="no" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    });
  } else {
    streamObserver.observe(playerContainer);
  }

  const imgTest = new Image();
  imgTest.onload = () => {
    const dot = card.querySelector(`#dot-${lower}`);
    if (dot) dot.classList.add('online');
  };
  imgTest.src = thumbUrl;

  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextUser = username;
    
    document.getElementById('ctxFav').textContent = isFav ? '⭐ Retirer Favori' : '⭐ Ajouter Favori';
    document.getElementById('ctxHide').textContent = isHidden ? '👁️ Démasquer' : '🙈 Masquer';
    
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.classList.add('show');
  });

  return card;
}

document.getElementById('ctxFav').addEventListener('click', () => {
  if (contextUser) toggleFavorite(contextUser);
  contextMenu.classList.remove('show');
});

document.getElementById('ctxHide').addEventListener('click', () => {
  if (contextUser) toggleHideModel(contextUser);
  contextMenu.classList.remove('show');
});

document.getElementById('ctxTag').addEventListener('click', () => {
  if (contextUser) openTagModal(contextUser);
  contextMenu.classList.remove('show');
});

document.getElementById('ctxDelete').addEventListener('click', () => {
  if (contextUser) removeModel(contextUser);
  contextMenu.classList.remove('show');
});

document.addEventListener('click', () => {
  contextMenu.classList.remove('show');
});

function renderGrid() {
  streamObserver.disconnect();
  grid.innerHTML = '';
  
  updateTagFilterOptions();
  updateHiddenCount();
  
  let displayModels = [...models];

  if (alphabeticalSort) {
    displayModels.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  } else {
    displayModels.sort((a, b) => {
      const aFav = favorites.includes(a.toLowerCase());
      const bFav = favorites.includes(b.toLowerCase());
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b, 'fr', { sensitivity: 'base' });
    });
  }

  if (!showHiddenModels) {
    displayModels = displayModels.filter(m => !hiddenModels.includes(m.toLowerCase()));
  }

  if (showOnlyFavorites) {
    displayModels = displayModels.filter(m => favorites.includes(m.toLowerCase()));
  }

  if (selectedTagFilter) {
    displayModels = displayModels.filter(m => {
      const mTags = tags[m.toLowerCase()] || [];
      return mTags.includes(selectedTagFilter);
    });
  }

  if (displayModels.length === 0) {
    grid.innerHTML = `<div class="empty-message">Aucun modèle à afficher pour le moment.</div>`;
    updateHistoryMenu();
    return;
  }

  displayModels.forEach(username => {
    grid.appendChild(createCard(username));
  });

  updateHistoryMenu();
}

function removeSingleHistory(username) {
  const lower = username.toLowerCase();
  history = history.filter(h => h.toLowerCase() !== lower);
  saveHistory();
}

function updateHistoryMenu() {
  historyCount.textContent = `(${history.length})`;
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<div style="padding: 12px; font-size: 0.8rem; color: #64748b; text-align: center;">Historique vide</div>';
    return;
  }

  const sortedHistory = [...history].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  sortedHistory.forEach(username => {
    const lower = username.toLowerCase();
    const isPresent = models.map(m => m.toLowerCase()).includes(lower);

    const item = document.createElement('div');
    item.className = 'history-item';
    
    item.innerHTML = `
      <span class="history-username" title="${isPresent ? 'Déjà affiché' : 'Cliquer pour réajouter'}">${username}</span>
      <div class="history-actions">
        ${isPresent ? '<span class="badge-added">Actif</span>' : ''}
        <button class="btn-remove-hist" title="Supprimer de l'historique">&times;</button>
      </div>
    `;

    const nameSpan = item.querySelector('.history-username');
    if (!isPresent) {
      nameSpan.addEventListener('click', () => {
        addModelToState(username);
      });
    }

    const deleteBtn = item.querySelector('.btn-remove-hist');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSingleHistory(username);
    });

    historyList.appendChild(item);
  });
}

function positionHistoryMenu() {
  const btnRect = historyBtn.getBoundingClientRect();
  const padding = 10;
  const menuWidth = Math.min(260, window.innerWidth - (padding * 2));
  
  let left = btnRect.right - menuWidth;
  if (left < padding) left = padding;
  if (left + menuWidth > window.innerWidth - padding) {
    left = window.innerWidth - menuWidth - padding;
  }

  let top = btnRect.bottom + 8;
  const expectedHeight = 300;
  if (top + expectedHeight > window.innerHeight - padding) {
    top = Math.max(padding, btnRect.top - expectedHeight - 8);
  }

  historyMenu.style.top = `${top}px`;
  historyMenu.style.left = `${left}px`;
  historyMenu.style.width = `${menuWidth}px`;
}

historyBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isVisible = historyMenu.classList.contains('show');
  
  if (!isVisible) {
    historyMenu.classList.add('show');
    positionHistoryMenu();
  } else {
    historyMenu.classList.remove('show');
  }
});

document.addEventListener('click', () => {
  historyMenu.classList.remove('show');
});

historyMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

hideToggleBtn.addEventListener('click', () => {
  showHiddenModels = !showHiddenModels;
  hideToggleBtn.classList.toggle('active', showHiddenModels);
  renderGrid();
});

sortToggleBtn.addEventListener('click', () => {
  alphabeticalSort = !alphabeticalSort;
  sortToggleBtn.classList.toggle('active', alphabeticalSort);
  sortToggleBtn.textContent = alphabeticalSort ? '⭐ Favoris d’abord' : '🔤 Tri A-Z';
  renderGrid();
});

layoutToggleBtn.addEventListener('click', () => {
  currentLayout = (currentLayout + 1) % 3;
  applyLayout();
});

exportBtn.addEventListener('click', () => {
  const backupData = {
    models,
    favorites,
    hiddenModels,
    history,
    tags,
    exportDate: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `directs-live-backup-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      
      if (imported.models && Array.isArray(imported.models)) {
        models = imported.models;
        favorites = Array.isArray(imported.favorites) ? imported.favorites : [];
        hiddenModels = Array.isArray(imported.hiddenModels) ? imported.hiddenModels : [];
        history = Array.isArray(imported.history) ? imported.history : [];
        tags = (imported.tags && typeof imported.tags === 'object') ? imported.tags : {};

        saveModels();
        saveFavorites();
        saveHidden();
        saveHistory();
        saveTags();

        renderGrid();
        alert('Configuration importée avec succès !');
      } else {
        alert('Format de fichier JSON invalide.');
      }
    } else (err) => {
      alert('Erreur lors de la lecture du fichier JSON.');
    } catch (err) {
      alert('Erreur lors de la lecture du fichier JSON.');
      console.error(err);
    }
    importFile.value = '';
  };
  reader.readAsText(file);
});

unhideAllBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (hiddenModels.length === 0) {
    alert('Aucun modèle masqué actuellement.');
    return;
  }
  hiddenModels = [];
  saveHidden();
  renderGrid();
});

tagFilterSelect.addEventListener('change', (e) => {
  selectedTagFilter = e.target.value;
  renderGrid();
});

addModelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = newModelInput.value.trim();

  if (username) {
    addModelToState(username);
    newModelInput.value = '';
  }
});

function removeModel(username) {
  const lower = username.toLowerCase();
  models = models.filter(m => m.toLowerCase() !== lower);
  saveModels();
  renderGrid();
}

favFilterBtn.addEventListener('click', () => {
  showOnlyFavorites = !showOnlyFavorites;
  favFilterBtn.classList.toggle('active', showOnlyFavorites);
  renderGrid();
});

resetBtn.addEventListener('click', () => {
  const nonFavsCount = models.filter(m => !favorites.includes(m.toLowerCase())).length;

  if (nonFavsCount === 0) {
    alert('Aucun modèle non-favori à supprimer.');
    return;
  }

  if (confirm('Voulez-vous supprimer tous les modèles qui ne sont pas marqués en favoris ?')) {
    models = models.filter(m => favorites.includes(m.toLowerCase()));
    saveModels();
    renderGrid();
  }
});

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Voulez-vous effacer l\'historique complet des pseudos enregistrés ?')) {
    history = [];
    saveHistory();
  }
});

window.addEventListener('resize', () => {
  if (historyMenu.classList.contains('show')) {
    positionHistoryMenu();
  }
});

renderGrid();
