
import {
    state,
    saveState,
    addPlayerToGame,
    removePlayerFromGame,
    reorderPlayers,
    savePlayer,
    setDefaultPlayer,
    getDefaultPlayer,
    getSavedPlayers,
    removePlayer,
    logGame,
    deleteGameLogEntry,
} from "./state.js";
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
} from "./ui.js";

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

    addPlayerToGame(name);
    updateCurrentGamePlayersUI();
    hideModal();
}

async function declareWinner(playerName) {
    if (state.gameEnded) return;
    const confirmed = await showConfirm(
        `This will end the game.`, `Declare ${playerName} as the winner?`
    );
    if (!confirmed) return;

    state.gameEnded = true;
    state.winner = playerName;

    logGame(playerName, state.players, state.playerState);

    document.querySelectorAll(".player-tile").forEach((tile) => {
        tile.classList.add("game-ended");
        tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    });

    const winnerTile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (winnerTile) winnerTile.classList.add("winner-tile");

    saveState();
    updateAddPlayerBtnVisibility();
}

function updatePlayerLife(playerName, delta) {
    let life = state.playerState[playerName].life + delta;
    if (life < 0) life = 0;
    if (life > 999) life = 999;
    state.playerState[playerName].life = life;

    const tile = document.querySelector(
        `.player-tile[data-player="${playerName}"]`
    );
    if (tile) {
        const lifeTotal = tile.querySelector(".life-total");
        if (lifeTotal) lifeTotal.textContent = life;
    }
    saveState();
}

function changeCommanderDamage(player, opponent, delta) {
    if (!state.commanderDamage[player]) state.commanderDamage[player] = {};
    if (state.commanderDamage[player][opponent] == null)
        state.commanderDamage[player][opponent] = 0;

    let val = state.commanderDamage[player][opponent] + delta;
    if (val < 0) val = 0;
    if (val > 99) val = 99;
    state.commanderDamage[player][opponent] = val;

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
    saveState();
}

function openCommanderDamageModal(playerName) {
    const modal = document.getElementById("commander-damage-modal");
    const title = document.getElementById("commander-damage-title");
    const list = document.getElementById("commander-damage-list");
    title.textContent = `Commander Damage for ${playerName}`;
    list.innerHTML = "";

    const opponents = state.players.filter((p) => p !== playerName);
    opponents.forEach((opponent) => {
        if (!state.commanderDamage[playerName]) state.commanderDamage[playerName] = {};
        if (state.commanderDamage[playerName][opponent] == null)
            state.commanderDamage[playerName][opponent] = 0;

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
            openCommanderDamageModal(playerName);
        });

        const value = document.createElement("span");
        value.className = "commander-damage-value";
        value.textContent = state.commanderDamage[playerName][opponent];
        if (state.commanderDamage[playerName][opponent] >= 21) {
            value.classList.add("lethal");
        } else {
            value.classList.remove("lethal");
        }

        const plusBtn = document.createElement("button");
        plusBtn.className = "commander-damage-btn";
        plusBtn.textContent = "+";
        plusBtn.addEventListener("click", () => {
            changeCommanderDamage(playerName, opponent, 1);
            openCommanderDamageModal(playerName);
        });

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
    tile.classList.add("player-died");
    tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    state.playerState[playerName].dead = true;

    const alivePlayers = state.players.filter((p) => !state.playerState[p]?.dead);
    if (state.players.length > 1 && alivePlayers.length === 1) {
        declareWinner(alivePlayers[0]);
    }
    saveState();
}

async function startNewGame() {
    const confirmed = await showConfirm(
        "This will clear the current game.",
        "Start a new game?"
    );
    if (!confirmed) return;

    state.players = [];
    state.playerState = {};
    state.gameEnded = false;
    state.winner = null;
    state.commanderDamage = {};

    const defaultPlayer = getDefaultPlayer();
    if (defaultPlayer) {
        addPlayerToGame(defaultPlayer);
    }

    saveState();
    updateCurrentGamePlayersUI();
    updateAddPlayerBtnVisibility();
}

function initEventListeners() {
    const newPlayerInput = document.getElementById("new-player-input");

    document.getElementById("new-game-btn").addEventListener("click", startNewGame);

    document.getElementById("add-player-btn").addEventListener("click", () => {
        renderSavedPlayersList();
        showModal("add-player-modal");
    });

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
        state.selectedPlayers.forEach((player) => addPlayerToGame(player));
        updateCurrentGamePlayersUI();
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
        renderGameLog();
        showModal("game-log-modal");
    });

    document.getElementById("close-game-log-btn").addEventListener("click", hideModal);

    document.getElementById("settings-link").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("menu-overlay").hidden = true;
        renderSettingsPlayersList();
        showModal("settings-modal");
    });

    document.getElementById("close-settings-btn").addEventListener("click", hideModal);

    document.getElementById("player-tiles").addEventListener("click", (e) => {
        const target = e.target;
        const tile = target.closest(".player-tile");
        if (!tile) return;

        const playerName = tile.dataset.player;

        if (target.closest(".life-btn")) {
            const change = parseInt(target.closest(".life-btn").dataset.change, 10);
            updatePlayerLife(playerName, change);
        } else if (target.closest(".declare-winner-btn")) {
            declareWinner(playerName);
        } else if (target.closest(".commander-damage-btn")) {
            openCommanderDamageModal(playerName);
        } else if (target.closest(".poison-btn")) {
            openPoisonModal(playerName);
        } else if (target.closest(".mark-died-btn")) {
            markPlayerAsDied(playerName);
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
                .forEach((t) => t.classList.remove("drop-target"));
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
        if (tile) {
            tile.classList.remove("drop-target");
            const fromPlayer = e.dataTransfer.getData("text/plain");
            const toPlayer = tile.dataset.player;
            if (fromPlayer && toPlayer && fromPlayer !== toPlayer) {
                reorderPlayers(fromPlayer, toPlayer);
                updateCurrentGamePlayersUI();
            }
        }
    });

    document.getElementById("close-commander-damage-btn").addEventListener("click", hideModal);

    document.getElementById("poison-plus-btn").addEventListener("click", () => {
        if (!state.currentPoisonPlayer) return;
        state.playerState[state.currentPoisonPlayer].poison = Math.min(
            (state.playerState[state.currentPoisonPlayer].poison || 0) + 1,
            10
        );
        const count = state.playerState[state.currentPoisonPlayer].poison || 0;
        document.getElementById("poison-count-display").textContent = count;
        const tile = document.querySelector(
            `.player-tile[data-player="${state.currentPoisonPlayer}"]`
        );
        if (tile) {
            const poisonCount = tile.querySelector(".poison-count");
            if (poisonCount) poisonCount.textContent = count;
        }
    });

    document.getElementById("poison-minus-btn").addEventListener("click", () => {
        if (!state.currentPoisonPlayer) return;
        state.playerState[state.currentPoisonPlayer].poison = Math.max(
            (state.playerState[state.currentPoisonPlayer].poison || 0) - 1,
            0
        );
        const count = state.playerState[state.currentPoisonPlayer].poison || 0;
        document.getElementById("poison-count-display").textContent = count;
        const tile = document.querySelector(
            `.player-tile[data-player="${state.currentPoisonPlayer}"]`
        );
        if (tile) {
            const poisonCount = tile.querySelector(".poison-count");
            if (poisonCount) poisonCount.textContent = count;
        }
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

    document.getElementById("settings-add-player-btn").addEventListener("click", () => {
        showModal("new-player-modal");
    });
}

export { initEventListeners, handleSaveNewPlayer };
