import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SnakeGame from './components/SnakeGame';
import StatsPage from './pages/StatsPage';
import Login from './pages/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserName(docSnap.data().name);
        }
      } else {
        setCurrentUser(null);
        setUserName('');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header userName={userName} showMenu={!!currentUser} />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? (
                  <div className="game-container">
                    <h1>Welcome, {userName} 🐍</h1>
                    <SnakeGame />
                  </div>
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/stats" element={<StatsPage userId={currentUser?.uid} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
