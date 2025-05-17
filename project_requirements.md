**Commander Life Tracker: Web App Planning Document**

**1. App Name & Purpose**

*   **Name:** Commander Life Tracker
*   **Purpose:** To allow players of Magic: The Gathering (Commander format) to easily track life totals, commander damage, and poison counters for multiple players during a game. The app will store player names and game history locally.

**2. Target Users & Platform**

*   **Target Users:** Magic: The Gathering players, specifically those playing the Commander format.
*   **Platform:** Mobile-responsive web application.
    *   Works in modern web browsers (desktop and mobile).
    *   Designed to be saved to a mobile device's homescreen (PWA) for quick, full-screen launch.
    *   All functionality must be available offline after the initial load.
    *   All data is stored locally in the browser (e.g., using Local Storage). No internet connection is required for use after initial load.

**3. Core Features**

**A. Game Setup & Player Management**

*   **Starting a New Game:**
    *   A "New Game" button will be prominently displayed to initiate a new game session.
    *   Upon clicking "New Game":
        *   If a "default player" (see Persistent Player List Management) is set in settings, that player is automatically added to the new game.
        *   Otherwise, the game starts with no players, and the user must add them.
*   **Adding Players to a Game:**
    *   A "+ Player" button will be available to add players to the current game.
    *   Clicking "+ Player" will display a list/view of *previously saved player names*.
    *   From this list, the user can:
        *   Select one or more existing saved players to add them to the current game.
        *   Click a "New Player" button.
            *   Clicking "New Player" will open an input field prompting for the new player's name.
            *   Upon submitting the name, this new player is added to the current game *and* their name is automatically saved to the persistent list of players for future use.
    *   The app should comfortably support 4-6 players in a typical game.
*   **Persistent Player List Management (Local Storage):**
    *   **Adding:** New player names are added to this persistent list automatically when a new, unsaved name is entered via the "+ Player" -> "New Player" flow during game setup.
    *   **Removing:** When viewing the list of previously saved names (after clicking "+ Player"), each name in the list will have a mechanism (e.g., a small 'x' icon) to remove that name from the persistent list. Confirmation should be considered.
    *   **Default Player:**
        *   Users can designate one player from their persistent list as a "default player."
        *   This setting is managed via a "Settings" section (accessible from a hamburger menu). It might involve flagging a player in a view of the persistent player list within settings.
        *   This default player is automatically added when a "New Game" is started.

**B. In-Game Player Display & Interaction**

*   **Player Tiles:**
    *   Each player in the game will be represented by a "tile" or "card" on the screen.
    *   Tiles will be arranged in a responsive grid (e.g., using CSS Flexbox or Grid with wrapping).
        *   On smaller screens (e.g., mobile phones), tiles might arrange 2 across.
        *   On larger screens (e.g., tablets, desktops), tiles might arrange 3-4 or more across.
*   **Life Total Management:**
    *   Each player's tile will display their current life total.
    *   Life totals start at 40. This is fixed and not configurable.
    *   Visible buttons for +1, +5, -1, and -5 life will be present on each player's tile for life adjustment. These are the sole methods for changing life totals.
*   **Commander Damage Tracking:**
    *   Each player's tile will provide access to track commander damage taken from each *other* opponent in the game.
    *   Accessing this will likely be via a button/icon on the player's tile (e.g., "Track Commander Damage").
    *   This will open a modal (pop-up window) specific to the selected player (e.g., Player A).
    *   Inside the modal:
        *   A list of all *other active opponents* (e.g., Player B, Player C) will be displayed.
        *   Next to each opponent's name, the current amount of commander damage Player A has taken *from that specific opponent* will be shown.
        *   +1 and -1 buttons will be available next to each opponent's damage total to adjust it.
    *   **Visual Cue for Lethal Commander Damage:** If a player accumulates 21 or more commander damage from any single opponent, their player tile on the main game screen should change visibly (e.g., red background, a slow pulsing effect) to indicate they are defeated by commander damage.
*   **Poison Counter Tracking:**
    *   Each player's tile will always display a small snake icon (or similar) to indicate poison tracking capability. Initially, it will show "0" poison counters next to it.
    *   Tapping the snake icon or the poison count will open a modal (pop-up window).
    *   Inside this modal, +1 and -1 buttons will be available to adjust the number of poison counters for that player.
    *   There will be *no* special visual indicator on the player's tile for lethal poison (10 counters); users will rely on seeing the number.
