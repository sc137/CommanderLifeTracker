
// --- State Management ---

let state = {
  players: [],
  playerState: {},
  gameEnded: false,
  winner: null,
  selectedPlayers: new Set(),
  draggedPlayer: null,
  currentPoisonPlayer: null,
  commanderDamage: {},
};

const PLAYER_LIST_KEY = "cmdrtrackr_players";
const DEFAULT_PLAYER_KEY = "cmdrtrackr_default_player";
const CURRENT_GAME_KEY = "cmdrtrackr_current_game";
const GAME_LOG_KEY = "cmdrtrackr_game_log";

function saveState() {
  localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify({
    players: state.players,
    state: state.playerState,
    gameEnded: state.gameEnded,
    winner: state.winner,
  }));
}

function loadState() {
  const savedGame = localStorage.getItem(CURRENT_GAME_KEY);
  if (savedGame) {
    try {
      const { players, state: savedPlayerState, gameEnded, winner } = JSON.parse(savedGame);
      state.players = players || [];
      state.playerState = savedPlayerState || {};
      state.gameEnded = gameEnded || false;
      state.winner = winner || null;
    } catch (e) {
      console.error("Error loading saved game:", e);
      // If corrupted, start with a clean state
      state.players = [];
      state.playerState = {};
      state.gameEnded = false;
      state.winner = null;
    }
  }
}

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

function removePlayer(playerName) {
  let players = getSavedPlayers();
  players = players.filter((name) => name !== playerName);
  localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(players));
  if (getDefaultPlayer() === playerName) {
    localStorage.removeItem(DEFAULT_PLAYER_KEY);
  }
}

function setDefaultPlayer(playerName) {
  localStorage.setItem(DEFAULT_PLAYER_KEY, playerName);
}

function getDefaultPlayer() {
  return localStorage.getItem(DEFAULT_PLAYER_KEY) || "";
}

function addPlayerToGame(playerName) {
  if (!playerName || state.players.includes(playerName)) return false;
  state.players.push(playerName);
  ensurePlayerState(playerName);
  saveState();
  return true;
}

function removePlayerFromGame(playerName) {
  const idx = state.players.indexOf(playerName);
  if (idx !== -1) {
    state.players.splice(idx, 1);
    delete state.playerState[playerName];
    delete state.commanderDamage[playerName];
    for (const p of Object.keys(state.commanderDamage)) {
      if (state.commanderDamage[p]) {
        delete state.commanderDamage[p][playerName];
      }
    }
    saveState();
    return true;
  }
  return false;
}

function ensurePlayerState(playerName) {
  if (!state.playerState[playerName]) {
    state.playerState[playerName] = { life: 40, poison: 0, dead: false };
  }
}

function reorderPlayers(fromPlayer, toPlayer) {
  const fromIdx = state.players.indexOf(fromPlayer);
  const toIdx = state.players.indexOf(toPlayer);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
  state.players.splice(fromIdx, 1);
  const insertIdx = fromIdx < toIdx ? toIdx : toIdx + 1;
  state.players.splice(insertIdx, 0, fromPlayer);
  saveState();
}

function logGame(winnerName, playersInGame, finalLifeTotals) {
    const log = JSON.parse(localStorage.getItem(GAME_LOG_KEY) || "[]");
    log.push({
        id: Date.now(),
        winner: winnerName,
        players: playersInGame,
        lifeTotals: finalLifeTotals,
        endedAt: new Date().toISOString(),
    });
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(log));
}

function getGameLog() {
    return JSON.parse(localStorage.getItem(GAME_LOG_KEY) || "[]");
}

function deleteGameLogEntry(gameId) {
    let log = getGameLog();
    log = log.filter((entry) => entry.id !== gameId);
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(log));
}


export {
  state,
  saveState,
  loadState,
  getSavedPlayers,
  savePlayer,
  removePlayer,
  setDefaultPlayer,
  getDefaultPlayer,
  addPlayerToGame,
  removePlayerFromGame,
  ensurePlayerState,
  reorderPlayers,
  logGame,
  getGameLog,
  deleteGameLogEntry,
};
