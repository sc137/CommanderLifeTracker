
import { state, saveState, loadState, getSavedPlayers, savePlayer, removePlayer, setDefaultPlayer, getDefaultPlayer, addPlayerToGame, removePlayerFromGame, ensurePlayerState, reorderPlayers, logGame, getGameLog, deleteGameLogEntry } from './state.js';

describe('State Management', () => {
    beforeEach(() => {
        localStorage.clear();
        state.players = [];
        state.playerState = {};
        state.gameEnded = false;
        state.winner = null;
    });

    test('should save and load state', () => {
        state.players = ['Player 1'];
        state.playerState = { 'Player 1': { life: 40, poison: 0, dead: false } };
        saveState();
        state.players = [];
        state.playerState = {};
        loadState();
        expect(state.players).toEqual(['Player 1']);
        expect(state.playerState).toEqual({ 'Player 1': { life: 40, poison: 0, dead: false } });
    });

    test('should save and get players', () => {
        savePlayer('Player 1');
        savePlayer('Player 2');
        const players = getSavedPlayers();
        expect(players).toEqual(['Player 1', 'Player 2']);
    });

    test('should remove a player', () => {
        savePlayer('Player 1');
        savePlayer('Player 2');
        removePlayer('Player 1');
        const players = getSavedPlayers();
        expect(players).toEqual(['Player 2']);
    });

    test('should set and get the default player', () => {
        setDefaultPlayer('Player 1');
        const defaultPlayer = getDefaultPlayer();
        expect(defaultPlayer).toBe('Player 1');
    });

    test('should add a player to the game', () => {
        addPlayerToGame('Player 1');
        expect(state.players).toEqual(['Player 1']);
    });

    test('should remove a player from the game', () => {
        addPlayerToGame('Player 1');
        addPlayerToGame('Player 2');
        removePlayerFromGame('Player 1');
        expect(state.players).toEqual(['Player 2']);
    });

    test('should ensure player state', () => {
        ensurePlayerState('Player 1');
        expect(state.playerState['Player 1']).toEqual({ life: 40, poison: 0, dead: false });
    });

    test('should reorder players', () => {
        addPlayerToGame('Player 1');
        addPlayerToGame('Player 2');
        reorderPlayers('Player 1', 'Player 2');
        expect(state.players).toEqual(['Player 2', 'Player 1']);
    });

    test('should swap players when moving later to earlier position', () => {
        addPlayerToGame('Player A');
        addPlayerToGame('Player B');
        addPlayerToGame('Player C');
        reorderPlayers('Player C', 'Player A');
        expect(state.players).toEqual(['Player C', 'Player B', 'Player A']);
    });

    test('should log a game', () => {
        logGame('Player 1', ['Player 1', 'Player 2'], { 'Player 1': 40, 'Player 2': 30 });
        const log = getGameLog();
        expect(log.length).toBe(1);
        expect(log[0].winner).toBe('Player 1');
    });

    test('should delete a game log entry', () => {
        logGame('Player 1', ['Player 1', 'Player 2'], { 'Player 1': 40, 'Player 2': 30 });
        const log = getGameLog();
        deleteGameLogEntry(log[0].id);
        const newLog = getGameLog();
        expect(newLog.length).toBe(0);
    });
});
