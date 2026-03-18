import { loadState, getDefaultPlayer, addPlayerToGame, state } from './state.js';
import { initUI, updateCurrentGamePlayersUI, updateAddPlayerBtnVisibility, updateUndoButtonState } from './ui.js';
import { initEventListeners } from './events.js';

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    loadState();
    updateCurrentGamePlayersUI();
    updateAddPlayerBtnVisibility();
    updateUndoButtonState();
    initEventListeners();

    if (state.players.length === 0) {
        const defaultPlayer = getDefaultPlayer();
        if (defaultPlayer) {
            addPlayerToGame(defaultPlayer);
            updateCurrentGamePlayersUI();
        }
    }
    updateUndoButtonState();
});
