# Cursor Prompts for Full English App Conversion

Use these prompts sequentially to build the complete application logic and UI.

## Phase 1: Backend Foundation (Gamification & Data)

### 1. Update User Schema (Deep)
**Context**: Open `src/models/User.js`
**Prompt**:
```text
Update the User model to support the English Learning App requirements.
Add these fields:
1. `mobile`: String, unique, sparse (for OTP login).
2. `points`: Number, default 0.
3. `coins`: Number, default 0 (for rewards).
4. `membershipLevel`: Enum ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'], default 'FREE'.
5. `unlockedLevels`: Array of strings, default ['FREE'].
6. `streaks`: Object {
     free: { current: 0, max: 0, lastActive: Date },
     bronze: { current: 0, max: 0, lastActive: Date },
     silver: { current: 0, max: 0, lastActive: Date }
   }
7. `dailyProgress`: Array of Objects { date: Date, activitiesCompleted: [ObjectId], score: Number }.
```

### 2. Create Daily Content Schema
**Context**: Create `src/models/DailyContent.js`
**Prompt**:
```text
Create a robust `DailyContent` model.
Fields:
- `type`: Enum ['WORD', 'PHRASE', 'STORY', 'VOCAB_SET', 'CONVERSATION', 'PUZZLE', 'SCENE', 'SPEECH', 'LYRICS', 'FEED'].
- `date`: Date (indexed).
- `level`: Enum ['FREE', 'BRONZE', 'SILVER', 'GOLD'].
- `title`: String.
- `metadata`: Mixed Object.
  - For WORD/PHRASE: { text, meaning_en, meaning_hi, audio, examples: [{en, hi, audio}], synonyms, antonyms }
  - For STORY: { title, audio, text_content, moral_en, moral_hi, keywords: [{word, meaning_hi}] }
  - For CONVERSATION: { participants: [String], dialogue: [{speaker, text_en, text_hi, audio}] }
  - For PUZZLE: { question, options, correct_idx, explanation }
```

### 3. Gamification Service (The Brain)
**Context**: Create `src/services/GamificationService.js`
**Prompt**:
```text
Create `GamificationService` to handle the app's core logic:
1. `recordActivity(userId, contentId, score)`:
   - Check if already completed today.
   - If not, add points (10pts).
   - Update `streaks[user.level].current`.
   - Update `user.lastActiveDate`.
   
2. `checkLevelUp(userId)`:
   - READ CAREFULLY:
   - If User is FREE and Streak >= 30, unlock BRONZE.
   - If User is BRONZE and Streak >= 60, unlock SILVER.
   - Return `{ upgraded: boolean, newLevel: string }`.
```

## Phase 2: Frontend Core (UI & Flows)

### 4. Create Pre-Load & Welcome Component
**Context**: Create `src/pages/PreLoadScreen.tsx`
**Prompt**:
```text
Create a `PreLoadScreen` component.
- Display a full-screen animation (use a placeholder Lottie or image).
- Fetch a "Daily Quote" from a new API `/api/daily-quote`.
- Show dynamic text: "Welcome back to the world of opportunities".
- If user is logged in -> Redirect to `/dashboard`.
- If not -> Redirect to `/login` (or show Login/Register buttons).
```

### 5. Interactive "Word of the Day" Component
**Context**: Create `src/components/learning/WordOfTheDayCard.tsx`
**Prompt**:
```text
Create a feature-rich card for "Word of the Day".
Props: `data` (DailyContent object).
UI:
- Large Word Display.
- Audio Button (use generic TTS or `new Audio(url)`).
- Tabs for "Meaning", "Examples", "Synonyms".
- **Interaction Section**:
  - Input field: "Make a sentence with this word".
  - Submit Button.
  - On submit -> Call API `/api/submit-sentence`.
  - Show confetti on success.
```

### 6. Interactive "Conversation" Component (WhatsApp Style)
**Context**: Create `src/components/learning/ConversationView.tsx`
**Prompt**:
```text
Create a Chat-style UI for learning conversations.
Props: `dialogue` (Array of {speaker, text, audio}).
UI:
- Render bubbles like WhatsApp (Left/Right based on speaker).
- Tap a bubble to play audio and toggle Hindi translation.
- "Roleplay Mode" toggle: Hide one speaker's text so user can practice speaking.
```

### 7. The New Home Dashboard
**Context**: Modify `src/pages/HomePage.tsx`
**Prompt**:
```text
Refactor `HomePage.tsx` to be the User Dashboard.
UI Layout:
1. **Header**: User Name, Current Level Badge, Points, Streak Fire Icon.
2. **Progress Section**:
   - Linear Progress Bar: "Day 12 of 30 for Bronze Unlock".
   - Text: "18 days to go! Keep it up."
3. **Daily Tasks (Grid)**:
   - Filtered by user's Unlocked Levels.
   - Word of Day (Free)
   - Story (Bronze - Locked or Unlocked)
   - Conversation (Silver - Locked or Unlocked)
   - Click handlers to open the respective Activity Components.
```

## Phase 3: Admin & Management

### 8. Content Management Screens
**Context**: Create `src/pages/admin/DailyContentManager.tsx`
**Prompt**:
```text
Create an Admin page to manage Daily Content.
- Calendar View to see scheduled content.
- "Add New Content" Modal.
- Dropdown to select Type (Word, Story, etc.).
- Dynamic Form based on Type selection (e.g., if Word -> show Meaning inputs; if Story -> show Text Area).
```
