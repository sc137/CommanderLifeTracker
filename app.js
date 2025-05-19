const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");
const addPlayerModal = document.getElementById("add-player-modal");
const addPlayerBtn = document.getElementById("add-player-btn");
const closeAddPlayerBtn = document.getElementById("close-add-player-btn");
const newPlayerBtn = document.getElementById("new-player-btn");
const savedPlayersList = document.getElementById("saved-players-list");
const addPlayerDoneBtn = document.getElementById("add-player-done-btn");
const aboutLink = document.getElementById("about-link");
const aboutModal = document.getElementById("about-modal");
const closeAboutBtn = document.getElementById("close-about-btn");
const newPlayerModal = document.getElementById("new-player-modal");
const saveNewPlayerBtn = document.getElementById("save-new-player-btn");
const cancelNewPlayerBtn = document.getElementById("cancel-new-player-btn");
const newPlayerInput = document.getElementById("new-player-input");

let addPlayerModalSource = null; // "settings" or null
let newPlayerModalSource = null; // "settings" or null
// --- Internal state for life/poison ---
let playerState = {};

// Hamburger menu functionality
const hamburger = document.getElementById("hamburger");
const menuOverlay = document.getElementById("menu-overlay");
const menuPanel = document.querySelector(".menu-panel");
const viewLogLink = document.getElementById("view-log-link");
const settingsLink = document.getElementById("settings-link");

let gameEnded = false;
let winner = null;

// async function declareWinner(playerName) {
//   if (gameEnded) return; // Prevent multiple calls
//   const confirmed = await showConfirm(
//     `This will end the game.`, `Declare ${playerName} as the winner?`
//   );
//   if (!confirmed) return;
//   gameEnded = true;
// }

// Open menu
hamburger.addEventListener("click", () => {
  menuOverlay.hidden = false;
  menuOverlay.setAttribute("aria-visible", "true");
  // Focus first link for accessibility
  setTimeout(() => viewLogLink.focus(), 100);
});

// Close menu when clicking outside panel
menuOverlay.addEventListener("mousedown", (e) => {
  if (!menuPanel.contains(e.target)) {
    closeMenu();
  }
});

// Close menu with Escape key
document.addEventListener("keydown", (e) => {
  if (
    menuOverlay.getAttribute("aria-visible") === "true" &&
    e.key === "Escape"
  ) {
    closeMenu();
  }
});

// Show About Modal
aboutLink.addEventListener("click", (e) => {
  e.preventDefault();
  menuOverlay.hidden = true;
  modalOverlay.hidden = false;
  aboutModal.hidden = false;
});

// Close About Modal
closeAboutBtn.addEventListener("click", () => {
  aboutModal.hidden = true;
  modalOverlay.hidden = true;
});

function closeMenu() {
  menuOverlay.setAttribute("aria-visible", "false");
  setTimeout(() => {
    menuOverlay.hidden = true;
  }, 250);
  hamburger.focus();
}

// Prevent overlay click from closing when clicking inside panel
menuPanel.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

// Handle menu item clicks (placeholder)
viewLogLink.addEventListener("click", (e) => {
  e.preventDefault();
  closeMenu();
  // TODO: Show game log modal
});

settingsLink.addEventListener("click", (e) => {
  e.preventDefault();
  closeMenu();
  // TODO: Show settings modal
});

// Save current game state on any relevant change
function saveCurrentGame() {
  localStorage.setItem(
    "cmdrtrackr_current_game",
    JSON.stringify({
      players: currentGamePlayers,
      state: playerState,
      gameEnded: gameEnded,
      winner: winner
    })
  );
}

// Game Control Buttons: basic click handlers
document.getElementById("new-game-btn").addEventListener("click", startNewGame);
async function startNewGame() {
  // console.log("startNewGame called");
  // If there are players, confirm before clearing
  if (getCurrentGamePlayers().length > 0) {
    const confirmed = await showConfirm(
      "This will clear the current game.",
      "Start a new game?"
    );
    if (!confirmed) return;
  }

  // Always reset all game state
  currentGamePlayers = [];
  for (const key in playerState) delete playerState[key];
  for (const key in commanderDamage) delete commanderDamage[key];
  gameEnded = false;
  saveCurrentGame();

  // Update UI
  updateCurrentGamePlayersUI();

  // Hide all modals
  modalOverlay.hidden = true;
  addPlayerModal.hidden = true;
  newPlayerModal.hidden = true;
  document.getElementById("commander-damage-modal").hidden = true;
  document.getElementById("poison-modal").hidden = true;

  // If no players, add default player automatically
  const defaultPlayer = getDefaultPlayer();
  const savedPlayers = getSavedPlayers();
  if (
    getCurrentGamePlayers().length === 0 &&
    defaultPlayer &&
    savedPlayers.includes(defaultPlayer)
  ) {
    addPlayerToGame(defaultPlayer);
    updateCurrentGamePlayersUI();
    saveCurrentGame();
    return;
  }

  // Check if there are no saved players at all
  if (savedPlayers.length === 0) {
    // Show New Player modal directly
    modalOverlay.hidden = false;
    addPlayerModal.hidden = true;
    newPlayerModal.hidden = false;

    try {
      newPlayerInput.focus();
    } catch (e) {
      console.log("Could not focus new player input:", e);
    }
    return;
  }

  // If still no players, open the Add Player dialog
  if (getCurrentGamePlayers().length === 0) {
    renderSavedPlayersList();
    modalOverlay.hidden = false;
    addPlayerModal.hidden = false;
    newPlayerModal.hidden = true;
  }
  updateAddPlayerBtnVisibility();
}

