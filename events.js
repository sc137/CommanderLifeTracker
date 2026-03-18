import {
    state,
    addPlayerToGame,
    removePlayerFromGame,
    reorderPlayers,
    savePlayer,
    setDefaultPlayer,
    getDefaultPlayer,
    getSavedPlayers,
    removePlayer,
    deleteGameLogEntry,
    pushUndoState,
    undoLastAction,
} from "./state.js";
import {
    adjustCommanderDamage,
    adjustPlayerLife,
    adjustPoison,
    declareWinner as applyWinner,
    markPlayerAsDead,
    resetCurrentGame,
} from "./game-actions.js";
import { GAME_LIMITS } from "./constants.js";
import {
    updateCurrentGamePlayersUI,
    renderSavedPlayersList,
    renderSettingsPlayersList,
    renderGameLog,
    showModal,
    hideModal,
    showConfirm,
    showInputError,
    clearInputError,
    updateAddPlayerBtnVisibility,
    updateCommanderDamageIndicator,
    updateUndoButtonState,
} from "./ui.js";
import {
    applyImportedData,
    clearSettingsDataStatus,
    handleRestoreBackup,
    handleStartingLifeChange,
    openExportDataModal,
    openImportDataModal,
    openSettingsModal,
    shareExportData,
} from "./settings-controller.js";

function refreshGameUI() {
    updateCurrentGamePlayersUI();
    updateAddPlayerBtnVisibility();
    updateUndoButtonState();
}

function captureUndoState() {
    pushUndoState();
    updateUndoButtonState();
}

function handleUndo() {
    if (!undoLastAction()) return;
    hideModal();
    refreshGameUI();
}

function handleSaveNewPlayer() {
    const newPlayerInput = document.getElementById("new-player-input");
    const name = newPlayerInput.value.trim();

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

    const success = savePlayer(name);
    if (!success) {
        showInputError("Could not save player. Try a different name.");
        return;
    }

    if (!getDefaultPlayer()) {
        setDefaultPlayer(name);
    }

    captureUndoState();
    addPlayerToGame(name);
    refreshGameUI();
    hideModal();
}

async function declareWinner(playerName, options = {}) {
    if (state.gameEnded) return;
    const confirmed = await showConfirm(
        "This will end the game.",
        `Declare ${playerName} as the winner?`
    );
    if (!confirmed) return;
    if (!options.skipUndo) {
        captureUndoState();
    }
    if (!applyWinner(playerName)) return;

    document.querySelectorAll(".player-tile").forEach((tile) => {
        tile.classList.add("game-ended");
        tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    });

    const winnerTile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (winnerTile) winnerTile.classList.add("winner-tile");
    updateAddPlayerBtnVisibility();
}

function updatePlayerLifeUI(playerName) {
    const tile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (tile) {
        const lifeTotal = tile.querySelector(".life-total");
        if (lifeTotal) {
            lifeTotal.textContent = state.playerState[playerName]?.life ?? 0;
        }
    }
}

function updatePoisonUI(playerName, count) {
    document.getElementById("poison-count-display").textContent = count;
    const tile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (!tile) return;

    const poisonCount = tile.querySelector(".poison-count");
    if (poisonCount) {
        poisonCount.textContent = count;
    }
}

function changeCommanderDamage(player, opponent, delta) {
    const currentValue = state.commanderDamage[player]?.[opponent] ?? 0;
    const nextValue = Math.max(
        0,
        Math.min(GAME_LIMITS.maxCommanderDamage, currentValue + delta)
    );
    if (nextValue !== currentValue) {
        captureUndoState();
    }

    const result = adjustCommanderDamage(player, opponent, delta);
    updatePlayerLifeUI(player);

    const tile = document.querySelector(
        `.player-tile[data-player="${player}"]`
    );
    if (tile) {
        if (result.isLethal) {
            tile.classList.add("commander-lethal");
        } else {
            tile.classList.remove("commander-lethal");
        }
    }
    updateCommanderDamageIndicator(player);
    return result;
}

