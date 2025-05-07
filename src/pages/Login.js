// Login.js
// This component handles both login and registration flows, including password reset

import React from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail, // ✅ Firebase method to send reset link
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  setDoc,
  doc,
  getDocs,
  query,
  where,
  collection,
} from 'firebase/firestore';
import './Login.css';

const Login = ({ loginStarted, setLoginStarted }) => {
  // State variables for form input and feedback messages
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  // Saves a new user's name, username, and email into Firestore
  const saveNewUser = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { name, username, email: user.email }, { merge: true });
  };

  // Checks if a username is already taken
  const isUsernameTaken = async (desiredUsername) => {
    const q = query(collection(db, 'users'), where('username', '==', desiredUsername));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // Validates an email format and ensures it's not a common placeholder
  const isValidEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const fakePatterns = ['a@a.com', 'test@', 'temp@', '123@'];
    return pattern.test(email) && !fakePatterns.some((f) => email.startsWith(f));
  };

  // Ensures password is strong: at least 6 characters with letters and numbers
  const isStrongPassword = (password) => {
    return /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(password);
  };

  // Sends a password reset email to the user
  const handleForgotPassword = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('📧 Reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handles form submission for login/register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      let userCredential;

      // Validate email format
      if (!isValidEmail(email)) {
        setError('Please use a real email address.');
        return;
      }

      // Check password strength for registration
      if (!isStrongPassword(password) && isRegistering) {
        setError('Password must be at least 6 characters with letters and numbers.');
        return;
      }

      if (isRegistering) {
        // Ensure name and username are provided
        if (!name || !username) {
          setError('Please enter both name and username.');
          return;
        }

        // Check for username uniqueness
        const taken = await isUsernameTaken(username);
        if (taken) {
          setError('Username is already taken. Please choose another.');
          return;
        }

        // Create user and save info in Firestore
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveNewUser(userCredential.user);

        // Send verification email
        await sendEmailVerification(userCredential.user);
        localStorage.setItem('resendCountdownStart', Date.now().toString());
        window.dispatchEvent(new Event('start-countdown')); // Trigger countdown timer in App.js

      } else {
        // Login flow
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError('Please verify your email before logging in.');
          return;
        }
      }
    } catch (err) {
      // Error handling with custom messages based on error codes
      if (err.code === 'auth/email-already-in-use' && isRegistering) {
        setIsRegistering(false);
        setError('That email is already registered. Switching to login...');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found. Please register.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Initial welcome screen before login/registration */}
      {!loginStarted ? (
        <>
          <h2>🎮 Welcome to Snake World</h2>
          <p>Climb the leaderboard, break your high score, and track your stats!</p>
          <button className="get-started-btn" onClick={() => setLoginStarted(true)}>
            Get Started
          </button>
        </>
      ) : (
        <>
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleSubmit} className="login-form">
            {/* Show name and username fields only during registration */}
            {isRegistering && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Username (unique)"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
                  }
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isRegistering}
            />
            <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          </form>

          {/* Password reset link visible only during login */}
          {!isRegistering && (
            <p style={{ marginTop: '10px', cursor: 'pointer', color: '#3399ff' }} onClick={handleForgotPassword}>
              Forgot Password?
            </p>
          )}

          {/* Toggle between register/login mode */}
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Login here' : 'Register here'}
            </span>
          </p>

          {/* Show error or success messages */}
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
        </>
      )}
    </div>
  );
};

export default Login;
