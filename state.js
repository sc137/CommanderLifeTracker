import {
    GAME_LIMITS,
    MAX_UNDO_STACK,
    STARTING_LIFE_PRESETS,
    STORAGE_KEYS,
    STORAGE_VERSION,
} from "./constants.js";

let state = {
    players: [],
    playerState: {},
    gameEnded: false,
    winner: null,
    selectedPlayers: new Set(),
    draggedPlayer: null,
    currentPoisonPlayer: null,
    commanderDamage: {},
    undoStack: [],
};

const {
    playerList: PLAYER_LIST_KEY,
    defaultPlayer: DEFAULT_PLAYER_KEY,
    startingLife: STARTING_LIFE_KEY,
    currentGame: CURRENT_GAME_KEY,
    currentGameBackup: CURRENT_GAME_BACKUP_KEY,
    gameLog: GAME_LOG_KEY,
} = STORAGE_KEYS;

function getDefaultPlayerState() {
    return {
        life: getStartingLife(),
        poison: 0,
        dead: false,
    };
}

function getEmptyGameState() {
    return {
        players: [],
        playerState: {},
        gameEnded: false,
        winner: null,
        commanderDamage: {},
    };
}

function cloneJson(data) {
    return JSON.parse(JSON.stringify(data));
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePlayers(players) {
    if (!Array.isArray(players)) return [];
    const seen = new Set();
    return players
        .filter((player) => typeof player === "string")
        .map((player) => player.trim())
        .filter((player) => {
            if (!player || seen.has(player)) return false;
            seen.add(player);
            return true;
        });
}

function normalizePlayerStateMap(playerState, players) {
    const nextState = {};
    const source = playerState && typeof playerState === "object" ? playerState : {};
    const defaultStartingLife = getStartingLife();

    players.forEach((player) => {
        const raw = source[player] && typeof source[player] === "object"
            ? source[player]
            : {};
        const life = Number.isFinite(raw.life)
            ? Math.max(0, Math.min(GAME_LIMITS.maxLife, raw.life))
            : defaultStartingLife;
        const poison = Number.isFinite(raw.poison)
            ? Math.max(0, Math.min(GAME_LIMITS.maxPoison, raw.poison))
            : 0;
        nextState[player] = {
            life,
            poison,
            dead: Boolean(raw.dead),
        };
    });

    return nextState;
}

function normalizeCommanderDamage(commanderDamage, players) {
    const source = commanderDamage && typeof commanderDamage === "object"
        ? commanderDamage
        : {};
    const nextDamage = {};

    players.forEach((player) => {
        const rawPlayerDamage = source[player] && typeof source[player] === "object"
            ? source[player]
            : {};
        const normalized = {};

        players
            .filter((opponent) => opponent !== player)
            .forEach((opponent) => {
                const value = rawPlayerDamage[opponent];
                if (!Number.isFinite(value)) return;
                normalized[opponent] = Math.max(
                    0,
                    Math.min(GAME_LIMITS.maxCommanderDamage, value)
                );
            });

        if (Object.keys(normalized).length > 0) {
            nextDamage[player] = normalized;
        }
    });

    return nextDamage;
}

function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidGameLogEntry(entry) {
    return isPlainObject(entry) &&
        Number.isFinite(entry.id) &&
        typeof entry.winner === "string" &&
        isStringArray(entry.players) &&
        isPlainObject(entry.lifeTotals) &&
        typeof entry.endedAt === "string";
}

function validateImportPayload(payload) {
    if (!isPlainObject(payload)) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(payload, "version") &&
        !Number.isInteger(payload.version)
    ) {
        return false;
    }

    if (!Array.isArray(payload.savedPlayers) || !payload.savedPlayers.every((player) => typeof player === "string")) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(payload, "defaultPlayer") &&
        payload.defaultPlayer !== "" &&
        typeof payload.defaultPlayer !== "string"
    ) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(payload, "startingLife") &&
        !STARTING_LIFE_PRESETS.includes(payload.startingLife)
    ) {
        return false;
    }

    if (!isPlainObject(payload.currentGame)) {
        return false;
    }

    if (!Array.isArray(payload.gameLog) || !payload.gameLog.every(isValidGameLogEntry)) {
        return false;
    }

    const currentGame = payload.currentGame;
    if (!Array.isArray(currentGame.players) || !currentGame.players.every((player) => typeof player === "string")) {
        return false;
    }

    if (!isPlainObject(currentGame.playerState) && !isPlainObject(currentGame.state)) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(currentGame, "gameEnded") &&
        typeof currentGame.gameEnded !== "boolean"
    ) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(currentGame, "winner") &&
        currentGame.winner !== null &&
        typeof currentGame.winner !== "string"
    ) {
        return false;
    }

    if (
        Object.prototype.hasOwnProperty.call(currentGame, "commanderDamage") &&
        !isPlainObject(currentGame.commanderDamage)
    ) {
        return false;
    }

    const savedPlayers = normalizePlayers(payload.savedPlayers);
    if (savedPlayers.length !== payload.savedPlayers.length) {
        return false;
    }
    const currentPlayers = normalizePlayers(currentGame.players);
    if (currentPlayers.length !== currentGame.players.length) {
        return false;
    }
    const missingCurrentPlayers = currentPlayers.some((player) => !savedPlayers.includes(player));
    if (missingCurrentPlayers) {
        return false;
    }

    const defaultPlayer = payload.defaultPlayer;
    if (defaultPlayer && !savedPlayers.includes(defaultPlayer)) {
        return false;
    }

    return true;
}

