**Commander Life Tracker: Development TODO List (for LLM Prompts)**

**Phase I: Core Structure & Initial Player Setup UI**

1.  **HTML: Basic Page Structure** ✅
    *   **Prompt:** "Generate the basic HTML5 structure for the 'Commander Life Tracker' app. It should include:
        *   A `header` (e.g., for the app title and a hamburger menu icon placeholder).
        *   A `main` content area where player tiles will go.
        *   A section (initially hidden) for a modal overlay.
        *   Placeholders for where JavaScript files will be linked."
    *   Reference: General app structure, PWA requirements.

2.  **CSS: Basic Styling & Variables** ✅
    *   **Prompt:** "Create a basic CSS file. Include:
        *   A CSS reset or normalize.
        *   Basic body styling (e.g., background color, font family).
        *   CSS variables for primary colors, fonts, and spacing (we can define these later, just set up placeholders).
        *   Basic styling for the `header` and `main` areas."
    *   Reference: General app structure.

3.  **HTML & CSS: Hamburger Menu Shell** ✅
    *   **Prompt:** "Generate HTML for a hamburger menu icon (e.g., three horizontal lines) within the header. Also, create the HTML structure for a slide-out/overlay menu panel (initially hidden). This panel should have placeholder links for 'View Game Log' and 'Settings'."
    *   **Prompt (CSS):** "Write CSS to style the hamburger icon and the menu panel. The panel should be hidden by default and toggle visibility. Style the placeholder links."
    *   Reference: "Hamburger Menu" and "Accessing the Log", "Settings".

4.  **HTML & CSS: "New Game" and "+ Player" Buttons** ✅
    *   **Prompt:** "Generate HTML for a 'New Game' button and a '+ Player' button. These should be clearly visible, perhaps in a control bar area or directly in the main content area if no game is active."
    *   **Prompt (CSS):** "Style the 'New Game' and '+ Player' buttons for good visibility and clickability."
    *   Reference: "Starting a New Game", "Adding Players to a Game".

5.  **HTML & CSS: Add Player View/Modal (Showing Saved Players)** ✅
    *   **Prompt:** "Design the HTML structure for a view/modal that appears when '+ Player' is clicked. This view should:
        *   Have a title like 'Add Player'.
        *   Contain a list area where previously saved players will be displayed.
        *   Include a 'New Player' button.
        *   Include a 'Close' or 'Done' button."
    *   **Prompt (CSS):** "Style this 'Add Player' view/modal. Make the list area scrollable if many players exist. Style the 'New Player' button and the list items (placeholder for now)."
    *   Reference: "Adding Players to a Game".

6.  **HTML & CSS: New Player Name Input Modal** ✅
    *   **Prompt:** "Design the HTML structure for a modal that appears when the 'New Player' button (from the Add Player View) is clicked. This modal should:
        *   Have a title like 'Enter New Player Name'.
        *   Contain a text input field for the player's name.
        *   Have 'Save' and 'Cancel' buttons."
    *   **Prompt (CSS):** "Style this 'New Player Name Input' modal."
    *   Reference: "Adding Players to a Game".

**Phase II: JavaScript Logic - Player Management & Storage**

7.  **JS: Local Storage Utilities for Players** ✅
    *   **Prompt:** "Write JavaScript functions for managing a persistent list of players in Local Storage:
        *   `savePlayer(playerName)`: Adds a new player name. Ensure no duplicates.
        *   `getSavedPlayers()`: Returns an array of saved player names.
        *   `removePlayer(playerName)`: Removes a player name.
        *   `setDefaultPlayer(playerName)`: Sets a player as default (store this preference).
        *   `getDefaultPlayer()`: Gets the default player's name.
        *   `isPlayerDefault(playerName)`: Checks if a player is the default."
    *   Reference: "Persistent Player List Management".

8.  **JS: Populate Saved Players List UI** ✅
    *   **Prompt:** "Write JavaScript to:
        *   When the 'Add Player' view is shown, call `getSavedPlayers()` and dynamically populate the list area with player names.
        *   Each player name in the list should have a small 'x' icon next to it. Clicking 'x' should prompt for confirmation, then call `removePlayer()` and refresh the list."
    *   Reference: "Adding Players to a Game", "Persistent Player List Management".

9.  **JS: Add New Player Logic** ✅
    *   **Prompt:** "Write JavaScript for the 'New Player Name Input' modal:
        *   When 'Save' is clicked, get the name from the input.
        *   Call `savePlayer()` with the new name.
        *   Close the 'New Player Name Input' modal.
        *   Refresh the saved players list in the 'Add Player' view.
        *   (Later, this will also add the player to the current game)."
    *   Reference: "Adding Players to a Game".

10. **JS: Current Game Player Management** ✅
    *   **Prompt:** "Write JavaScript to manage players in the *current game* (in-memory array, not directly in local storage for the game itself yet):
        *   `addPlayerToGame(playerName)`: Adds a player to an internal list/array for the current game.
        *   `removePlayerFromGame(playerName)`: Removes a player from the current game list.
        *   `getCurrentGamePlayers()`: Returns the list of players in the current game."
    *   Reference: "Adding Players to a Game", General game flow.