// Show Add Player Modal
addPlayerBtn.addEventListener("click", () => {
  renderSavedPlayersList();
  modalOverlay.hidden = false;
  addPlayerModal.hidden = false;
  newPlayerModal.hidden = true;
  addPlayerDoneBtn.style.display = "";
});

// Close Add Player Modal
closeAddPlayerBtn.addEventListener("click", closeAddPlayerModal);

function closeAddPlayerModal() {
  addPlayerModal.hidden = true;
  addPlayerDoneBtn.style.display = ""; // Reset Done button for next time

  // Do NOT reset the game state here! Only update UI.
  updateCurrentGamePlayersUI();

  if (addPlayerModalSource === "settings") {
    renderSettingsPlayersList();
    document.getElementById("settings-modal").hidden = false;
    modalOverlay.hidden = false;
    addPlayerModalSource = null;
  } else {
    modalOverlay.hidden = true;
  }
}

// Prevent modal-content click from closing modal
modalContent.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

// Show New Player Input Modal
newPlayerBtn.addEventListener("click", () => {
  newPlayerInput.value = "";
  modalOverlay.hidden = false;
  addPlayerModal.hidden = true;
  newPlayerModal.hidden = false;
  setTimeout(() => newPlayerInput.focus(), 100);
});

// Hide New Player Modal (and return to Add Player Modal)
function closeNewPlayerModal() {
  newPlayerModal.hidden = true;
  if (newPlayerModalSource === "settings") {
    document.getElementById("settings-modal").hidden = false;
    modalOverlay.hidden = false;
    newPlayerModalSource = null;
  } else {
    addPlayerModal.hidden = false;
    setTimeout(() => newPlayerBtn.focus(), 100);
  }
}

cancelNewPlayerBtn.addEventListener("click", closeNewPlayerModal);

// Prevent modal-content click from closing modal
modalContent.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

// --- Local Storage Player Management ---

const PLAYER_LIST_KEY = "cmdrtrackr_players";
const DEFAULT_PLAYER_KEY = "cmdrtrackr_default_player";

// Save a new player (prevent duplicates, trim whitespace)
function savePlayer(playerName) {
  if (!playerName || typeof playerName !== "string") return false;
  const name = playerName.trim();
  if (!name) return false;
  let players = getSavedPlayers();
  if (players.includes(name)) return false;
  players.push(name);
  localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(players));
  return true;
}

// Get array of saved players
function getSavedPlayers() {
  const data = localStorage.getItem(PLAYER_LIST_KEY);
  if (!data) return [];
  try {
    const arr = JSON.parse(data);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Remove a player
function removePlayer(playerName) {
  let players = getSavedPlayers();
  players = players.filter((name) => name !== playerName);
  localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(players));
  // If removed player was default, clear default
  if (getDefaultPlayer() === playerName) {
    localStorage.removeItem(DEFAULT_PLAYER_KEY);
  }
}

// Render saved players list UI
let selectedPlayers = new Set();
// original multi select (works)
// function renderSavedPlayersList() {
//   const savedPlayers = getSavedPlayers();
//   const savedPlayersList = document.getElementById("saved-players-list");
//   savedPlayersList.innerHTML = "";
//   selectedPlayers = new Set();

//   if (savedPlayers.length === 0) {
//     savedPlayersList.innerHTML =
//       '<div class="empty-player-list">No saved players yet.</div>';
//     return;
//   }
//   savedPlayers.forEach((player) => {
//     const row = document.createElement("div");
//     row.className = "saved-player-row";
//     row.textContent = player;

//     // Toggle selection on click
//     row.addEventListener("click", () => {
//       if (selectedPlayers.has(player)) {
//         selectedPlayers.delete(player);
//         row.classList.remove("selected");
//       } else {
//         selectedPlayers.add(player);
//         row.classList.add("selected");
//       }
//     });

//     savedPlayersList.appendChild(row);
//   });
// }

// alphabetized multi select
function renderSavedPlayersList() {
  const savedPlayers = getSavedPlayers();
  const defaultPlayer = getDefaultPlayer();

  // Remove default player from the list if present
  const players = savedPlayers.filter((p) => p !== defaultPlayer);

  // Sort the rest alphabetically (case-insensitive)
  players.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  // If default player exists, put it at the top
  const orderedPlayers = defaultPlayer ? [defaultPlayer, ...players] : players;

  const savedPlayersList = document.getElementById("saved-players-list");
  savedPlayersList.innerHTML = "";
  selectedPlayers = new Set();

  if (orderedPlayers.length === 0) {
    // No saved players: show the New Player modal instead
    modalOverlay.hidden = false;
    addPlayerModal.hidden = true;
    newPlayerModal.hidden = false;
    setTimeout(() => newPlayerInput.focus(), 100);
    return;
  }

  orderedPlayers.forEach((player) => {
    const row = document.createElement("div");
    row.className = "saved-player-row";
    row.textContent = player;

    // Toggle selection on click
    row.addEventListener("click", () => {
      if (selectedPlayers.has(player)) {
        selectedPlayers.delete(player);
        row.classList.remove("selected");
      } else {
        selectedPlayers.add(player);
        row.classList.add("selected");
      }
    });

    savedPlayersList.appendChild(row);
  });
}

// DO NOT USE
// function renderSavedPlayersList() {
//   const savedPlayers = getSavedPlayers();
//   const defaultPlayer = getDefaultPlayer();

//   // Remove default player from the list if present
//   const players = savedPlayers.filter(p => p !== defaultPlayer);

//   // Sort alphabetically (case-insensitive)
//   players.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

//   // If default player exists, put it at the top
//   const orderedPlayers = defaultPlayer ? [defaultPlayer, ...players] : players;

//   const list = document.getElementById("saved-players-list");
//   list.innerHTML = "";

//   orderedPlayers.forEach(player => {
//     const row = document.createElement("div");
//     row.className = "player-list-row"; // <-- Fix class name
//     row.innerHTML = `<span class="player-name">${player}</span>`;
//     // Toggle selection on click
//     row.addEventListener("click", () => {
//       if (selectedPlayers.has(player)) {
//         selectedPlayers.delete(player);
//         row.classList.remove("selected");
//       } else {
//         selectedPlayers.add(player);
//         row.classList.add("selected");
//       }
//     });
//     list.appendChild(row);
//   });
// }

// Handle Save New Player button click
saveNewPlayerBtn.addEventListener("click", handleSaveNewPlayer);

function handleSaveNewPlayer() {
  const name = newPlayerInput.value.trim();

  // Validate player name input
  if (!name) {
    showInputError("Please enter a player name.");
    return;
  }
  if (name.length > 24) {
    showInputError("Player name must be 24 characters or less.");
    return;
  }
  if (getSavedPlayers().includes(name)) {
    showInputError("Player name already exists.");
    return;
  }

  // Save to Local Storage
  const success = savePlayer(name);
  if (!success) {
    showInputError("Could not save player. Try a different name.");
    return;
  }

  // If no default player, set this as default
  if (!getDefaultPlayer()) {
    setDefaultPlayer(name);
  }

  // Update UI (refresh saved players list)
  renderSavedPlayersList();

  // Auto-add new player to current game
  addPlayerToGame(name);
  updateCurrentGamePlayersUI();

  // Close modal after success
  newPlayerModal.hidden = true;

  if (newPlayerModalSource === "settings") {
    document.getElementById("settings-modal").hidden = false;
    modalOverlay.hidden = false;
    renderSettingsPlayersList();
    newPlayerModalSource = null;
  } else {
    addPlayerModal.hidden = false;
    setTimeout(() => newPlayerBtn.focus(), 100);
  }
}

// Show input error below input field
function showInputError(msg) {
  let err = document.getElementById("new-player-error");
  if (!err) {
    err = document.createElement("div");
    err.id = "new-player-error";
    err.className = "input-error";
    newPlayerInput.parentNode.insertBefore(err, newPlayerInput.nextSibling);
  }
  err.textContent = msg;
  newPlayerInput.setAttribute("aria-invalid", "true");
}

// Clear error on input
newPlayerInput.addEventListener("input", () => {
  const err = document.getElementById("new-player-error");
  if (err) err.remove();
  newPlayerInput.removeAttribute("aria-invalid");
});
// Allow pressing Enter to save new player in the new player input modal
newPlayerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSaveNewPlayer();
  }
});

