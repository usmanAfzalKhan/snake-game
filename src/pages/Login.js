import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc, getDocs, query, where, collection } from 'firebase/firestore';
import './Login.css';

const Login = () => {
  const [started, setStarted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const saveNewUser = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name,
      username,
      email: user.email,
    }, { merge: true });
  };

  const isUsernameTaken = async (desiredUsername) => {
    const q = query(collection(db, 'users'), where('username', '==', desiredUsername));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let userCredential;

      if (isRegistering) {
        if (!name || !username) {
          setError('Please enter both name and username.');
          return;
        }

        const taken = await isUsernameTaken(username);
        if (taken) {
          setError('Username is already taken. Please choose another.');
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveNewUser(userCredential.user);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
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
      {!started ? (
        <>
          <h2>🎮 Welcome to Snake World</h2>
          <p>Climb the leaderboard, break your high score, and track your stats!</p>
          <button className="get-started-btn" onClick={() => setStarted(true)}>
            Get Started
          </button>
        </>
      ) : (
        <>
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleSubmit} className="login-form">
            {isRegistering && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Username (unique)"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Login here' : 'Register here'}
            </span>
          </p>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default Login;
