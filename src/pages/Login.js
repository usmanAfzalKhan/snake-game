// src/pages/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
  
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          name: name,
          email: email,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error('Login/Register error:', err);
      setError(err.message);
    }
  };
  

  return (
    <div className="login-container">
      <h2>{isRegistering ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{isRegistering ? 'Sign Up' : 'Login'}</button>
      </form>
      <p>
        {isRegistering ? 'Already have an account?' : 'Don’t have an account?'}{' '}
        <span onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Login' : 'Sign Up'}
        </span>
      </p>
    </div>
  );
};

export default Login;
