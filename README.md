# 🐍 React Snake Game

A modern, responsive version of the classic **Snake Game** built with **React**. Featuring Firebase integration for real-time score saving, custom sound effects with the Web Audio API, and smooth emoji-based animations. Designed for both desktop and mobile users with adaptive performance tweaks.

## 🎮 Live Demo

👉 [Play the game]([https://your-snake-game-link.netlify.app/](https://byte-n-slither.netlify.app/))

## 💡 Features

- ✅ **Built in React** using functional components and hooks
- ✅ **Responsive board size**: Auto-adjusts based on device width (mobile vs. desktop)
- ✅ **Emoji snake head** 🐍 for playful design
- ✅ **Keyboard controls** (WASD + Arrow Keys) with real-time responsiveness
- ✅ **Pause, resume, and restart buttons** with intuitive icons
- ✅ **Collision detection** and **game over animation**
- ✅ **Live score display**, with high score saving via Firebase
- ✅ **Custom sound effects** using Web Audio API
- ✅ **Mobile optimization** for touch performance and layout
- ✅ Lightweight, fast load, and Netlify deployed

## 🛠️ Built With

- **React (useState, useEffect, useRef, useCallback)**
- **Firebase Firestore & Auth** – To store user scores securely
- **Web Audio API** – For dynamic in-game sound control
- **HTML5 + CSS3**
- **JavaScript (ES6+)**
- **GitHub** – Version control
- **Netlify** – Hosting and CI/CD

## 📸 Screenshots

![Start Screen](images/start-screen.jped)  
![Login Screen](images/login-screen.jped)
![Signup Screen](images/signup-screen.jped)
![Gameplay](images/gameplay-screen.jped)
![Leaderboard Screen](images/leaderboard-screen.jped)

## 🧠 Key Concepts Implemented

- Custom **game loop** using `setInterval` and `useRef` for consistent timing
- Efficient **keyboard event handling** and state updates with `useCallback`
- **Grid-based positioning** of snake and food using 2D coordinate logic
- **Game over detection** via self-collision and wall boundaries
- Controlled audio playback via preloaded **AudioBuffer** for latency-free effects
- Firebase Firestore integration for **authenticated user scores** with timestamps

---

Feel free to fork or contribute! 💻🐍  