function normalizeGameState(payload) {
    if (!payload || typeof payload !== "object") {
        return getEmptyGameState();
    }

    const source = payload.currentGame && typeof payload.currentGame === "object"
        ? payload.currentGame
        : payload;
    const players = normalizePlayers(source.players);
    const playerState = normalizePlayerStateMap(
        source.playerState || source.state,
        players
    );
    const commanderDamage = normalizeCommanderDamage(source.commanderDamage, players);

    return {
        players,
        playerState,
        gameEnded: Boolean(source.gameEnded),
        winner: players.includes(source.winner) ? source.winner : null,
        commanderDamage,
    };
}

function serializeGameState() {
    return {
        version: STORAGE_VERSION,
        players: [...state.players],
        playerState: cloneJson(state.playerState),
        gameEnded: state.gameEnded,
        winner: state.winner,
        commanderDamage: cloneJson(state.commanderDamage),
    };
}

function applyGameState(payload, options = {}) {
    const nextState = normalizeGameState(payload);
    state.players = nextState.players;
    state.playerState = nextState.playerState;
    state.gameEnded = nextState.gameEnded;
    state.winner = nextState.winner;
    state.commanderDamage = nextState.commanderDamage;
    state.currentPoisonPlayer = null;
    state.draggedPlayer = null;
    state.selectedPlayers.clear();

    if (options.clearUndo) {
        clearUndoStack();
    }
    if (options.save) {
        saveState();
    }

    return nextState;
}

function saveState() {
    const previousState = localStorage.getItem(CURRENT_GAME_KEY);
    if (previousState) {
        localStorage.setItem(CURRENT_GAME_BACKUP_KEY, previousState);
    }
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(serializeGameState()));
}

function loadState() {
    const savedGame = localStorage.getItem(CURRENT_GAME_KEY);
    if (!savedGame) {
        applyGameState(null, { clearUndo: true });
        return;
    }

    try {
        applyGameState(JSON.parse(savedGame), { clearUndo: true });
    } catch (e) {
        console.error("Error loading saved game:", e);
        applyGameState(null, { clearUndo: true });
    }
}

function restoreBackupState() {
    const backup = localStorage.getItem(CURRENT_GAME_BACKUP_KEY);
    if (!backup) return false;

    try {
        applyGameState(JSON.parse(backup), { save: true, clearUndo: true });
        return true;
    } catch (e) {
        console.error("Error restoring backup game:", e);
        return false;
    }
}

function getSavedPlayers() {
    const data = localStorage.getItem(PLAYER_LIST_KEY);
    if (!data) return [];
    try {
        const arr = JSON.parse(data);
        return Array.isArray(arr) ? normalizePlayers(arr) : [];
    } catch {
        return [];
    }
}