// --- Current Game Player Management ---

let currentGamePlayers = [];

// Add a player to the current game (prevent duplicates)
function addPlayerToGame(playerName) {
  if (!playerName || currentGamePlayers.includes(playerName)) return false;
  currentGamePlayers.push(playerName);
  saveCurrentGame();
  return true;
}

// Remove a player from the current game
function removePlayerFromGame(playerName) {
  const idx = currentGamePlayers.indexOf(playerName);
  if (idx !== -1) {
    currentGamePlayers.splice(idx, 1);
    saveCurrentGame();
    return true;
  }
  saveCurrentGame();
}

// Get array of current game players
function getCurrentGamePlayers() {
  return [...currentGamePlayers];
}

// Handle selection from saved players list
// savedPlayersList.addEventListener("click", function (e) {
//   const row = e.target.closest(".player-list-row");
//   if (!row) return;
//   const playerName = row.querySelector(".player-name")?.textContent;
//   if (!playerName) return;

//   // Prevent adding duplicate players to the current game
//   if (currentGamePlayers.includes(playerName)) {
//     showConfirm("Player is already in the current game.", "Notice");
//     return;
//   }

//   addPlayerToGame(playerName);
//   updateCurrentGamePlayersUI();
//   // Optionally close modal after selection:
//   addPlayerModal.hidden = true;
//   modalOverlay.hidden = true;
// });

// Update UI for current game players
function updateCurrentGamePlayersUI() {
  const container = document.getElementById("player-tiles");
  container.innerHTML = "";
  const players = getCurrentGamePlayers();
  if (players.length === 0) {
    container.innerHTML =
      '<div class="empty-player-list"><h2 class="empty-player-list">There are no players in this game yet.<br><br>Press +Player to add players to the game.<br><br> You may set a default player in the Settings.</h2></div>';
    return;
  }
  players.forEach((player) => {
    const tile = createPlayerTile(player);
    // Re-apply dead state if needed
    if (playerState[player] && playerState[player].dead) {
      tile.classList.add("player-died");
      tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    }
    container.appendChild(tile);
  });
}

