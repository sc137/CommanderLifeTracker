const APP_VERSION = "0.5.2e";
const APP_VERSION_FILE = "version.json";
const STORAGE_VERSION = 2;
const MAX_UNDO_STACK = 25;

const STORAGE_KEYS = {
    playerList: "cmdrtrackr_players",
    defaultPlayer: "cmdrtrackr_default_player",
    startingLife: "cmdrtrackr_starting_life",
    currentGame: "cmdrtrackr_current_game",
    currentGameBackup: "cmdrtrackr_current_game_backup",
    gameLog: "cmdrtrackr_game_log",
};

const STARTING_LIFE_PRESETS = [20, 30, 40];

const GAME_LIMITS = {
    startingLife: 40,
    maxLife: 999,
    maxPoison: 10,
    maxCommanderDamage: 99,
    commanderLethal: 21,
};

export {
    APP_VERSION_FILE,
    APP_VERSION,
    GAME_LIMITS,
    MAX_UNDO_STACK,
    STARTING_LIFE_PRESETS,
    STORAGE_KEYS,
    STORAGE_VERSION,
};