function savePlayer(playerName) {
    if (!playerName || typeof playerName !== "string") return false;
    const name = playerName.trim();
    if (!name) return false;
    const players = getSavedPlayers();
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

function getStartingLife() {
    const storedValue = Number.parseInt(localStorage.getItem(STARTING_LIFE_KEY), 10);
    return STARTING_LIFE_PRESETS.includes(storedValue)
        ? storedValue
        : GAME_LIMITS.startingLife;
}

function setStartingLife(value) {
    if (!STARTING_LIFE_PRESETS.includes(value)) {
        return false;
    }
    localStorage.setItem(STARTING_LIFE_KEY, String(value));
    return true;
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
        for (const player of Object.keys(state.commanderDamage)) {
            if (state.commanderDamage[player]) {
                delete state.commanderDamage[player][playerName];
            }
        }
        saveState();
        return true;
    }
    return false;
}

function ensurePlayerState(playerName) {
    if (!state.playerState[playerName]) {
        state.playerState[playerName] = getDefaultPlayerState();
    }
}

function reorderPlayers(fromPlayer, toPlayer) {
    const fromIdx = state.players.indexOf(fromPlayer);
    const toIdx = state.players.indexOf(toPlayer);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const temp = state.players[fromIdx];
    state.players[fromIdx] = state.players[toIdx];
    state.players[toIdx] = temp;
    saveState();
}

function getGameLog() {
    const raw = localStorage.getItem(GAME_LOG_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function logGame(winnerName, playersInGame, finalLifeTotals) {
    const lifeTotalsSnapshot = {};
    playersInGame.forEach((player) => {
        const val = finalLifeTotals[player];
        lifeTotalsSnapshot[player] =
            val && typeof val === "object" ? val.life : val;
    });

    const log = getGameLog();
    log.push({
        id: Date.now(),
        winner: winnerName,
        players: playersInGame,
        lifeTotals: lifeTotalsSnapshot,
        endedAt: new Date().toISOString(),
    });
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(log));
}

function deleteGameLogEntry(gameId) {
    let log = getGameLog();
    log = log.filter((entry) => entry.id !== gameId);
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(log));
}

function serializeAppData() {
    return {
        version: STORAGE_VERSION,
        exportedAt: new Date().toISOString(),
        savedPlayers: getSavedPlayers(),
        defaultPlayer: getDefaultPlayer(),
        startingLife: getStartingLife(),
        currentGame: serializeGameState(),
        gameLog: getGameLog(),
    };
}

function importAppData(payload) {
    if (!validateImportPayload(payload)) {
        return false;
    }

    const savedPlayers = normalizePlayers(payload.savedPlayers);
    const defaultPlayer = savedPlayers.includes(payload.defaultPlayer)
        ? payload.defaultPlayer
        : "";
    const startingLife = STARTING_LIFE_PRESETS.includes(payload.startingLife)
        ? payload.startingLife
        : GAME_LIMITS.startingLife;
    const gameLog = Array.isArray(payload.gameLog) ? payload.gameLog : [];

    localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(savedPlayers));
    if (defaultPlayer) {
        localStorage.setItem(DEFAULT_PLAYER_KEY, defaultPlayer);
    } else {
        localStorage.removeItem(DEFAULT_PLAYER_KEY);
    }
    localStorage.setItem(STARTING_LIFE_KEY, String(startingLife));
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(gameLog));
    applyGameState(payload.currentGame, { save: true, clearUndo: true });
    return true;
}

function pushUndoState() {
    state.undoStack.push(serializeGameState());
    if (state.undoStack.length > MAX_UNDO_STACK) {
        state.undoStack.shift();
    }
}

function undoLastAction() {
    const previousState = state.undoStack.pop();
    if (!previousState) return false;
    applyGameState(previousState, { save: true });
    return true;
}

function clearUndoStack() {
    state.undoStack = [];
}

export {
    state,
    applyGameState,
    clearUndoStack,
    deleteGameLogEntry,
    ensurePlayerState,
    getDefaultPlayer,
    getGameLog,
    getSavedPlayers,
    getStartingLife,
    importAppData,
    loadState,
    logGame,
    pushUndoState,
    removePlayer,
    removePlayerFromGame,
    reorderPlayers,
    restoreBackupState,
    savePlayer,
    saveState,
    serializeAppData,
    serializeGameState,
    setDefaultPlayer,
    setStartingLife,
    addPlayerToGame,
    undoLastAction,
};
