# Commander Life Tracker: LLM Development Prompts

## Phase I: Core Structure & Initial Player Setup UI

### 1. Basic HTML Structure
Create the initial HTML5 structure for the Commander Life Tracker app. The structure should:
- Include proper HTML5 doctype and meta tags
- Have a responsive viewport meta tag
- Include a header section with:
  - App title "Commander Life Tracker"
  - Hamburger menu icon (three horizontal lines)
- Main content area with:
  - Container for player tiles (initially empty)
  - "New Game" button
  - "+ Player" button
- Modal overlay section (initially hidden)
- Link to CSS and JavaScript files
- Include manifest.json link for PWA support
- Include service worker registration script

### 2. Basic CSS Styling
Create the initial CSS styling for the app. Include:
- CSS reset/normalize
- CSS variables for:
  - Colors (primary, secondary, background, text)
  - Font families (system fonts)
  - Spacing units
  - Border radius
  - Shadow values
- Basic layout styles:
  - Full viewport height
  - Clean background
  - Proper font sizing
  - Header styling
  - Main content area styling
- Mobile-first responsive design
- Basic button styling
- Modal overlay styling

### 3. Hamburger Menu Implementation
Create the hamburger menu functionality:
- Style the hamburger icon (three lines)
- Create a slide-out/overlay menu panel with:
  - "View Game Log" link
  - "Settings" link
- Add CSS for:
  - Menu panel positioning
  - Slide-out animation
  - Overlay background
  - Link styling
- Add JavaScript for:
  - Toggle menu visibility
  - Close menu when clicking outside
  - Handle menu item clicks

### 4. Game Control Buttons
Create the "New Game" and "+ Player" buttons:
- Style buttons to be prominent and easily clickable
- Add hover and active states
- Ensure mobile-friendly touch targets
- Position buttons appropriately in the layout
- Add basic click handlers (functionality to be implemented later)

### 5. Add Player Modal
Create the modal for adding players:
- Design modal structure with:
  - Title "Add Player"
  - Scrollable list area for saved players
  - "New Player" button
  - "Close" button
- Style the modal with:
  - Clean, modern appearance
  - Proper spacing
  - Scrollable area for player list
  - Responsive design
- Add basic show/hide functionality

### 6. New Player Input Modal
Create the modal for entering new player names:
- Design modal structure with:
  - Title "Enter New Player Name"
  - Text input field
  - "Save" and "Cancel" buttons
- Style the modal with:
  - Clean, modern appearance
  - Proper input field styling
  - Responsive design
- Add basic show/hide functionality

## Phase II: JavaScript Logic - Player Management & Storage

### 7. Local Storage Player Management
Create JavaScript functions for managing players in Local Storage:
```javascript
// Required functions:
savePlayer(playerName) // Add new player, prevent duplicates
getSavedPlayers() // Return array of saved players
removePlayer(playerName) // Remove player
setDefaultPlayer(playerName) // Set default player
getDefaultPlayer() // Get default player
isPlayerDefault(playerName) // Check if player is default
```

### 8. Saved Players List UI
Create JavaScript to manage the saved players list UI:
- Populate list when modal opens
- Add delete (x) icon next to each player
- Implement delete confirmation
- Refresh list after changes
- Handle empty state

### 9. New Player Logic
Create JavaScript for handling new player creation:
- Validate player name input
- Save to Local Storage
- Update UI
- Handle errors
- Close modal after success

### 10. Current Game Player Management
Create JavaScript for managing current game players:
```javascript
// Required functions:
addPlayerToGame(playerName)
removePlayerFromGame(playerName)
getCurrentGamePlayers()
```

### 11. Player Selection Logic
Create JavaScript to handle player selection:
- Handle selection from saved players list
- Handle new player creation
- Update current game state
- Update UI
- Handle errors

## Phase III: Game Area - Player Tiles & Core Gameplay

### 12. Player Tile Structure
Create the HTML and CSS for player tiles:
- Design tile structure with:
  - Player name
  - Life total (40)
  - Life adjustment buttons (+1, -1, +5, -5)
  - Commander damage button
  - Poison counter display
  - "Mark as Died" button
  - "Declare Winner" button
