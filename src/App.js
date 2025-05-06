import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import SnakeGame from './components/SnakeGame';
import './App.css';


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
    <div className="app-container">
      <Header />
      <main className="main-content">
        {currentUser ? (
          <div className="game-container">
            <h1>Welcome, {userName} 🐍</h1>
            <SnakeGame />
          </div>
        ) : (
          <Login />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