11. **JS: Link "Add Player" View to Current Game** ✅
    *   **Prompt:** "Modify the JavaScript for the 'Add Player' view:
        *   When a player is selected from the list of saved players (or a new player is saved), call `addPlayerToGame(playerName)`.
        *   Update the main game UI to display the new player's tile (we'll define the tile next)."
    *   Reference: "Adding Players to a Game".

**Phase III: Game Area - Player Tiles & Core Gameplay**

12. **HTML & CSS: Player Tile Structure** ✅
    *   **Prompt:** "Generate HTML for a single player 'tile'. It should include placeholders/elements for:
        *   Player Name.
        *   Life Total display (default 40).
        *   Buttons: +1, -1, +5, -5 life.
        *   A button/icon to trigger Commander Damage modal.
        *   A snake icon and a '0' for poison counters.
        *   A 'Mark as Died' button/icon.
        *   A 'Declare Winner' (trophy) icon."
    *   **Prompt (CSS):** "Style this player tile. Make it look like a distinct card. Ensure buttons are clear and tap-friendly. Style the responsive grid container that will hold these tiles (e.g., using Flexbox or CSS Grid to achieve 2-across on mobile, more on larger screens)."
    *   Reference: "In-Game Player Display & Interaction", "Player Tiles", "Life Total Management", etc.

13. **JS: Dynamically Create and Display Player Tiles** ✅
    *   **Prompt:** "Write JavaScript that, whenever `addPlayerToGame(playerName)` is called, dynamically creates a new player tile (using the HTML structure from prompt 12), populates the player's name, and appends it to the main game grid."
    *   Reference: "Player Tiles".

14. **JS: Life Total Logic** ✅
    *   **Prompt:** "Write JavaScript for the life total buttons on a player tile:
        *   When +1, -1, +5, or -5 is clicked, update the player's life total in an internal data structure (e.g., an object for that player).
        *   Update the life total display on their tile.
        *   Ensure life total starts at 40 when a player is added."
    *   Reference: "Life Total Management".

15. **HTML & CSS: Commander Damage Modal** ✅
    *   **Prompt:** "Design the HTML for the Commander Damage modal. When opened for Player A, it should:
        *   Display Player A's name (e.g., 'Commander Damage for Player A').
        *   List each *other* active player (Opponent B, Opponent C).
        *   Next to each opponent, show current commander damage taken from them (initially 0) and +1/-1 buttons.
        *   A 'Close' or 'Done' button."
    *   **Prompt (CSS):** "Style this Commander Damage modal."
    *   Reference: "Commander Damage Tracking".

16. **JS: Commander Damage Logic** ✅
    *   **Prompt:** "Write JavaScript for Commander Damage:
        *   Store commander damage data (e.g., `playerA.commanderDamageFrom.playerB = 5`).
        *   When the Commander Damage modal is opened for a player, populate it with current opponents and their respective damage values.
        *   Handle +1/-1 clicks in the modal to update the internal data and the modal's display.
        *   If total commander damage from one source reaches 21+, add a specific CSS class to the affected player's *main tile* to trigger the visual cue (e.g., red background)."
    *   Reference: "Commander Damage Tracking".

17. **HTML & CSS: Poison Counter Modal** ✅
    *   **Prompt:** "Design the HTML for the Poison Counter modal. It should:
        *   Display the player's name (e.g., 'Poison Counters for Player A').
        *   Show the current poison count.
        *   Have +1/-1 buttons.
        *   A 'Close' or 'Done' button."
    *   **Prompt (CSS):** "Style this Poison Counter modal."
    *   Reference: "Poison Counter Tracking".

18. **JS: Poison Counter Logic** ✅
    *   **Prompt:** "Write JavaScript for Poison Counters:
        *   Store poison counters per player.
        *   When the snake icon on a tile is clicked, open the Poison Counter modal and populate it with the player's current poison count.
        *   Handle +1/-1 clicks in the modal to update the internal data and the modal's display.
        *   Update the poison count display next to the snake icon on the main player tile."
    *   Reference: "Poison Counter Tracking".

19. **JS: "Mark as Died" Logic** ✅
    *   **Prompt:** "Write JavaScript for the 'Mark as Died' button:
        *   On click, show a confirmation modal (e.g., 'Mark [Player Name] as died? Yes/No').
        *   If confirmed, add a CSS class to the player's tile to fade it out/grey it out.
        *   Disable all buttons/interactive elements on that player's tile."
    *   Reference: "Marking a Player as 'Died'".

20. **JS: Drag and Drop Player Tiles** ✅
    *   **Prompt:** "Implement JavaScript for drag-and-drop reordering of player tiles within the main game grid. This is for visual turn order only and doesn't need to affect game logic."
    *   (This is a more complex one; you might need to guide the LLM on using native HTML5 Drag and Drop API).
    *   Reference: "Turn Order (Visual Drag & Drop)".