function openCommanderDamageModal(playerName) {
    const title = document.getElementById("commander-damage-title");
    const list = document.getElementById("commander-damage-list");
    title.textContent = `Commander Damage for ${playerName}`;
    list.innerHTML = "";

    const opponents = state.players.filter((player) => player !== playerName);
    opponents.forEach((opponent) => {
        const isDead = Boolean(state.playerState[opponent]?.dead);
        if (!state.commanderDamage[playerName]) state.commanderDamage[playerName] = {};
        if (state.commanderDamage[playerName][opponent] == null) {
            state.commanderDamage[playerName][opponent] = 0;
        }

        const row = document.createElement("div");
        row.className = "commander-damage-row";
        if (isDead) {
            row.classList.add("dead-player-row");
        }

        const name = document.createElement("span");
        name.className = "commander-opponent-name";
        name.textContent = opponent;

        const controls = document.createElement("div");
        controls.className = "commander-damage-controls";

        const minusBtn = document.createElement("button");
        minusBtn.className = "commander-damage-btn";
        minusBtn.textContent = "-";
        minusBtn.disabled = isDead;
        if (!isDead) {
            minusBtn.addEventListener("click", () => {
                changeCommanderDamage(playerName, opponent, -1);
                openCommanderDamageModal(playerName);
            });
        }

        const value = document.createElement("span");
        value.className = "commander-damage-value";
        value.textContent = state.commanderDamage[playerName][opponent];
        if (state.commanderDamage[playerName][opponent] >= GAME_LIMITS.commanderLethal) {
            value.classList.add("lethal");
        } else {
            value.classList.remove("lethal");
        }

        const plusBtn = document.createElement("button");
        plusBtn.className = "commander-damage-btn";
        plusBtn.textContent = "+";
        plusBtn.disabled = isDead;
        if (!isDead) {
            plusBtn.addEventListener("click", async () => {
                const result = changeCommanderDamage(playerName, opponent, 1);
                const reachedCommanderLethal =
                    result.previousValue < GAME_LIMITS.commanderLethal &&
                    result.value >= GAME_LIMITS.commanderLethal;

                if (!reachedCommanderLethal) {
                    openCommanderDamageModal(playerName);
                    return;
                }

                const confirmed = await showConfirm(
                    `Mark "${playerName}" as dead from commander damage by ${opponent}?`,
                    "Commander Damage"
                );
                if (!confirmed) {
                    openCommanderDamageModal(playerName);
                    return;
                }

                hideModal();
                await markPlayerAsDied(playerName);
                return;
            });
        }

        controls.appendChild(minusBtn);
        controls.appendChild(value);
        controls.appendChild(plusBtn);

        row.appendChild(name);
        row.appendChild(controls);

        list.appendChild(row);
    });

    showModal("commander-damage-modal");
}

function openPoisonModal(playerName) {
    state.currentPoisonPlayer = playerName;
    document.getElementById(
        "poison-modal-title"
    ).textContent = `Poison Counters for ${playerName}`;
    document.getElementById("poison-count-display").textContent =
        state.playerState[playerName].poison || 0;
    showModal("poison-modal");
}

async function markPlayerAsDied(playerName) {
    const tile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (!tile) return;

    captureUndoState();
    tile.classList.add("player-died");
    tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    const alivePlayers = markPlayerAsDead(playerName);
    if (state.players.length > 1 && alivePlayers.length === 1) {
        declareWinner(alivePlayers[0], { skipUndo: true });
    }
}

async function removePlayerFromGameUI(playerName) {
    const confirmed = await showConfirm(
        `Remove "${playerName}" from the current game?`,
        "Remove Player"
    );
    if (!confirmed) return;
    captureUndoState();
    removePlayerFromGame(playerName);
    refreshGameUI();
}

async function startNewGame() {
    const confirmed = await showConfirm(
        "This will clear the current game.",
        "Start a new game?"
    );
    if (!confirmed) return;

    captureUndoState();
    resetCurrentGame();
    refreshGameUI();
}