// Utility: Generate a player tile element
function createPlayerTile(playerName) {
  ensurePlayerState(playerName);
  const { life, poison } = playerState[playerName];

  const tile = document.createElement("div");
  tile.className = "player-tile";
  tile.dataset.player = playerName;
  tile.setAttribute("draggable", "true");

  // Drag and drop events
  tile.addEventListener("dragstart", (e) => {
    draggedPlayer = playerName;
    tile.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", playerName);
  });
  tile.addEventListener("dragend", () => {
    draggedPlayer = null;
    tile.classList.remove("dragging");
    document
      .querySelectorAll(".player-tile.drop-target")
      .forEach((t) => t.classList.remove("drop-target"));
  });
  tile.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (tile.dataset.player !== draggedPlayer) {
      tile.classList.add("drop-target");
    }
  });
  tile.addEventListener("dragleave", () => {
    tile.classList.remove("drop-target");
  });
  tile.addEventListener("drop", (e) => {
    e.preventDefault();
    tile.classList.remove("drop-target");
    const fromPlayer = e.dataTransfer.getData("text/plain");
    const toPlayer = playerName;
    if (fromPlayer && toPlayer && fromPlayer !== toPlayer) {
      reorderPlayers(fromPlayer, toPlayer);
      updateCurrentGamePlayersUI();
    }
  });

  // Header: Player name & Declare Winner
  const header = document.createElement("div");
  header.className = "player-tile-header";

  const nameSpan = document.createElement("span");
  nameSpan.className = "player-name";
  nameSpan.textContent = playerName;

  const winnerBtn = document.createElement("button");
  winnerBtn.className = "declare-winner-btn";
  winnerBtn.title = "Declare Winner";
  winnerBtn.setAttribute("aria-label", "Declare Winner");
  winnerBtn.textContent = "🏆";
  // Attach the event handler ONCE, here:
  winnerBtn.addEventListener("click", () => declareWinner(playerName));

  header.appendChild(nameSpan);
  header.appendChild(winnerBtn);

  // Life section
  const lifeSection = document.createElement("div");
  lifeSection.className = "life-section";

  const btns = [
    { label: "-5", change: -5 },
    { label: "-1", change: -1 },
    { label: "+1", change: 1 },
    { label: "+5", change: 5 },
  ];

  btns.forEach(({ label, change }) => {
    const btn = document.createElement("button");
    btn.className = "life-btn";
    btn.textContent = label;
    btn.dataset.change = change > 0 ? `+${change}` : `${change}`;
    btn.addEventListener("click", () => {
      updatePlayerLife(playerName, change);
    });
    lifeSection.appendChild(btn);
    // Place life total between -1 and +1
    if (label === "-1") {
      const lifeTotal = document.createElement("span");
      lifeTotal.className = "life-total";
      lifeTotal.textContent = life;
      lifeTotal.dataset.player = playerName;
      lifeSection.appendChild(lifeTotal);
    }
  });

  // Actions: Commander, Poison, Mark as Died
  const actions = document.createElement("div");
  actions.className = "tile-actions";

  const commanderBtn = document.createElement("button");
  commanderBtn.className = "commander-damage-btn";
  commanderBtn.title = "Commander Damage";
  commanderBtn.setAttribute("aria-label", "Commander Damage");
  commanderBtn.textContent = "⚔️";
  commanderBtn.addEventListener("click", () =>
    openCommanderDamageModal(playerName)
  );

  const poisonBtn = document.createElement("button");
  poisonBtn.className = "poison-btn";
  poisonBtn.title = "Poison Counters";
  poisonBtn.setAttribute("aria-label", "Poison Counters");
  poisonBtn.innerHTML = `<span class="poison-icon">🐍</span><span class="poison-count">${poison}</span>`;
  poisonBtn.addEventListener("click", () => openPoisonModal(playerName));

  const diedBtn = document.createElement("button");
  diedBtn.className = "mark-died-btn";
  diedBtn.title = "Mark as Died";
  diedBtn.setAttribute("aria-label", "Mark as Died");
  diedBtn.textContent = "☠️";
  diedBtn.addEventListener("click", async () => {
    if (tile.classList.contains("player-died")) return;
    const confirmed = await showConfirm(
      ``,
      `Mark ${playerName} as died?`
    );
    if (confirmed) {
      markPlayerAsDied(playerName);
    }
  });

  actions.appendChild(commanderBtn);
  actions.appendChild(poisonBtn);
  actions.appendChild(diedBtn);

  tile.appendChild(header);
  tile.appendChild(lifeSection);
  tile.appendChild(actions);

  return tile;
}

// --- Life Total Management ---

// Ensure player state exists
function ensurePlayerState(playerName) {
  if (!playerState[playerName]) {
    playerState[playerName] = { life: 40, poison: 0 };
  }
}

// Update player life and UI
function updatePlayerLife(playerName, delta) {
  ensurePlayerState(playerName);
  let life = playerState[playerName].life + delta;

  // Validate life value (clamp to 0 minimum, optional upper limit)
  if (life < 0) life = 0;
  if (life > 999) life = 999; // Optional: set a reasonable upper bound

  playerState[playerName].life = life;

  // Update display
  const tile = document.querySelector(
    `.player-tile[data-player="${playerName}"]`
  );
  if (tile) {
    const lifeTotal = tile.querySelector(".life-total");
    if (lifeTotal) lifeTotal.textContent = life;
  }
  saveCurrentGame();
}

// --- Commander Damage Logic ---

// Structure: commanderDamage[player][opponent] = amount
const commanderDamage = {};

// Ensure commander damage state exists
function ensureCommanderDamage(player, opponent) {
  if (!commanderDamage[player]) commanderDamage[player] = {};
  if (commanderDamage[player][opponent] == null)
    commanderDamage[player][opponent] = 0;
}