**Phase IV: Game End & History**

21. **JS: "Declare Winner" Logic** ✅
    *   **Prompt:** "Write JavaScript for the 'Declare Winner' (trophy) icon on player tiles:
        *   On click, show a confirmation modal (e.g., 'Mark [Player Name] as winner? Yes/No').
        *   If confirmed:
            *   Call a function to log the game (to be defined).
            *   Freeze all inputs on the game screen (disable all buttons on all player tiles).
            *   The game state should remain visible."
    *   Reference: "Declaring a Winner", "Post-Winner Declaration State".

22. **JS: Game Logging Utilities** ✅
    *   **Prompt:** "Write JavaScript functions for game logging to Local Storage:
        *   `logGame(winnerName, playersInGame, finalLifeTotals)`: Creates a game log object (including current date/time) and saves it to an array in Local Storage.
        *   `getGameLog()`: Retrieves all game log entries.
        *   `deleteGameLogEntry(gameId)`: Deletes a specific game log entry (you'll need a way to identify entries, maybe by timestamp or an index)."
    *   Reference: "Game Log / History", "Log Content".

23. **HTML & CSS: Game Log View** ✅
    *   **Prompt:** "Design the HTML structure for the Game Log view (accessed from hamburger menu). It should:
        *   Have a title like 'Game History'.
        *   Display a list where each item represents a logged game.
        *   Each game entry should show: Winner, all players, date/time, final life totals.
        *   Each entry should have a 'delete' icon."
    *   **Prompt (CSS):** "Style the Game Log view and its entries."
    *   Reference: "Game Log / History".

24. **JS: Display Game Log** ✅
    *   **Prompt:** "Write JavaScript to:
        *   When 'View Game Log' is clicked, fetch data using `getGameLog()`.
        *   Dynamically populate the Game Log view with the entries.
        *   Implement the 'delete' icon functionality for each entry (with confirmation), calling `deleteGameLogEntry()` and refreshing the log display."
    *   Reference: "Accessing the Log", "Deleting Log Entries".

**Phase V: Settings & PWA**

25. **HTML & CSS: Settings View** ✅
    *   **Prompt:** "Design the HTML for the Settings view (accessed from hamburger menu). It should:
        *   Have a title like 'Settings'.
        *   List all persistently saved players (from `getSavedPlayers()`).
        *   Next to each player, have an option (e.g., a radio button or a 'Set as Default' button) to designate them as the default player."
    *   **Prompt (CSS):** "Style the Settings view."
    *   Reference: "Persistent Player List Management (Default Player)", "Settings".

26. **JS: Settings Logic (Default Player)** ✅
    *   **Prompt:** "Write JavaScript for the Settings view:
        *   Populate the list of saved players.
        *   Highlight the currently set default player.
        *   When a new default player is selected, call `setDefaultPlayer()` and update the UI."
    *   Reference: "Persistent Player List Management (Default Player)".

27. **JS: "New Game" Button Logic (Full)** ✅
    *   **Prompt:** "Finalize the 'New Game' button JavaScript:
        *   Clear any current game state (remove player tiles, reset internal game data).
        *   Call `getDefaultPlayer()`. If a default player exists, call `addPlayerToGame()` for them and create their tile.
        *   Unfreeze UI elements if they were frozen from a previous game."
    *   Reference: "Starting a New Game".

28. **PWA: Manifest File** ✅
    *   **Prompt:** "Create a `manifest.json` file for this PWA. Include:
        *   `short_name`, `name`
        *   `icons` (placeholder for now, or specify a simple one)
        *   `start_url` (e.g., `/index.html`)
        *   `display: 'fullscreen'`
        *   `background_color`, `theme_color` (can be generic)."
    *   Reference: "Offline First & PWA".

29. **PWA: Service Worker for Caching** ✅
    *   **Prompt:** "Create a basic `service-worker.js` file. It should:
        *   Cache essential app assets (HTML, CSS, JS files, any core images) on install.
        *   Serve cached assets when offline (Cache First or Network First strategy)."
    *   Reference: "Offline First & PWA".

30. **HTML & JS: Register Service Worker** ✅
    *   **Prompt:** "Add JavaScript to `index.html` (or a main JS file) to register the service worker."
    *   Reference: "Offline First & PWA".

**Phase VI: General UX and Polish**

31. **JS: Modal Handling** ✅
    *   **Prompt:** "Create generic JavaScript functions to show/hide modals. Modals should probably overlay the content and prevent interaction with the background."
    *   This can be used for Commander Damage, Poison, New Player Name, Confirmations, etc.

32. **CSS: Responsiveness & Polish** ✅
    *   **Prompt:** "Review all CSS. Ensure the layout is responsive across mobile, tablet, and desktop. Add smooth transitions for modal appearances, button clicks, tile fading, etc. Refine typography and spacing for readability."
    *   This is an iterative step.
