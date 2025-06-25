
import { state } from './state.js';
import { initUI, createPlayerTile, updateCurrentGamePlayersUI, showModal, hideModal, showInputError, clearInputError, updateAddPlayerBtnVisibility } from './ui.js';

describe('UI Management', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="player-tiles"></div>
            <div id="saved-players-list"></div>
            <div id="settings-players-list"></div>
            <div id="game-log-list"></div>
            <div id="modal-overlay" hidden></div>
            <div id="add-player-modal" class="modal" hidden></div>
            <div id="new-player-modal" class="modal" hidden><input id="new-player-input" /></div>' +
            <div id="confirm-modal" class="modal" hidden>
                <div id="confirm-modal-title"></div>
                <div id="confirm-modal-message"></div>
                <button id="confirm-modal-ok"></button>
                <button id="confirm-modal-cancel"></button>
            </div>
            <button id="add-player-btn"></button>
        `;

        state.players = [];
        state.playerState = {};
        state.gameEnded = false;
        initUI();
    });

    test('should create a player tile', () => {
        state.playerState['Player 1'] = { life: 40, poison: 0, dead: false };
        const tile = createPlayerTile('Player 1');
        expect(tile).not.toBeNull();
        expect(tile.dataset.player).toBe('Player 1');
        expect(tile.querySelector('.life-total').textContent).toBe('40');
    });

    test('should update the current game players UI', () => {
        state.players = ['Player 1'];
        state.playerState = { 'Player 1': { life: 40, poison: 0, dead: false } };
        updateCurrentGamePlayersUI();
        const tiles = document.getElementById('player-tiles');
        expect(tiles.children.length).toBe(1);
        expect(tiles.children[0].dataset.player).toBe('Player 1');
    });

    test('should show and hide a modal', () => {
        showModal('add-player-modal');
        const modal = document.getElementById('add-player-modal');
        const overlay = document.getElementById('modal-overlay');
        expect(modal.hidden).toBe(false);
        expect(overlay.hidden).toBe(false);
        hideModal();
        expect(modal.hidden).toBe(true);
        expect(overlay.hidden).toBe(true);
    });

    test('should show an input error', () => {
        showInputError('Test error');
        const error = document.getElementById('new-player-error');
        expect(error).not.toBeNull();
        expect(error.textContent).toBe('Test error');
    });

    test('should clear an input error', () => {
        showInputError('Test error');
        clearInputError();
        const error = document.getElementById('new-player-error');
        expect(error).toBeNull();
    });

    test('should update the add player button visibility', () => {
        state.gameEnded = true;
        updateAddPlayerBtnVisibility();
        const btn = document.getElementById('add-player-btn');
        expect(btn.style.display).toBe('none');
    });
});
