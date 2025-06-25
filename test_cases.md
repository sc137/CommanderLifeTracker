
# Manual Test Cases for Commander Life Tracker

## Player Management

### Add a New Player

1.  Click the "+ Player" button.
2.  Click the "New Player" button.
3.  Enter a player name in the input field.
4.  Click the "Save" button.
5.  **Expected Result:** The new player should appear in the list of saved players and be automatically added to the current game.

### Add an Existing Player

1.  Click the "+ Player" button.
2.  Select a player from the list.
3.  Click the "Done" button.
4.  **Expected Result:** The selected player should be added to the current game.

### Remove a Player

1.  Click on a player's tile.
2.  Click the "Remove" button in the context menu.
3.  **Expected Result:** The player should be removed from the current game.

### Set a Default Player

1.  Click the hamburger menu and select "Settings".
2.  Select a player as the default player.
3.  **Expected Result:** The selected player should be marked as the default player.

## Life Tracking

### Increase/Decrease Life

1.  Click the "+1", "+5", "-1", or "-5" buttons on a player's tile.
2.  **Expected Result:** The player's life total should be updated correctly.

## Commander Damage

### Track Commander Damage

1.  Click the commander damage button (⚔️) on a player's tile.
2.  Increase or decrease the commander damage dealt to each opponent.
3.  **Expected Result:** The commander damage should be tracked correctly.

## Poison Counters

### Track Poison Counters

1.  Click the poison counter button (🐍) on a player's tile.
2.  Increase or decrease the number of poison counters.
3.  **Expected Result:** The number of poison counters should be tracked correctly.

## Winner Declaration

### Declare a Winner

1.  Click the declare winner button (🏆) on a player's tile.
2.  Confirm that you want to declare the player as the winner.
3.  **Expected Result:** The game should end, and the selected player should be declared as the winner.

## Game State Persistence

### Reload the Application

1.  Reload the application in your browser.
2.  **Expected Result:** The previous game state (players and life totals) should be restored.

### Start a New Game

1.  Click the "New Game" button.
2.  Confirm that you want to start a new game.
3.  **Expected Result:** The current game should be cleared, and a new game should be started.

## PWA Functionality

### Offline Mode

1.  Disconnect from the internet.
2.  Reload the application.
3.  **Expected Result:** The application should load and function correctly in offline mode.
