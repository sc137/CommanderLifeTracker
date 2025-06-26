import { state, saveState, reorderPlayers, ensurePlayerState, getGameLog, deleteGameLogEntry, getSavedPlayers, getDefaultPlayer, setDefaultPlayer, removePlayer } from './state.js';

let modalOverlay, addPlayerModal, newPlayerModal, aboutModal, gameLogModal, settingsModal, commanderDamageModal, poisonModal, confirmModal, newPlayerInput;

function initUI() {
    modalOverlay = document.getElementById("modal-overlay");
    addPlayerModal = document.getElementById("add-player-modal");
    newPlayerModal = document.getElementById("new-player-modal");
    aboutModal = document.getElementById("about-modal");
    gameLogModal = document.getElementById("game-log-modal");
    settingsModal = document.getElementById("settings-modal");
    commanderDamageModal = document.getElementById("commander-damage-modal");
    poisonModal = document.getElementById("poison-modal");
    confirmModal = document.getElementById("confirm-modal");
    newPlayerInput = document.getElementById("new-player-input");
}

function createPlayerTile(playerName) {
    ensurePlayerState(playerName);
    const { life, poison, dead } = state.playerState[playerName];

    const tile = document.createElement("div");
    const classes = ["player-tile"];
    if (dead) classes.push("player-died");
    if (state.gameEnded) classes.push("game-ended");
    if (state.gameEnded && state.winner === playerName) {
        classes.push("winner-tile");
    }
    tile.className = classes.join(" ");
    tile.dataset.player = playerName;
    tile.setAttribute("draggable", "true");

    const header = document.createElement("div");
    header.className = "player-tile-header";

    const nameSpan = document.createElement("span");
    nameSpan.className = "player-name";
    nameSpan.textContent = playerName;

    const winnerBtn = document.createElement("button");
    winnerBtn.className = "declare-winner-btn";
    winnerBtn.title = "Declare Winner";
    winnerBtn.setAttribute("aria-label", "Declare Winner");
    winnerBtn.textContent = "🏆";

    header.appendChild(nameSpan);
    header.appendChild(winnerBtn);

    const lifeSection = document.createElement("div");
    lifeSection.className = "life-section";

    const btns = [
        { label: "-5", change: -5 },
        { label: "-1", change: -1 },
        { label: "+1", change: 1 },
        { label: "+5", change: 5 },
    ];

    btns.forEach(({ label, change }) => {
        const btn = document.createElement("button");
        btn.className = "life-btn";
        btn.textContent = label;
        btn.dataset.change = change > 0 ? `+${change}` : `${change}`;
        lifeSection.appendChild(btn);
        if (label === "-1") {
            const lifeTotal = document.createElement("span");
            lifeTotal.className = "life-total";
            lifeTotal.textContent = life;
            lifeTotal.dataset.player = playerName;
            lifeSection.appendChild(lifeTotal);
        }
    });

    const actions = document.createElement("div");
    actions.className = "tile-actions";

    const commanderBtn = document.createElement("button");
    commanderBtn.className = "commander-damage-btn";
    commanderBtn.title = "Commander Damage";
    commanderBtn.setAttribute("aria-label", "Commander Damage");
    commanderBtn.textContent = "⚔️";

    const poisonBtn = document.createElement("button");
    poisonBtn.className = "poison-btn";
    poisonBtn.title = "Poison Counters";
    poisonBtn.setAttribute("aria-label", "Poison Counters");
    poisonBtn.innerHTML = `<span class="poison-icon">🐍</span><span class="poison-count">${poison}</span>`;

    const diedBtn = document.createElement("button");
    diedBtn.className = "mark-died-btn";
    diedBtn.title = "Mark as Died";
    diedBtn.setAttribute("aria-label", "Mark as Died");
    diedBtn.textContent = "☠️";

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-player-btn";
    removeBtn.title = "Remove Player";
    removeBtn.setAttribute("aria-label", "Remove Player");
    removeBtn.textContent = "✖";

    actions.appendChild(commanderBtn);
    actions.appendChild(poisonBtn);
    actions.appendChild(diedBtn);
    actions.appendChild(removeBtn);

    tile.appendChild(header);
    tile.appendChild(lifeSection);
    tile.appendChild(actions);

    if (dead || state.gameEnded) {
        tile.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
    }

    return tile;
}

function updateCurrentGamePlayersUI() {
    const container = document.getElementById("player-tiles");
    container.innerHTML = "";
    if (state.players.length === 0) {
        container.innerHTML =
            '<div class="empty-player-list"><h2 class="empty-player-list">There are no players in this game yet.<br><br>Press +Player to add players to the game.<br><br> You may set a default player in the Settings.</h2></div>';
        return;
    }
    state.players.forEach((player) => {
        const tile = createPlayerTile(player);
        container.appendChild(tile);
    });
}

function renderSavedPlayersList() {
    const savedPlayers = getSavedPlayers();
    const defaultPlayer = getDefaultPlayer();
    const players = savedPlayers.filter((p) => p !== defaultPlayer);
    players.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const orderedPlayers = defaultPlayer ? [defaultPlayer, ...players] : players;
    const list = document.getElementById("saved-players-list");
    list.innerHTML = "";
    state.selectedPlayers.clear();

    if (orderedPlayers.length === 0) {
        showModal("new-player-modal");
        return;
    }

    orderedPlayers.forEach((player) => {
        const row = document.createElement("div");
        row.className = "saved-player-row";
        row.textContent = player;
        list.appendChild(row);
    });
}

