import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Login />
      </main>
      <Footer />
    </div>
  );
}

export default App;
