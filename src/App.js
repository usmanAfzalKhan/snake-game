// Import routing tools and core components
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SnakeGame from './components/SnakeGame';
import StatsPage from './pages/StatsPage';
import Login from './pages/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

// Firebase setup
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

// React core hooks
import { useEffect, useState, useRef } from 'react';

function App() {
  // App-wide states
  const [currentUser, setCurrentUser] = useState(null); // Authenticated and verified user
  const [firebaseUser, setFirebaseUser] = useState(null); // Raw Firebase user object
  const [userName, setUserName] = useState(''); // Display name fetched from Firestore
  const [pendingVerification, setPendingVerification] = useState(false); // Is user waiting to verify email?
  const [countdownTime, setCountdownTime] = useState(0); // Timer for resending email (in seconds)
  const [loginStarted, setLoginStarted] = useState(false); // Whether user has clicked 'Get Started'
  const countdownRef = useRef(null); // To store the countdown interval ID

  // Countdown timer logic: starts and ticks down from `initialTime`
  const startCountdown = (initialTime) => {
    clearInterval(countdownRef.current);
    setCountdownTime(initialTime);
    countdownRef.current = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          localStorage.removeItem('resendCountdownStart');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);

        if (user.emailVerified) {
          // User is verified
          setCurrentUser(user);
          setPendingVerification(false);

          // Fetch display name from Firestore
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserName(docSnap.data().name);
          }
        } else {
          // User is not verified
          setPendingVerification(true);
          setCurrentUser(null);
          setUserName('');

          // If a countdown was saved previously, resume it
          const savedTimestamp = localStorage.getItem('resendCountdownStart');
          if (savedTimestamp) {
            const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
            const remaining = 3600 - elapsed;
            if (remaining > 0) {
              startCountdown(remaining);
            } else {
              localStorage.removeItem('resendCountdownStart');
            }
          }

          // Poll every 3 seconds to see if user has verified their email
          const interval = setInterval(async () => {
            await user.reload();
            if (auth.currentUser?.emailVerified) {
              clearInterval(interval);
              window.location.reload();
            }
          }, 3000);

          return () => clearInterval(interval);
        }
      } else {
        // No user signed in
        setCurrentUser(null);
        setFirebaseUser(null);
        setPendingVerification(false);
        setUserName('');
      }
    });

    // Listen for "start-countdown" event from Login.js
    const trigger = () => startCountdown(3600);
    window.addEventListener('start-countdown', trigger);

    // Cleanup
    return () => {
      clearInterval(countdownRef.current);
      unsubscribe();
      window.removeEventListener('start-countdown', trigger);
    };
  }, []);

  // Handles the resend verification email + starts timer
  const handleResend = async () => {
    if (firebaseUser && countdownTime === 0) {
      try {
        await sendEmailVerification(firebaseUser);
        const startTime = Date.now();
        localStorage.setItem('resendCountdownStart', startTime.toString());
        startCountdown(3600);
      } catch (error) {
        console.error('Error resending verification:', error);
      }
    }
  };

  // Format seconds to MM:SS for countdown display
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Top navbar with logo and user dropdown */}
        <Header
          userName={userName}
          showMenu={!!currentUser}
          setLoginStarted={setLoginStarted}
        />

        <main className="main-content">
          {/* Show verification message if user is not verified */}
          {pendingVerification ? (
            <div className="game-container">
              <h2>📧 Please Verify Your Email</h2>
              <p>
                We’ve sent a verification email to your inbox. Please click the link to verify and then log in again.
              </p>
              <p><em>(Check your spam folder if you don't see it)</em></p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={countdownTime > 0}
                  style={{ marginBottom: '6px', opacity: countdownTime > 0 ? 0.5 : 1 }}
                >
                  Resend Verification Email
                </button>

                {countdownTime > 0 && (
                  <p style={{ fontSize: '14px', color: '#ccc' }}>
                    ⏳ Resend in {formatTime(countdownTime)}
                  </p>
                )}

                {countdownTime === 0 && (
                  <p style={{ fontSize: '14px', color: '#8fff8f', marginTop: '8px' }}>
                    ✅ You can now resend the email.
                  </p>
                )}

                {countdownTime > 0 && (
                  <p style={{ fontSize: '14px', color: '#ccc', marginTop: '8px' }}>
                    📬 Verification link expires in {formatTime(countdownTime)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // User is either not logged in or verified
            <Routes>
              <Route
                path="/"
                element={
                  currentUser ? (
                    // Logged in + verified → show game
                    <div className="game-container">
                      <h1>Welcome, {userName}</h1>
                      <p>
                        Eat apples, grow your snake, and don’t crash into walls or yourself!
                        Each game earns you points — try to beat your high score and climb the global leaderboard.
                      </p>
                      <SnakeGame />
                    </div>
                  ) : (
                    // Not logged in → show Login/Register component
                    <Login loginStarted={loginStarted} setLoginStarted={setLoginStarted} />
                  )
                }
              />

              {/* Stats route for leaderboard view */}
              <Route
                path="/stats"
                element={<StatsPage userId={currentUser?.uid} />}
              />
            </Routes>
          )}
        </main>

        {/* Footer stays fixed */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
