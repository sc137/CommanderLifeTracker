import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import {
    adjustCommanderDamage,
    adjustPlayerLife,
    adjustPoison,
    declareWinner,
    markPlayerAsDead,
    resetCurrentGame,
} from "./game-actions.js";
import {
    getGameLog,
    getStartingLife,
    setDefaultPlayer,
    setStartingLife,
    state,
} from "./state.js";
import { ensureGlobals, resetState } from "./fixtures.js";

describe("Game Actions", () => {
    beforeEach(() => {
        ensureGlobals();
        global.localStorage.clear();
        resetState();
    });

    it("should clamp life changes within valid bounds", () => {
        state.players = ["Alice"];
        state.playerState = {
            Alice: { life: 40, poison: 0, dead: false },
        };

        assert.strictEqual(adjustPlayerLife("Alice", -50), 0);
        assert.strictEqual(state.playerState.Alice.life, 0);
        assert.strictEqual(adjustPlayerLife("Alice", 2000), 999);
        assert.strictEqual(state.playerState.Alice.life, 999);
    });

    it("should apply commander damage and subtract matching life", () => {
        state.players = ["Alice", "Bob"];
        state.playerState = {
            Alice: { life: 40, poison: 0, dead: false },
            Bob: { life: 40, poison: 0, dead: false },
        };

        const result = adjustCommanderDamage("Alice", "Bob", 21);

        assert.deepStrictEqual(result, {
            previousValue: 0,
            value: 21,
            appliedDelta: 21,
            isLethal: true,
        });
        assert.strictEqual(state.playerState.Alice.life, 19);
        assert.deepStrictEqual(state.commanderDamage, {
            Alice: { Bob: 21 },
        });
    });

    it("should adjust poison within valid bounds", () => {
        state.players = ["Alice"];
        state.playerState = {
            Alice: { life: 40, poison: 9, dead: false },
        };

        assert.strictEqual(adjustPoison("Alice", 1), 10);
        assert.strictEqual(adjustPoison("Alice", 5), 10);
        assert.strictEqual(adjustPoison("Alice", -15), 0);
    });

    it("should mark a player dead and report remaining alive players", () => {
        state.players = ["Alice", "Bob", "Carol"];
        state.playerState = {
            Alice: { life: 0, poison: 0, dead: false },
            Bob: { life: 12, poison: 0, dead: false },
            Carol: { life: 9, poison: 0, dead: true },
        };

        const alivePlayers = markPlayerAsDead("Alice");

        assert.strictEqual(state.playerState.Alice.dead, true);
        assert.deepStrictEqual(alivePlayers, ["Bob"]);
    });

    it("should declare a winner and log the finished game", () => {
        state.players = ["Alice", "Bob"];
        state.playerState = {
            Alice: { life: 18, poison: 0, dead: false },
            Bob: { life: 0, poison: 0, dead: true },
        };

        assert.strictEqual(declareWinner("Alice"), true);
        assert.strictEqual(state.gameEnded, true);
        assert.strictEqual(state.winner, "Alice");
        assert.strictEqual(getGameLog().length, 1);
        assert.strictEqual(getGameLog()[0].winner, "Alice");
    });

    it("should reset the current game and re-add the default player", () => {
        setDefaultPlayer("Alice");
        setStartingLife(30);
        state.players = ["Alice", "Bob"];
        state.playerState = {
            Alice: { life: 11, poison: 1, dead: false },
            Bob: { life: 0, poison: 0, dead: true },
        };
        state.gameEnded = true;
        state.winner = "Alice";
        state.commanderDamage = {
            Bob: { Alice: 7 },
        };

        resetCurrentGame();

        assert.strictEqual(getStartingLife(), 30);
        assert.deepStrictEqual(state.players, ["Alice"]);
        assert.deepStrictEqual(state.playerState, {
            Alice: { life: 30, poison: 0, dead: false },
        });
        assert.deepStrictEqual(state.commanderDamage, {});
        assert.strictEqual(state.gameEnded, false);
        assert.strictEqual(state.winner, null);
    });
});