function renderSettingsPlayersList() {
    const list = document.getElementById("settings-players-list");
    const players = getSavedPlayers();
    const defaultPlayer = getDefaultPlayer();
    list.innerHTML = "";
    if (players.length === 0) {
        list.innerHTML = '<div class="empty-player-list">No saved players.</div>';
        return;
    }

    const otherPlayers = players
        .filter((p) => p !== defaultPlayer)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const orderedPlayers = defaultPlayer
        ? [defaultPlayer, ...otherPlayers]
        : otherPlayers;

    orderedPlayers.forEach((player) => {
        const row = document.createElement("div");
        row.className = "settings-player-row";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "default-player";
        radio.className = "settings-default-radio";
        radio.checked = player === defaultPlayer;

        const name = document.createElement("span");
        name.className = "settings-player-name";
        name.textContent = player;

        const label = document.createElement("span");
        label.className = "settings-default-label";
        label.textContent = player === defaultPlayer ? "Default" : "";

        if (player === defaultPlayer) {
            const unsetBtn = document.createElement("button");
            unsetBtn.className = "unset-default-btn";
            unsetBtn.title = "Remove default player";
            unsetBtn.innerHTML = "❌";
            label.appendChild(document.createTextNode(" "));
            label.appendChild(unsetBtn);
        }

        const delBtn = document.createElement("button");
        delBtn.className = "delete-player-btn";
        delBtn.title = "Delete player";
        delBtn.innerHTML = "🗑️";

        row.appendChild(radio);
        row.appendChild(name);
        row.appendChild(label);
        row.appendChild(delBtn);

        list.appendChild(row);
    });
}

function renderGameLog() {
    const logList = document.getElementById("game-log-list");
    const log = getGameLog();
    logList.innerHTML = "";
    if (log.length === 0) {
        logList.innerHTML =
            '<div class="empty-game-log">No games played yet.</div>';
        return;
    }
    log
        .slice()
        .reverse()
        .forEach((entry) => {
            const div = document.createElement("div");
            div.className = "game-log-entry";
            div.dataset.logId = entry.id;

            const header = document.createElement("div");
            header.className = "game-log-header";
            header.innerHTML = `<span class="game-log-winner">🏆 ${entry.winner
                }</span>
      <span class="game-log-date">${new Date(
                entry.endedAt
            ).toLocaleString()}</span>`;

            const details = document.createElement("div");
            details.className = "game-log-details";
            details.textContent = `Players: ${entry.players.join(", ")}`;

            const lifeTotals = document.createElement("div");
            lifeTotals.className = "game-log-details";
            lifeTotals.textContent =
                "Final Life: " +
                entry.players.map((p) => `${p}: ${entry.lifeTotals[p]}`).join(", ");

            const delBtn = document.createElement("button");
            delBtn.className = "delete-game-log-btn";
            delBtn.title = "Delete Game Log Entry";
            delBtn.innerHTML = "✖";
            delBtn.dataset.logId = entry.id;

            div.appendChild(header);
            div.appendChild(details);
            div.appendChild(lifeTotals);
            div.appendChild(delBtn);

            logList.appendChild(div);
        });
}

function showModal(modalId) {
    document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
    modalOverlay.hidden = false;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.hidden = false;
        modal.classList.add("modal-animate-in");
        setTimeout(() => modal.classList.remove("modal-animate-in"), 200);
        const focusable = modal.querySelector(
            'button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]'
        );
        if (focusable) {
            const standalone =
                (window.matchMedia &&
                    window.matchMedia('(display-mode: standalone)').matches) ||
                window.navigator.standalone;
            if (standalone) {
                focusable.focus();
            } else {
                setTimeout(() => focusable.focus(), 50);
            }
        }
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("role", "dialog");
    }
}

function hideModal() {
    document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
    modalOverlay.hidden = true;
}

function showConfirm(message, title = "Confirm") {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirm-modal");
        document.getElementById("confirm-modal-title").textContent = title;
        document.getElementById("confirm-modal-message").textContent = message;
        showModal("confirm-modal");

        const okBtn = document.getElementById("confirm-modal-ok");
        const cancelBtn = document.getElementById("confirm-modal-cancel");

        function onOk() {
            cleanup(true);
        }
        function onCancel() {
            cleanup(false);
        }

        function cleanup(result) {
            hideModal();
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            resolve(result);
        }

        okBtn.addEventListener("click", onOk, { once: true });
        cancelBtn.addEventListener("click", onCancel, { once: true });
    });
}

function showInputError(msg) {
    let err = document.getElementById("new-player-error");
    if (!err) {
        err = document.createElement("div");
        err.id = "new-player-error";
        err.className = "input-error";
        newPlayerInput.parentNode.insertBefore(err, newPlayerInput.nextSibling);
    }
    err.textContent = msg;
    newPlayerInput.setAttribute("aria-invalid", "true");
}

function clearInputError() {
    const err = document.getElementById("new-player-error");
    if (err) err.remove();
    newPlayerInput.removeAttribute("aria-invalid");
}

function updateAddPlayerBtnVisibility() {
    const addPlayerBtn = document.getElementById("add-player-btn");
    addPlayerBtn.style.display = state.gameEnded ? "none" : "";
}

export {
    initUI,
    createPlayerTile,
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
};