# Tekken Input Trainer - AI Prompt Template

This document contains a comprehensive prompt that you can copy and paste into an AI (like ChatGPT, Claude, or Gemini) to have it develop the **Tekken Input Trainer** project for you. 

---

## 🤖 Copy and Paste the Prompt Below:

**System Role / Context:**
You are an expert Full-Stack Developer and UI/UX Designer with a deep understanding of fighting games, specifically the *Tekken* series. Your task is to build a modern, responsive web application called "Tekken Input Trainer." 

**Tech Stack:**
- **Frontend:** React.js (or Next.js)
- **Styling:** Tailwind CSS (for a sleek, dark-mode, arcade-inspired UI)
- **State Management:** React Context or Redux (for handling input streams and frame data states)
- **Game Inputs:** HTML5 Gamepad API (for fight sticks/controllers) and standard Keyboard Event Listeners

**Core Objective:**
Build an interactive training tool that helps Tekken players practice execution, react to specific scenarios, and learn frame data. The app should listen to inputs and translate them into standard Tekken notation in real-time.

**Key Features to Implement:**

1. **Real-Time Input Visualizer & Logger:**
   - Listen to keyboard or Gamepad API inputs.
   - Map standard controls to Tekken notation: directional inputs (`u`, `d`, `f`, `b`, `uf`, `db`, etc.) and attack buttons (`1`=LP, `2`=RP, `3`=LK, `4`=RK).
   - Display a scrolling "command history" identical to the in-game practice mode.
   - Support detection for complex inputs like `qcf` (quarter-circle forward), `EWGF` (Electric Wind God Fist - `f,n,d,df+2`), and simultaneous button presses (e.g., `1+2`).

2. **Frame Data Library:**
   - Create a structured JSON database for character move lists.
   - For each move, include: `Command`, `Hit Level` (High/Mid/Low), `Damage`, `Startup Frames`, `Block Advantage`, `Hit Advantage`, and `Counter Hit Advantage`.
   - Build a searchable UI component to display this frame data nicely.

3. **Punishment Trainer Mode:**
   - The app displays an opponent's move that is unsafe on block (e.g., -15 frames).
   - The user must input the correct optimal punish for their selected character within a strict timing window.
   - Provide visual/audio feedback: "Success", "Too Slow", or "Wrong Input".

4. **Reaction & Throw Break Trainer Mode:**
   - Visual cues appear on screen simulating attacks (e.g., an icon for a `1+2` throw, or a low sweep).
   - The user must input the correct defensive response (e.g., pressing `1+2` to break the throw, or holding `db` to block the low) within the correct startup frame window (e.g., 20 frames).

5. **Combo Trial / Execution Mode:**
   - Allow users to select or create a custom predefined combo.
   - The screen displays the required inputs.
   - The app tracks the user's inputs and validates if the combo was executed correctly, calculating the frame gaps between button presses to ensure it's a true combo.

**Design & UI Requirements:**
- **Aesthetic:** Dark mode by default, vibrant neon accents (arcade vibes), highly legible typography for move inputs and frame data.
- **Layout:** 
  - Sidebar/Navbar for navigation (Modes: Input Logger, Punishment Trainer, Frame Data, Settings).
  - Main central area for the active training mode.
  - Bottom horizontal bar for the live input command history.
- **Responsive:** Ensure the UI works well on desktop (for training) and mobile (for reviewing frame data on the go).

**Initial Tasks for You (The AI):**
1. Generate the initial project structure and necessary configuration files.
2. Create the mock JSON structure for the frame data (give me an example with 2 characters, like Kazuya and Paul).
3. Write the core React hook (`useInputHandling.js`) that captures keyboard/gamepad events and translates them into Tekken notation.
4. Provide the code for the main Dashboard UI integrating the live input logger.

Please provide the code in clear, modular blocks, starting with the setup and core logic.
