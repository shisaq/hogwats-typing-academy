# Hogwats Typing Academy

[中文说明](./README.zh-CN.md)

Hogwats Typing Academy is a Harry Potter inspired typing game I made for my 8-year-old daughter.

She loves the magical world of Hogwarts, so I turned typing practice into a small academy-style adventure: choose a user, get sorted into a house, type magical words, unlock harder levels, and build keyboard confidence one spell at a time.

## How To Play

1. Create or choose a player profile.
2. Tell the Sorting Hat a little about yourself and receive a house.
3. Start the typing challenge.
4. Type each word exactly as shown.
5. Use the hint button when you need help.
6. Finish the level to see your score, speed, accuracy, and streak.
7. Keep practicing to unlock harder word lists.

The game saves progress locally in the browser, so each player can come back and continue from their own level.

## Features

- Magical academy theme for kids who enjoy Harry Potter style adventures
- Sorting Hat house assignment
- Ten levels of typing challenges with increasing difficulty
- Word hints and voice-style feedback
- Score, WPM, accuracy, and streak tracking
- Virtual keyboard display for learning key positions
- Multiple local player profiles
- Local browser storage, with no account or backend required

## Local Development

Prerequisites: Node.js

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

This project is configured for Vercel.

- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite

Import the GitHub repository in Vercel and deploy.