- Style tiles with:
  - Card-like appearance
  - Responsive layout
  - Clear button styling
  - Mobile-friendly touch targets

### 13. Dynamic Player Tile Creation
Create JavaScript for dynamic tile creation:
- Generate tile HTML
- Add event listeners
- Update UI
- Handle player removal
- Maintain tile order

### 14. Life Total Management
Create JavaScript for life total functionality:
- Track life totals
- Update display
- Handle life changes
- Validate life values
- Update UI

### 15. Commander Damage Modal
Create the commander damage tracking interface:
- Design modal structure
- List opponents
- Show damage totals
- Add adjustment buttons
- Style appropriately

### 16. Commander Damage Logic
Create JavaScript for commander damage:
- Track damage per opponent
- Update displays
- Handle damage changes
- Check for lethal damage (21+)
- Update visual indicators

### 17. Poison Counter Modal
Create the poison counter interface:
- Design modal structure
- Show current count
- Add adjustment buttons
- Style appropriately

### 18. Poison Counter Logic
Create JavaScript for poison counters:
- Track poison counts
- Update displays
- Handle counter changes
- Update UI

### 19. Player Death Logic
Create JavaScript for marking players as dead:
- Show confirmation
- Update visual state
- Disable interactions
- Handle UI updates

### 20. Tile Reordering
Implement drag-and-drop functionality using the HTML5 Drag and Drop API:
- Add draggable="true" attribute to player tiles
- Implement dragstart event handler to:
  - Set dataTransfer.setData() with player ID
  - Add dragging class for visual feedback
- Implement dragover event handler to:
  - Prevent default to allow drop
  - Add visual indicator for drop target
- Implement drop event handler to:
  - Get dragged player ID from dataTransfer
  - Calculate new position
  - Update DOM order
  - Remove dragging class
- Implement dragend event handler to:
  - Remove dragging class
  - Update visual state
- Add CSS for:
  - Dragging state
  - Drop target indicators
  - Smooth transitions

## Phase IV: Game End & History

### 21. Winner Declaration
Create JavaScript for declaring winners:
- Show confirmation
- Log game data
- Freeze game state
- Update UI

### 22. Game Logging
Create JavaScript for game history:
```javascript
// Required functions:
logGame(winnerName, playersInGame, finalLifeTotals)
getGameLog()
deleteGameLogEntry(gameId)
```

### 23. Game Log View
Create the game history interface:
- Design log structure
- Show game details
- Add delete functionality
- Style appropriately

### 24. Game Log Display
Create JavaScript for displaying game history:
- Load log data
- Populate view
- Handle deletions
- Update UI

## Phase V: Settings & PWA

### 25. Settings Interface
Create the settings view:
- Design settings structure
- List saved players
- Add default player selection
- Style appropriately

### 26. Settings Logic
Create JavaScript for settings:
- Load saved players
- Handle default player selection
- Update Local Storage
- Update UI

### 27. New Game Logic
Create JavaScript for starting new games:
- Clear current game
- Add default player
- Reset UI
- Handle state

### 28. PWA Manifest
Create manifest.json:
- Set app name
- Define icons
- Set display mode
- Configure colors
- Set start URL

### 29. Service Worker
Create service-worker.js with the following caching strategy:
- On install:
  - Cache core assets (HTML, CSS, JS)
  - Cache app shell
- On fetch:
  - Use Cache First strategy for core assets
  - Use Network First strategy for API calls
  - Fall back to cached version if offline
- On activate:
  - Clean up old caches
  - Update cache version
- Cache versioning:
  - Use timestamp or version number
  - Handle cache updates
- Error handling:
  - Log cache errors
  - Provide fallback content

### 30. Service Worker Registration
Add service worker registration:
- Check for support
- Register worker
- Handle updates
- Manage lifecycle

## Phase VI: General UX and Polish

### 31. Modal System
Create a generic modal system:
- Show/hide functionality
- Backdrop handling
- Animation
- Focus management
- Accessibility

### 32. Final Polish
Review and enhance the app:
- Check responsiveness
- Add animations
- Improve typography
- Enhance accessibility
- Optimize performance