// Open Commander Damage Modal for a player
function openCommanderDamageModal(playerName) {
  const modal = document.getElementById("commander-damage-modal");
  const title = document.getElementById("commander-damage-title");
  const list = document.getElementById("commander-damage-list");
  title.textContent = `Commander Damage for ${playerName}`;
  list.innerHTML = "";

  const opponents = getCurrentGamePlayers().filter((p) => p !== playerName);
  opponents.forEach((opponent) => {
    ensureCommanderDamage(playerName, opponent);

    const row = document.createElement("div");
    row.className = "commander-damage-row";

    const name = document.createElement("span");
    name.className = "commander-opponent-name";
    name.textContent = opponent;

    const controls = document.createElement("div");
    controls.className = "commander-damage-controls";

    const minusBtn = document.createElement("button");
    minusBtn.className = "commander-damage-btn";
    minusBtn.textContent = "-";
    minusBtn.addEventListener("click", () => {
      changeCommanderDamage(playerName, opponent, -1);
      updateCommanderDamageModal(playerName);
    });

    const value = document.createElement("span");
    value.className = "commander-damage-value";
    value.textContent = commanderDamage[playerName][opponent];
    if (commanderDamage[playerName][opponent] >= 21) {
      value.classList.add("lethal");
    } else {
      value.classList.remove("lethal");
    }

    const plusBtn = document.createElement("button");
    plusBtn.className = "commander-damage-btn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => {
      changeCommanderDamage(playerName, opponent, 1);
      updateCommanderDamageModal(playerName);
    });

    controls.appendChild(minusBtn);
    controls.appendChild(value);
    controls.appendChild(plusBtn);

    row.appendChild(name);
    row.appendChild(controls);

    list.appendChild(row);
  });

  // Show modal
  modalOverlay.hidden = false;
  modal.hidden = false;
}

// Update modal display after changes
function updateCommanderDamageModal(playerName) {
  openCommanderDamageModal(playerName);
}

// Change commander damage and update tile indicator if lethal
function changeCommanderDamage(player, opponent, delta) {
  ensureCommanderDamage(player, opponent);
  let val = commanderDamage[player][opponent] + delta;
  if (val < 0) val = 0;
  if (val > 99) val = 99;
  commanderDamage[player][opponent] = val;

  // Update main tile visual indicator if lethal
  if (val >= 21) {
    const tile = document.querySelector(
      `.player-tile[data-player="${player}"]`
    );
    if (tile) tile.classList.add("commander-lethal");
  } else {
    const tile = document.querySelector(
      `.player-tile[data-player="${player}"]`
    );
    if (tile) tile.classList.remove("commander-lethal");
  }
  saveCurrentGame();
}

// Close modal
document
  .getElementById("close-commander-damage-btn")
  .addEventListener("click", () => {
    document.getElementById("commander-damage-modal").hidden = true;
    modalOverlay.hidden = true;
  });

// --- Poison Counter Logic ---

let currentPoisonPlayer = null;

// Open Poison Counter Modal for a player
function openPoisonModal(playerName) {
  currentPoisonPlayer = playerName;
  ensurePlayerState(playerName);
  document.getElementById(
    "poison-modal-title"
  ).textContent = `Poison Counters for ${playerName}`;
  document.getElementById("poison-count-display").textContent =
    playerState[playerName].poison || 0;
  modalOverlay.hidden = false;
  document.getElementById("poison-modal").hidden = false;
}

// Update poison display in modal and tile
function updatePoisonDisplay() {
  if (!currentPoisonPlayer) return;
  const count = playerState[currentPoisonPlayer].poison || 0;
  document.getElementById("poison-count-display").textContent = count;

  // Update tile display
  const tile = document.querySelector(
    `.player-tile[data-player="${currentPoisonPlayer}"]`
  );
  if (tile) {
    const poisonCount = tile.querySelector(".poison-count");
    if (poisonCount) poisonCount.textContent = count;
  }
}

// Handle poison counter changes
document.getElementById("poison-plus-btn").addEventListener("click", () => {
  if (!currentPoisonPlayer) return;
  ensurePlayerState(currentPoisonPlayer);
  playerState[currentPoisonPlayer].poison = Math.min(
    (playerState[currentPoisonPlayer].poison || 0) + 1,
    10
  );
  updatePoisonDisplay();
});

document.getElementById("poison-minus-btn").addEventListener("click", () => {
  if (!currentPoisonPlayer) return;
  ensurePlayerState(currentPoisonPlayer);
  playerState[currentPoisonPlayer].poison = Math.max(
    (playerState[currentPoisonPlayer].poison || 0) - 1,
    0
  );
  updatePoisonDisplay();
});

// Close poison modal
document
  .getElementById("close-poison-modal-btn")
  .addEventListener("click", () => {
    document.getElementById("poison-modal").hidden = true;
    modalOverlay.hidden = true;
    currentPoisonPlayer = null;
  });

// --- Player Death Logic ---

// Mark player as died: update visual state, disable interactions, update UI
function markPlayerAsDied(playerName) {
  const tile = document.querySelector(
    `.player-tile[data-player="${playerName}"]`
  );
  if (!tile) return;
  tile.classList.add("player-died");
  // Disable all buttons in the tile
  tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
  playerState[playerName].dead = true; // keep the "dead" status and css

  // --- Auto-declare winner if only one player remains alive and more than 1 player in game ---
  const players = getCurrentGamePlayers();
  const alivePlayers = players.filter((p) => !playerState[p]?.dead);
  if (players.length > 1 && alivePlayers.length === 1) {
    declareWinner(alivePlayers[0]);
  }
  saveCurrentGame();
}

// --- Tile Reordering (Drag and Drop) ---

let draggedPlayer = null;

// Utility to show/hide the +Player button based on game state
function updateAddPlayerBtnVisibility() {
  addPlayerBtn.style.display = gameEnded ? "none" : "";
}

