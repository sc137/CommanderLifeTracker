import {
    getStartingLife,
    importAppData,
    restoreBackupState,
    serializeAppData,
    setStartingLife,
} from "./state.js";
import { APP_VERSION, APP_VERSION_FILE } from "./constants.js";
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

function buildVersionStatus(message, latestVersion = APP_VERSION) {
    if (latestVersion === APP_VERSION) {
        return `${message} Current version: ${APP_VERSION}`;
    }

    return `${message} Current version: ${APP_VERSION}. Latest available version: ${latestVersion}`;
}

function parseVersion(version) {
    return String(version)
        .split(".")
        .map((segment) => {
            const match = /^(\d+)([a-z]*)$/i.exec(segment.trim());
            if (!match) {
                return { number: 0, suffix: segment.trim().toLowerCase() };
            }
            return {
                number: Number.parseInt(match[1], 10),
                suffix: match[2].toLowerCase(),
            };
        });
}

function compareVersions(left, right) {
    const leftParts = parseVersion(left);
    const rightParts = parseVersion(right);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = leftParts[index] || { number: 0, suffix: "" };
        const rightPart = rightParts[index] || { number: 0, suffix: "" };

        if (leftPart.number !== rightPart.number) {
            return leftPart.number - rightPart.number;
        }
        if (leftPart.suffix !== rightPart.suffix) {
            return leftPart.suffix.localeCompare(rightPart.suffix);
        }
    }

    return 0;
}

function getVersionManifestUrl() {
    const currentHref =
        window.location && typeof window.location.href === "string"
            ? window.location.href
            : "http://localhost/";
    return new URL(APP_VERSION_FILE, currentHref).href;
}

async function fetchLatestAvailableVersion() {
    if (typeof fetch !== "function") {
        throw new Error("Fetch is unavailable");
    }

    const response = await fetch(getVersionManifestUrl(), {
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
    }

    const payload = await response.json();
    const latestVersion =
        payload && typeof payload.version === "string"
            ? payload.version.trim()
            : "";
    if (!latestVersion) {
        throw new Error("Version payload missing version");
    }

    return latestVersion;
}

async function checkForServiceWorkerUpdate(navigatorRef, latestVersion = APP_VERSION) {
    if (!navigatorRef || !navigatorRef.serviceWorker) {
        setSettingsDataStatus(
            buildVersionStatus("Already up to date.", latestVersion)
        );
        return "handled";
    }

    const registration = await navigatorRef.serviceWorker.getRegistration();
    if (!registration) {
        setSettingsDataStatus("No app update registration was found.", true);
        return "handled";
    }

    if (registration.waiting) {
        applyWaitingUpdate(navigatorRef, registration.waiting, latestVersion);
        return "handled";
    }

    await registration.update();

    if (registration.waiting) {
        applyWaitingUpdate(navigatorRef, registration.waiting, latestVersion);
        return "handled";
    }

    const installingWorker = await waitForInstallingWorker(registration);
    if (installingWorker && navigatorRef.serviceWorker.controller) {
        applyWaitingUpdate(navigatorRef, installingWorker, latestVersion);
        return "handled";
    }

    return "no-worker-update";
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

function waitForInstallingWorker(registration) {
    const installingWorker = registration.installing;
    if (!installingWorker) {
        return Promise.resolve(null);
    }

    if (installingWorker.state === "installed") {
        return Promise.resolve(registration.waiting || installingWorker);
    }

    return new Promise((resolve) => {
        const onStateChange = () => {
            if (installingWorker.state === "installed") {
                cleanup(registration.waiting || installingWorker);
                return;
            }
            if (installingWorker.state === "redundant") {
                cleanup(null);
            }
        };

        const cleanup = (result) => {
            if (typeof installingWorker.removeEventListener === "function") {
                installingWorker.removeEventListener("statechange", onStateChange);
            }
            resolve(result);
        };

        if (typeof installingWorker.addEventListener === "function") {
            installingWorker.addEventListener("statechange", onStateChange);
        }
    });
}

function reloadWhenWorkerControlsPage(navigatorRef) {
    let reloaded = false;
    let fallbackTimer = null;

    const reload = () => {
        if (reloaded) return;
        reloaded = true;
        if (fallbackTimer != null) {
            clearTimeout(fallbackTimer);
        }
        window.location.reload();
    };

    if (
        navigatorRef.serviceWorker &&
        typeof navigatorRef.serviceWorker.addEventListener === "function"
    ) {
        navigatorRef.serviceWorker.addEventListener("controllerchange", reload, {
            once: true,
        });
        fallbackTimer = setTimeout(reload, 1500);
        return;
    }

    reload();
}

function applyWaitingUpdate(navigatorRef, waitingWorker, latestVersion = APP_VERSION) {
    setSettingsDataStatus(
        buildVersionStatus("Update found. Reloading...", latestVersion)
    );
    waitingWorker.postMessage("skipWaiting");
    reloadWhenWorkerControlsPage(navigatorRef);
}

async function handleCheckForUpdates() {
    const navigatorRef = window.navigator;

    try {
        const latestVersion = await fetchLatestAvailableVersion();
        const versionComparison = compareVersions(APP_VERSION, latestVersion);

        if (versionComparison > 0) {
            setSettingsDataStatus(
                buildVersionStatus(
                    "Running a newer app version than this server provides.",
                    latestVersion
                )
            );
            return;
        }

        const serviceWorkerResult = await checkForServiceWorkerUpdate(
            navigatorRef,
            latestVersion
        );
        if (serviceWorkerResult === "handled") {
            return;
        }

        if (versionComparison < 0) {
            setSettingsDataStatus(
                buildVersionStatus("Newer version detected. Reloading...", latestVersion)
            );
            window.location.reload();
            return;
        }

        setSettingsDataStatus(
            buildVersionStatus("Already up to date.", latestVersion)
        );
        return;
    } catch (error) {
        if (error instanceof Error && error.message === "Version check failed: 404") {
            setSettingsDataStatus(
                "Version manifest is not available on this server yet.",
                true
            );
            return;
        }

        setSettingsDataStatus("Could not check for updates right now.", true);
    }
}

export {
    applyImportedData,
    clearSettingsDataStatus,
    handleCheckForUpdates,
    handleRestoreBackup,
    handleStartingLifeChange,
    openExportDataModal,
    openImportDataModal,
    openSettingsModal,
    shareExportData,
};
