
import { loadState, getDefaultPlayer, addPlayerToGame } from './state.js';
import { updateCurrentGamePlayersUI, updateAddPlayerBtnVisibility } from './ui.js';
import { initEventListeners } from './events.js';

document.addEventListener("DOMContentLoaded", () => {
    loadState();
    updateCurrentGamePlayersUI();
    updateAddPlayerBtnVisibility();
    initEventListeners();

    if (state.players.length === 0) {
        const defaultPlayer = getDefaultPlayer();
        if (defaultPlayer) {
            addPlayerToGame(defaultPlayer);
            updateCurrentGamePlayersUI();
        }
    }
});