// --- Winner Declaration Logic ---

// async function declareWinner(playerName) {
//   //   if (!confirm(`Declare ${playerName} as the winner? This will end the game.`)) return;
//   if (gameEnded) return; // Prevent multiple calls
//   const confirmed = await showConfirm(
//     `This will end the game.`, `Declare ${playerName} as the winner?`
//   );
//   if (!confirmed) return;

//   gameEnded = true;

//   // 1. Log game data
//   const playersInGame = getCurrentGamePlayers();
//   const finalLifeTotals = {};
//   playersInGame.forEach((p) => {
//     finalLifeTotals[p] = playerState[p] ? playerState[p].life : 0;
//   });
//   logGame(playerName, playersInGame, finalLifeTotals);

//   // 2. Freeze game state: disable all player tiles and controls
//   document.querySelectorAll(".player-tile").forEach((tile) => {
//     tile.classList.add("game-ended");
//     tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
//   });

//   // 3. Update UI: show winner visually
//   const winnerTile = document.querySelector(
//     `.player-tile[data-player="${playerName}"]`
//   );
//   if (winnerTile) winnerTile.classList.add("winner-tile");

//   // 4. SAVE the game ended state to localStorage
//   saveCurrentGame(); // Add this line to save the gameEnded state

//   updateAddPlayerBtnVisibility();
// }

async function declareWinner(playerName) {
  if (gameEnded) return; // Prevent multiple calls
  const confirmed = await showConfirm(
    `This will end the game.`, `Declare ${playerName} as the winner?`
  );
  if (!confirmed) return;

  gameEnded = true;
  winner = playerName; // Store the winner's name

  // 1. Log game data
  const playersInGame = getCurrentGamePlayers();
  const finalLifeTotals = {};
  playersInGame.forEach((p) => {
    finalLifeTotals[p] = playerState[p] ? playerState[p].life : 0;
  });
  logGame(playerName, playersInGame, finalLifeTotals);

  // 2. Freeze game state: disable all player tiles and controls
  document.querySelectorAll(".player-tile").forEach((tile) => {
    tile.classList.add("game-ended");
    tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
  });

  // 3. Update UI: show winner visually
  const winnerTile = document.querySelector(
    `.player-tile[data-player="${playerName}"]`
  );
  if (winnerTile) winnerTile.classList.add("winner-tile");

  // 4. SAVE the game ended state to localStorage
  saveCurrentGame(); // Add this line to save the gameEnded state

  updateAddPlayerBtnVisibility();
}

// Retrieve the full game log array
function getGameLog() {
  return JSON.parse(localStorage.getItem("cmdrtrackr_game_log") || "[]");
}

// Delete a specific game log entry by its id
function deleteGameLogEntry(gameId) {
  let log = JSON.parse(localStorage.getItem("cmdrtrackr_game_log") || "[]");
  log = log.filter((entry) => entry.id !== gameId);
  localStorage.setItem("cmdrtrackr_game_log", JSON.stringify(log));
}

// --- Game Logging Helper ---
function logGame(winnerName, playersInGame, finalLifeTotals) {
  const log = JSON.parse(localStorage.getItem("cmdrtrackr_game_log") || "[]");
  log.push({
    id: Date.now(),
    winner: winnerName,
    players: playersInGame,
    lifeTotals: finalLifeTotals,
    endedAt: new Date().toISOString(),
  });
  localStorage.setItem("cmdrtrackr_game_log", JSON.stringify(log));
}

// Show Game Log Modal
document.getElementById("view-log-link").addEventListener("click", () => {
  renderGameLog();
  modalOverlay.hidden = false;
  document.getElementById("game-log-modal").hidden = false;
});

// Close Game Log Modal
document.getElementById("close-game-log-btn").addEventListener("click", () => {
  document.getElementById("game-log-modal").hidden = true;
  modalOverlay.hidden = true;
});

// Show Game Log Modal
document.getElementById("view-log-link").addEventListener("click", () => {
  renderGameLog();
  modalOverlay.hidden = false;
  document.getElementById("game-log-modal").hidden = false;
});

// Close Game Log Modal
document.getElementById("close-game-log-btn").addEventListener("click", () => {
  document.getElementById("game-log-modal").hidden = true;
  modalOverlay.hidden = true;
});

// --- Game Log Display ---

function renderGameLog() {
  const logList = document.getElementById("game-log-list");
  const log = getGameLog();
  logList.innerHTML = "";
  if (log.length === 0) {
    logList.innerHTML =
      '<div class="empty-game-log">No games played yet.</div>';
    return;
  }
  log
    .slice()
    .reverse()
    .forEach((entry) => {
      const div = document.createElement("div");
      div.className = "game-log-entry";

      // Header: Winner and Date
      const header = document.createElement("div");
      header.className = "game-log-header";
      header.innerHTML = `<span class="game-log-winner">🏆 ${entry.winner
        }</span>
      <span class="game-log-date">${new Date(
          entry.endedAt
        ).toLocaleString()}</span>`;

      // Details: Players and Life Totals
      const details = document.createElement("div");
      details.className = "game-log-details";
      details.textContent = `Players: ${entry.players.join(", ")}`;

      // Life totals
      const lifeTotals = document.createElement("div");
      lifeTotals.className = "game-log-details";
      lifeTotals.textContent =
        "Final Life: " +
        entry.players.map((p) => `${p}: ${entry.lifeTotals[p]}`).join(", ");

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.className = "delete-game-log-btn";
      delBtn.title = "Delete Game Log Entry";
      delBtn.innerHTML = "✖";
      delBtn.addEventListener("click", () => {
        if (confirm("Delete this game log entry?")) {
          deleteGameLogEntry(entry.id);
          renderGameLog();
        }
      });

      div.appendChild(header);
      div.appendChild(details);
      div.appendChild(lifeTotals);
      div.appendChild(delBtn);

      logList.appendChild(div);
    });
}

