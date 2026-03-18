import { GAME_LIMITS } from "./constants.js";
import {
    addPlayerToGame,
    getDefaultPlayer,
    logGame,
    saveState,
    state,
} from "./state.js";

function clampValue(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function adjustPlayerLife(playerName, delta, options = {}) {
    const playerState = state.playerState[playerName];
    if (!playerState) return null;

    const nextLife = clampValue(
        playerState.life + delta,
        0,
        GAME_LIMITS.maxLife
    );
    playerState.life = nextLife;

    if (options.save !== false) {
        saveState();
    }

    return nextLife;
}

function adjustCommanderDamage(playerName, opponent, delta) {
    if (!state.commanderDamage[playerName]) {
        state.commanderDamage[playerName] = {};
    }
    if (state.commanderDamage[playerName][opponent] == null) {
        state.commanderDamage[playerName][opponent] = 0;
    }

    const previousValue = state.commanderDamage[playerName][opponent];
    const nextValue = clampValue(
        previousValue + delta,
        0,
        GAME_LIMITS.maxCommanderDamage
    );

    state.commanderDamage[playerName][opponent] = nextValue;

    const appliedDelta = nextValue - previousValue;
    if (appliedDelta !== 0) {
        adjustPlayerLife(playerName, -appliedDelta, { save: false });
    }

    saveState();

    return {
        previousValue,
        value: nextValue,
        appliedDelta,
        isLethal: nextValue >= GAME_LIMITS.commanderLethal,
    };
}

function adjustPoison(playerName, delta) {
    const playerState = state.playerState[playerName];
    if (!playerState) return null;

    const currentCount = playerState.poison || 0;
    const nextCount = clampValue(
        currentCount + delta,
        0,
        GAME_LIMITS.maxPoison
    );

    if (nextCount === currentCount) {
        return currentCount;
    }

    playerState.poison = nextCount;
    saveState();
    return nextCount;
}

function declareWinner(playerName) {
    if (state.gameEnded) return false;

    state.gameEnded = true;
    state.winner = playerName;

    const finalLife = {};
    state.players.forEach((player) => {
        finalLife[player] = state.playerState[player]?.life || 0;
    });

    logGame(playerName, state.players, finalLife);
    saveState();
    return true;
}

function markPlayerAsDead(playerName) {
    const playerState = state.playerState[playerName];
    if (!playerState) return [];

    playerState.dead = true;
    saveState();

    return state.players.filter((player) => !state.playerState[player]?.dead);
}

function resetCurrentGame() {
    state.players = [];
    state.playerState = {};
    state.gameEnded = false;
    state.winner = null;
    state.commanderDamage = {};

    const defaultPlayer = getDefaultPlayer();
    if (defaultPlayer) {
        addPlayerToGame(defaultPlayer);
    } else {
        saveState();
    }

    return defaultPlayer;
}

export {
    adjustCommanderDamage,
    adjustPlayerLife,
    adjustPoison,
    declareWinner,
    markPlayerAsDead,
    resetCurrentGame,
};