function initEventListeners() {
    const newPlayerInput = document.getElementById("new-player-input");

    document.getElementById("new-game-btn").addEventListener("click", startNewGame);

    document.getElementById("add-player-btn").addEventListener("click", () => {
        renderSavedPlayersList();
        showModal("add-player-modal");
    });

    document.getElementById("undo-btn").addEventListener("click", handleUndo);

    document.getElementById("close-add-player-btn").addEventListener("click", hideModal);

    document.getElementById("new-player-btn").addEventListener("click", () => {
        newPlayerInput.value = "";
        clearInputError();
        showModal("new-player-modal");
    });

    document.getElementById("save-new-player-btn").addEventListener("click", handleSaveNewPlayer);
    document.getElementById("cancel-new-player-btn").addEventListener("click", hideModal);
    newPlayerInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSaveNewPlayer();
        }
    });

    document.getElementById("add-player-done-btn").addEventListener("click", () => {
        if (state.selectedPlayers.size === 0) {
            hideModal();
            return;
        }
        captureUndoState();
        state.selectedPlayers.forEach((player) => addPlayerToGame(player));
        refreshGameUI();
        hideModal();
    });

    document.getElementById("modal-overlay").addEventListener("mousedown", (e) => {
        if (e.target === document.getElementById("modal-overlay")) {
            hideModal();
        }
    });

    document.getElementById("hamburger").addEventListener("click", () => {
        const menuOverlay = document.getElementById("menu-overlay");
        menuOverlay.hidden = false;
        menuOverlay.setAttribute("aria-visible", "true");
        setTimeout(() => document.getElementById("view-log-link").focus(), 100);
    });

    document.getElementById("menu-overlay").addEventListener("mousedown", (e) => {
        if (!document.querySelector(".menu-panel").contains(e.target)) {
            const menuOverlay = document.getElementById("menu-overlay");
            menuOverlay.setAttribute("aria-visible", "false");
            setTimeout(() => {
                menuOverlay.hidden = true;
            }, 250);
            document.getElementById("hamburger").focus();
        }
    });

    document.getElementById("about-link").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("menu-overlay").hidden = true;
        showModal("about-modal");
    });

    document.getElementById("close-about-btn").addEventListener("click", hideModal);

    document.getElementById("view-log-link").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("menu-overlay").hidden = true;
        document.getElementById("game-log-filter-input").value = "";
        renderGameLog();
        showModal("game-log-modal");
    });

    document.getElementById("close-game-log-btn").addEventListener("click", hideModal);
    document.getElementById("game-log-filter-input").addEventListener("input", renderGameLog);

    document.getElementById("game-log-list").addEventListener("click", async (e) => {
        const btn = e.target.closest(".delete-game-log-btn");
        if (!btn) return;
        const gameId = parseInt(btn.dataset.logId, 10);
        if (!gameId) return;
        const confirmed = await showConfirm("Delete this game log entry?", "Delete Game");
        if (!confirmed) return;
        deleteGameLogEntry(gameId);
        renderGameLog();
    });

    document.getElementById("settings-link").addEventListener("click", (e) => {
        e.preventDefault();
        openSettingsModal();
    });

    document.getElementById("close-settings-btn").addEventListener("click", hideModal);
    document.getElementById("settings-add-player-btn").addEventListener("click", () => {
        showModal("new-player-modal");
    });
    document.getElementById("export-data-btn").addEventListener("click", openExportDataModal);
    document.getElementById("import-data-btn").addEventListener("click", openImportDataModal);
    document.getElementById("restore-backup-btn").addEventListener("click", handleRestoreBackup);
    document.getElementById("share-export-btn").addEventListener("click", shareExportData);
    document.getElementById("apply-import-btn").addEventListener("click", applyImportedData);
    document.getElementById("close-data-transfer-btn").addEventListener("click", hideModal);
    document.getElementById("settings-starting-life-select").addEventListener("change", handleStartingLifeChange);

    document.getElementById("player-tiles").addEventListener("click", async (e) => {
        const target = e.target;
        const tile = target.closest(".player-tile");
        if (!tile) return;

        const playerName = tile.dataset.player;

        if (target.closest(".life-btn")) {
            captureUndoState();
            const change = parseInt(target.closest(".life-btn").dataset.change, 10);
            adjustPlayerLife(playerName, change);
            updatePlayerLifeUI(playerName);
        } else if (target.closest(".declare-winner-btn")) {
            declareWinner(playerName);
        } else if (target.closest(".commander-damage-btn")) {
            openCommanderDamageModal(playerName);
        } else if (target.closest(".poison-btn")) {
            openPoisonModal(playerName);
        } else if (target.closest(".mark-died-btn")) {
            const confirmed = await showConfirm(
                `Mark "${playerName}" as dead?`,
                "Mark Player Dead"
            );
            if (confirmed) {
                markPlayerAsDied(playerName);
            }
        } else if (target.closest(".remove-player-btn")) {
            removePlayerFromGameUI(playerName);
        }
    });

    document.getElementById("player-tiles").addEventListener("dragstart", (e) => {
        const tile = e.target.closest(".player-tile");
        if (tile) {
            state.draggedPlayer = tile.dataset.player;
            tile.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", state.draggedPlayer);
        }
    });

    document.getElementById("player-tiles").addEventListener("dragend", (e) => {
        const tile = e.target.closest(".player-tile");
        if (tile) {
            state.draggedPlayer = null;
            tile.classList.remove("dragging");
            document
                .querySelectorAll(".player-tile.drop-target")
                .forEach((dropTarget) => dropTarget.classList.remove("drop-target"));
        }
    });

    document.getElementById("player-tiles").addEventListener("dragover", (e) => {
        e.preventDefault();
        const tile = e.target.closest(".player-tile");
        if (tile && tile.dataset.player !== state.draggedPlayer) {
            tile.classList.add("drop-target");
        }
    });

    document.getElementById("player-tiles").addEventListener("dragleave", (e) => {
        const tile = e.target.closest(".player-tile");
        if (tile) {
            tile.classList.remove("drop-target");
        }
    });

    document.getElementById("player-tiles").addEventListener("drop", (e) => {
        e.preventDefault();
        const tile = e.target.closest(".player-tile");
        if (!tile) return;

        tile.classList.remove("drop-target");
        const fromPlayer = e.dataTransfer.getData("text/plain");
        const toPlayer = tile.dataset.player;
        if (fromPlayer && toPlayer && fromPlayer !== toPlayer) {
            captureUndoState();
            reorderPlayers(fromPlayer, toPlayer);
            refreshGameUI();
        }
    });

    document.getElementById("close-commander-damage-btn").addEventListener("click", hideModal);

    document.getElementById("poison-plus-btn").addEventListener("click", async () => {
        if (!state.currentPoisonPlayer) return;
        const playerName = state.currentPoisonPlayer;
        const currentCount = state.playerState[playerName].poison || 0;
        if (currentCount >= GAME_LIMITS.maxPoison) return;

        captureUndoState();
        const count = adjustPoison(playerName, 1);
        updatePoisonUI(playerName, count);

        if (count === GAME_LIMITS.maxPoison) {
            const confirmed = await showConfirm(
                `Mark "${playerName}" as dead from poison counters?`,
                "Poison Counters"
            );
            if (!confirmed) {
                openPoisonModal(playerName);
                return;
            }

            hideModal();
            state.currentPoisonPlayer = null;
            await markPlayerAsDied(playerName);
        }
    });

    document.getElementById("poison-minus-btn").addEventListener("click", () => {
        if (!state.currentPoisonPlayer) return;
        const currentCount = state.playerState[state.currentPoisonPlayer].poison || 0;
        if (currentCount <= 0) return;

        captureUndoState();
        const count = adjustPoison(state.currentPoisonPlayer, -1);
        updatePoisonUI(state.currentPoisonPlayer, count);
    });

    document.getElementById("close-poison-modal-btn").addEventListener("click", () => {
        hideModal();
        state.currentPoisonPlayer = null;
    });

    document.getElementById("saved-players-list").addEventListener("click", (e) => {
        const row = e.target.closest(".saved-player-row");
        if (!row) return;
        const playerName = row.textContent;
        if (state.selectedPlayers.has(playerName)) {
            state.selectedPlayers.delete(playerName);
            row.classList.remove("selected");
        } else {
            state.selectedPlayers.add(playerName);
            row.classList.add("selected");
        }
    });

    document.getElementById("settings-players-list").addEventListener("click", async (e) => {
        const target = e.target;
        const row = target.closest(".settings-player-row");
        if (!row) return;

        const playerName = row.querySelector(".settings-player-name").textContent;

        if (target.matches(".settings-default-radio")) {
            setDefaultPlayer(playerName);
            renderSettingsPlayersList();
        } else if (target.matches(".unset-default-btn")) {
            localStorage.removeItem("cmdrtrackr_default_player");
            renderSettingsPlayersList();
        } else if (target.matches(".delete-player-btn")) {
            const confirmed = await showConfirm(
                `Delete saved player "${playerName}"? This cannot be undone.`,
                "Delete Player"
            );
            if (confirmed) {
                removePlayer(playerName);
                renderSettingsPlayersList();
            }
        }
    });

    updateUndoButtonState();
}

export { changeCommanderDamage, handleSaveNewPlayer, initEventListeners };