// Show Game Log Modal
document.getElementById("view-log-link").addEventListener("click", () => {
  renderGameLog();
  modalOverlay.hidden = false;
  document.getElementById("game-log-modal").hidden = false;
});

// Close Game Log Modal
document.getElementById("close-game-log-btn").addEventListener("click", () => {
  document.getElementById("game-log-modal").hidden = true;
  modalOverlay.hidden = true;
});

// Show Settings Modal
settingsLink.addEventListener("click", () => {
  renderSettingsPlayersList();
  modalOverlay.hidden = false;
  document.getElementById("settings-modal").hidden = false;
});

// Close Settings Modal
document.getElementById("close-settings-btn").addEventListener("click", () => {
  document.getElementById("settings-modal").hidden = true;
  modalOverlay.hidden = true;
});

// Load saved players for settings view
function renderSettingsPlayersList() {
  const list = document.getElementById("settings-players-list");
  const players = getSavedPlayers();
  const defaultPlayer = getDefaultPlayer();
  list.innerHTML = "";
  if (players.length === 0) {
    list.innerHTML = '<div class="empty-player-list">No saved players.</div>';
    return;
  }

  // Separate default and others, sort others alphabetically
  const otherPlayers = players
    .filter((p) => p !== defaultPlayer)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const orderedPlayers = defaultPlayer
    ? [defaultPlayer, ...otherPlayers]
    : otherPlayers;

  orderedPlayers.forEach((player) => {
    const row = document.createElement("div");
    row.className = "settings-player-row";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "default-player";
    radio.className = "settings-default-radio";
    radio.checked = player === defaultPlayer;
    radio.addEventListener("change", () => {
      setDefaultPlayer(player); // Update Local Storage
      renderSettingsPlayersList(); // Update UI
    });

    const name = document.createElement("span");
    name.className = "settings-player-name";
    name.textContent = player;

    const label = document.createElement("span");
    label.className = "settings-default-label";
    label.textContent = player === defaultPlayer ? "Default" : "";

    const delBtn = document.createElement("button");
    delBtn.className = "delete-player-btn";
    delBtn.title = "Delete player";
    delBtn.innerHTML = "🗑️";
    delBtn.addEventListener("click", async () => {
      document.getElementById("settings-modal").hidden = true;
      const confirmed = await showConfirm(
        `Delete saved player "${player}"? This cannot be undone.`,
        "Delete Player"
      );
      if (confirmed) {
        deletePlayer(player);
      }
      renderSettingsPlayersList();
      modalOverlay.hidden = false;
      document.getElementById("settings-modal").hidden = false;
    });

    row.appendChild(radio);
    row.appendChild(name);
    row.appendChild(label);
    row.appendChild(delBtn);

    list.appendChild(row);
  });
}

function deletePlayer(playerName) {
  let players = getSavedPlayers();
  players = players.filter((p) => p !== playerName);
  localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(players)); // Use correct key
  // Remove from current game as well
  currentGamePlayers = currentGamePlayers.filter((p) => p !== playerName);
  delete playerState[playerName];
  // If removed player was default, clear default
  if (getDefaultPlayer() === playerName) {
    localStorage.removeItem(DEFAULT_PLAYER_KEY);
  }
  updateCurrentGamePlayersUI(); // Refresh tiles if needed
  saveCurrentGame();
}

// Utility functions for default player
function setDefaultPlayer(playerName) {
  localStorage.setItem("cmdrtrackr_default_player", playerName);
}
function getDefaultPlayer() {
  return localStorage.getItem("cmdrtrackr_default_player") || "";
}
function isPlayerDefault(playerName) {
  return getDefaultPlayer() === playerName;
}

// --- Generic Modal System ---

function showModal(modalId) {
  // Hide all modals first
  document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
  // Show overlay and the requested modal
  modalOverlay.hidden = false;
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.hidden = false;
    // Animation
    modal.classList.add("modal-animate-in");
    setTimeout(() => modal.classList.remove("modal-animate-in"), 200);
    // Focus management: focus first focusable element
    const focusable = modal.querySelector(
      'button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]'
    );
    if (focusable) focusable.focus();
    // Accessibility: set aria-modal and role
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
  }
}

function hideModal() {
  // Hide all modals and overlay
  document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
  modalOverlay.hidden = true;
}

// Optional: ESC key closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) {
    hideModal();
  }
});

function showConfirm(message, title = "Confirm") {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-modal-title").textContent = title;
    document.getElementById("confirm-modal-message").textContent = message;
    modalOverlay.hidden = false;
    modal.hidden = false;

    function cleanup(result) {
      modal.hidden = true;
      modalOverlay.hidden = true;
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }
    const okBtn = document.getElementById("confirm-modal-ok");
    const cancelBtn = document.getElementById("confirm-modal-cancel");
    function onOk() {
      cleanup(true);
    }
    function onCancel() {
      cleanup(false);
    }
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);

    // ESC closes as cancel
    function onKey(e) {
      if (e.key === "Escape") {
        cleanup(false);
        document.removeEventListener("keydown", onKey);
      }
    }
    document.addEventListener("keydown", onKey);
  });
}