*   **Marking a Player as "Died" (Eliminated):**
    *   Each active player's tile will have a visible button/icon (e.g., "Mark as Died," a skull icon).
    *   Clicking this button will trigger a confirmation prompt (e.g., "Mark [Player Name] as died?").
    *   Upon confirmation:
        *   The player's tile will visually change (e.g., fade out, become greyed out).
        *   All interactive elements on that player's tile (life buttons, damage tracking access, etc.) will become disabled.
*   **Turn Order (Visual Drag & Drop):**
    *   Player tiles on the screen will be draggable.
    *   Users can rearrange the tiles to visually match the physical turn order of players around the table.
    *   This reordering is purely a visual aid and has no functional impact on game logic or data.

**C. Game Conclusion**

*   **Declaring a Winner:**
    *   Each active player's tile will have a small "Declare Winner" icon (e.g., a trophy).
    *   Clicking this icon will open a confirmation modal (e.g., "Mark [Player Name] as the winner?").
*   **Post-Winner Declaration State:**
    *   Upon confirming a winner:
        *   The game's outcome (winner, players, final life totals, date/time) is automatically logged to the Game History.
        *   All data entry on the current game screen (life changes, damage tracking, etc., for all players) will be frozen/disabled.
        *   The final state of the game (all player tiles, life totals, etc.) will remain visible on the screen.
        *   The user must explicitly click the "New Game" button to clear this state and start a new game.

**D. Game Log / History**

*   **Accessing the Log:**
    *   The Game Log is accessed via an option (e.g., "View Game Log") in a global hamburger menu.
*   **Log Content:**
    *   Each entry in the game log will display:
        *   The name of the winning player.
        *   A list of all players who participated in that game.
        *   The date and time the game was concluded (winner declared).
        *   The final life totals of all players involved in that game.
*   **Deleting Log Entries:**
    *   When viewing the game log, each individual game entry will have a 'delete' mechanism (e.g., a small 'x' or trash can icon) allowing the user to remove that specific entry from the history. Confirmation should be considered.

**E. General App Navigation & Settings**

*   **Hamburger Menu:**
    *   A global hamburger menu will provide access to:
        *   "View Game Log"
        *   "Settings"
*   **Settings:**
    *   The "Settings" screen will allow users to:
        *   Manage their persistent player list, specifically to designate one player as the "default player" (see Persistent Player List Management).

**4. Technical Requirements & UX Considerations**

*   **Technology Stack:** Exclusively HTML5, CSS3, and vanilla JavaScript. No external JavaScript libraries or frameworks (like React, Vue, Angular, jQuery, etc.).
*   **Mobile Responsiveness:** The layout must adapt gracefully to various screen sizes, from small mobile phones to tablets and desktops. The player tile grid is a key area for this.
*   **Offline First & PWA (Progressive Web App):**
    *   The app must be fully functional offline after its initial load.
    *   It should include a Web App Manifest file to enable "Add to Homescreen" functionality on mobile devices, allowing it to launch in a full-screen, app-like manner.
    *   A service worker should be implemented for robust caching of app assets for offline use.
    *   Icon and theme color for PWA can be generic initially.
*   **Data Persistence:** All application data (persistent player list, game log, default player setting) will be stored locally in the user's browser using Local Storage.

**5. User Interface (UI) / User Experience (UX) Notes**

*   **Modals:** Modals will be used for:
    *   Entering/adjusting Commander Damage.
    *   Entering/adjusting Poison Counters.
    *   Confirming a player is "Died."
    *   Confirming a "Winner."
    *   Inputting a new player's name when adding to the persistent list.
*   **Visual Cues:**
    *   Player tiles change appearance for "Died" status.
    *   Player tiles change appearance for lethal (21+) commander damage from a single source.
*   **Simplicity:** The interface should be clean and intuitive, focusing on quick access to core functions during a game.
*   **Direct Manipulation:** Drag-and-drop for player tile reordering.

**6. Summary of Data to be Stored Locally (using Local Storage)**

*   **Persistent Player List:**
    *   An array/list of player objects/strings.
    *   Example: `[{name: "Sable", isDefault: true}, {name: "John", isDefault: false}, ...]`
*   **Game Log:**
    *   An array of game objects.
    *   Example: `[{ winner: "Sable", players: ["Sable", "John", "Doe"], dateTime: "YYYY-MM-DDTHH:MM:SS", finalLifeTotals: [{name: "Sable", life: 15}, {name: "John", life: 0}, ...] }, ...]`
*   **(Implicit) Current Game State:** While a game is active, its state (players, life, damage, etc.) will be managed in JavaScript memory. This state is used to populate the log upon game completion. No separate persistent storage is needed for an *in-progress* game state if the app is closed, unless "resume game" is a future feature (not currently requested).