import {
    getStartingLife,
    importAppData,
    restoreBackupState,
    serializeAppData,
    setStartingLife,
} from "./state.js";
import {
    hideModal,
    renderSettingsPlayersList,
    renderStartingLifeSetting,
    showConfirm,
    showModal,
    updateAddPlayerBtnVisibility,
    updateCurrentGamePlayersUI,
    updateUndoButtonState,
} from "./ui.js";

function refreshGameUI() {
    updateCurrentGamePlayersUI();
    updateAddPlayerBtnVisibility();
    updateUndoButtonState();
}

function setSettingsDataStatus(message, isError = false) {
    const status = document.getElementById("settings-data-status");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
}

function clearSettingsDataStatus() {
    const status = document.getElementById("settings-data-status");
    if (!status) return;
    status.textContent = "";
    status.dataset.state = "";
}

function setDataTransferStatus(message, isError = false) {
    const status = document.getElementById("data-transfer-status");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
}

function getShareExportButton() {
    return document.getElementById("share-export-btn");
}

function canUseNativeShare() {
    const navigatorRef = window.navigator;
    return Boolean(navigatorRef && typeof navigatorRef.share === "function");
}

function buildExportFile(rawExport) {
    if (typeof File === "undefined") {
        return null;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    return new File(
        [rawExport],
        `commander-life-tracker-export-${dateStamp}.json`,
        { type: "application/json" }
    );
}

function configureDataTransferModal({ title, help, value, importMode }) {
    document.getElementById("data-transfer-title").textContent = title;
    document.getElementById("data-transfer-help").textContent = help;

    const textarea = document.getElementById("data-transfer-textarea");
    textarea.value = value;
    textarea.readOnly = !importMode;
    textarea.placeholder = importMode ? "Paste exported JSON here." : "";

    getShareExportButton().hidden = importMode || !canUseNativeShare();
    document.getElementById("apply-import-btn").hidden = !importMode;
    setDataTransferStatus("");
}

function openExportDataModal() {
    configureDataTransferModal({
        title: "Export Data",
        help: "Copy this JSON, or share it to Files/iCloud Drive on supported devices.",
        value: JSON.stringify(serializeAppData(), null, 2),
        importMode: false,
    });
    showModal("data-transfer-modal");
}

function openImportDataModal() {
    configureDataTransferModal({
        title: "Import Data",
        help: "Paste previously exported JSON. This replaces saved players, history, and the current game.",
        value: "",
        importMode: true,
    });
    showModal("data-transfer-modal");
    setTimeout(() => document.getElementById("data-transfer-textarea").focus(), 0);
}

async function applyImportedData() {
    const textarea = document.getElementById("data-transfer-textarea");
    const raw = textarea.value.trim();

    if (!raw) {
        setDataTransferStatus("Paste exported JSON before importing.", true);
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        setDataTransferStatus("Import data is not valid JSON.", true);
        return;
    }

    const confirmed = await showConfirm(
        "This will replace your saved players, history, and current game.",
        "Import Data"
    );
    if (!confirmed) return;

    if (!importAppData(parsed)) {
        setDataTransferStatus("Import data is missing required fields.", true);
        return;
    }

    hideModal();
    renderSettingsPlayersList();
    refreshGameUI();
    setSettingsDataStatus("Import complete.");
}

async function handleRestoreBackup() {
    const confirmed = await showConfirm(
        "Restore the previous saved game snapshot?",
        "Restore Backup"
    );
    if (!confirmed) return;

    if (!restoreBackupState()) {
        setSettingsDataStatus("No backup is available yet.", true);
        return;
    }

    refreshGameUI();
    setSettingsDataStatus("Backup restored.");
}

async function shareExportData() {
    const rawExport = document.getElementById("data-transfer-textarea").value.trim();
    if (!rawExport) {
        setDataTransferStatus("There is no export data to share yet.", true);
        return;
    }

    const navigatorRef = window.navigator;
    if (!navigatorRef || typeof navigatorRef.share !== "function") {
        setDataTransferStatus("Sharing is not supported on this device.", true);
        return;
    }

    const sharePayload = {
        title: "Commander Life Tracker Export",
        text: rawExport,
    };

    const exportFile = buildExportFile(rawExport);
    if (exportFile && typeof navigatorRef.canShare === "function") {
        const filePayload = {
            files: [exportFile],
            title: "Commander Life Tracker Export",
        };
        if (navigatorRef.canShare(filePayload)) {
            sharePayload.files = filePayload.files;
            delete sharePayload.text;
        }
    }

    try {
        await navigatorRef.share(sharePayload);
        setDataTransferStatus("Export shared.");
    } catch (error) {
        if (error && error.name === "AbortError") {
            return;
        }
        setDataTransferStatus("Could not share the export on this device.", true);
    }
}

function handleStartingLifeChange(event) {
    const nextValue = Number.parseInt(event.target.value, 10);
    if (!setStartingLife(nextValue)) {
        event.target.value = String(getStartingLife());
        setSettingsDataStatus("Choose a supported starting life total.", true);
        return;
    }
    setSettingsDataStatus(`Starting life set to ${nextValue}.`);
}

function openSettingsModal() {
    document.getElementById("menu-overlay").hidden = true;
    renderStartingLifeSetting();
    renderSettingsPlayersList();
    clearSettingsDataStatus();
    showModal("settings-modal");
}

export {
    applyImportedData,
    clearSettingsDataStatus,
    handleRestoreBackup,
    handleStartingLifeChange,
    openExportDataModal,
    openImportDataModal,
    openSettingsModal,
    shareExportData,
};