// --- Event Handlers ---
// Fix the +Player button click handler
addPlayerBtn.addEventListener("click", () => {
  const savedPlayers = getSavedPlayers();

  // Check if there are no saved players first
  if (savedPlayers.length === 0) {
    // Show New Player modal directly
    modalOverlay.hidden = false;
    addPlayerModal.hidden = true;
    newPlayerModal.hidden = false;

    try {
      newPlayerInput.focus();
    } catch (e) {
      console.log("Could not focus new player input:", e);
    }
    return;
  }

  // Otherwise, render the saved player list as normal
  renderSavedPlayersList();
  modalOverlay.hidden = false;
  addPlayerModal.hidden = false;
  newPlayerModal.hidden = true;
});

// Handle Done button: add all selected players
document.getElementById("add-player-done-btn").addEventListener("click", () => {
  if (selectedPlayers.size === 0) {
    showConfirm("Select at least one player.", "Notice");
    return;
  }
  selectedPlayers.forEach((player) => addPlayerToGame(player));
  updateCurrentGamePlayersUI();
  addPlayerModal.hidden = true;
  modalOverlay.hidden = true;
});

// Helper: reorder players in currentGamePlayers array
function reorderPlayers(fromPlayer, toPlayer) {
  const fromIdx = currentGamePlayers.indexOf(fromPlayer);
  const toIdx = currentGamePlayers.indexOf(toPlayer);
  if (fromIdx === -1 || toIdx === -1) return;
  currentGamePlayers.splice(fromIdx, 1);
  currentGamePlayers.splice(toIdx, 0, fromPlayer);
  saveCurrentGame();
}

// modalOverlay.addEventListener("mousedown", (e) => {
//   console.log("modalOverlay click", { target: e.target, modalContent });
//   if (!modalContent.contains(e.target)) {
//     hideModal();
//   }
// });

modalOverlay.addEventListener("mousedown", (e) => {
  if (e.target === modalOverlay) {
    hideModal();
  }
});


document
  .getElementById("settings-add-player-btn")
  .addEventListener("click", () => {
    newPlayerModalSource = "settings";
    document.getElementById("settings-modal").hidden = true;
    document.getElementById("new-player-modal").hidden = false;
    document.getElementById("modal-overlay").hidden = false;
    document.getElementById("new-player-input").value = "";
    document.getElementById("new-player-input").focus();
  });


//   // Restore current game if it exists
// window.addEventListener("DOMContentLoaded", () => {
//   document.getElementById("modal-overlay").hidden = true;
//   document.getElementById("add-player-modal").hidden = true;
//   document.getElementById("new-player-modal").hidden = true;
//   document.getElementById("commander-damage-modal").hidden = true;
//   document.getElementById("poison-modal").hidden = true;

//   // Restore current game if it exists
//   const savedGame = localStorage.getItem("cmdrtrackr_current_game");
//   if (savedGame) {
//     try {
//       const { players, state, gameEnded: savedGameEnded, winner } = JSON.parse(savedGame);
//       currentGamePlayers = players || [];
//       playerState = state || {};
//       gameEnded = savedGameEnded || false; // Set gameEnded from saved state
//       updateCurrentGamePlayersUI();

//       // If game was ended, re-apply visual state
//       if (gameEnded) {
//         document.querySelectorAll(".player-tile").forEach((tile) => {
//           tile.classList.add("game-ended");
//           tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));

//           // If this player was the winner, highlight them
//           if (winner && tile.dataset.player === winner) {
//             tile.classList.add("winner-tile");
//           }
//         });
//       }
//       updateAddPlayerBtnVisibility(); // Always update button visibility
//       return;
//     } catch (e) {
//       // If corrupted, ignore and continue
//     }
//   }

//   // If no current game, add default player if set
//   const defaultPlayer = getDefaultPlayer();
//   if (defaultPlayer && getSavedPlayers().includes(defaultPlayer)) {
//     addPlayerToGame(defaultPlayer);
//     updateCurrentGamePlayersUI();
//   }
//   updateAddPlayerBtnVisibility(); // Always update button visibility
// });

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-overlay").hidden = true;
  document.getElementById("add-player-modal").hidden = true;
  document.getElementById("new-player-modal").hidden = true;
  document.getElementById("commander-damage-modal").hidden = true;
  document.getElementById("poison-modal").hidden = true;

  // Restore current game if it exists
  const savedGame = localStorage.getItem("cmdrtrackr_current_game");
  if (savedGame) {
    try {
      const { players, state, gameEnded: savedGameEnded, winner } = JSON.parse(savedGame);
      currentGamePlayers = players || [];
      playerState = state || {};
      gameEnded = savedGameEnded || false; // Set gameEnded from saved state
      updateCurrentGamePlayersUI();

      // If game was ended, re-apply visual state
      if (gameEnded) {
        document.querySelectorAll(".player-tile").forEach((tile) => {
          tile.classList.add("game-ended");
          tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));

          // If this player was the winner, highlight them
          if (winner && tile.dataset.player === winner) {
            tile.classList.add("winner-tile");
          }
        });
      }
      updateAddPlayerBtnVisibility(); // Always update button visibility
      return;
    } catch (e) {
      // If corrupted, ignore and continue
    }
  }

  // If no current game, add default player if set
  const defaultPlayer = getDefaultPlayer();
  if (defaultPlayer && getSavedPlayers().includes(defaultPlayer)) {
    addPlayerToGame(defaultPlayer);
    updateCurrentGamePlayersUI();
  }
  updateAddPlayerBtnVisibility(); // Always update button visibility
});