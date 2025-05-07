import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './StatsPage.css';

const StatsPage = ({ userId }) => {
  const [userStats, setUserStats] = useState(null);
  const [topScores, setTopScores] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userUsername, setUserUsername] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const scoresSnapshot = await getDocs(collection(db, 'scores'));
      const usersSnapshot = await getDocs(collection(db, 'users'));

      const scores = [];
      scoresSnapshot.forEach(doc => {
        scores.push({ id: doc.id, ...doc.data() });
      });

      const users = {};
      usersSnapshot.forEach(doc => {
        users[doc.id] = doc.data();
      });

      // Calculate per-user highest score
      const userScoresMap = {};
      scores.forEach(score => {
        if (!userScoresMap[score.userId]) userScoresMap[score.userId] = [];
        userScoresMap[score.userId].push(score.score);
      });

      const leaderboard = Object.keys(userScoresMap).map(uid => {
        const allScores = userScoresMap[uid];
        const highest = Math.max(...allScores);
        return {
          userId: uid,
          username: users[uid]?.username || 'Unknown',
          score: highest,
        };
      });

      leaderboard.sort((a, b) => b.score - a.score);
      const top3 = leaderboard.slice(0, 3);

      const userIndex = leaderboard.findIndex(entry => entry.userId === userId);
      const userEntry = leaderboard[userIndex];
      setUserRank(userIndex + 1);
      setUserUsername(userEntry?.username || 'You');

      setTopScores(
        userIndex > 2 && userEntry ? [...top3, userEntry] : top3
      );

      // User stats
      const userScores = userScoresMap[userId] || [];
      const total = userScores.reduce((a, b) => a + b, 0);
      const average = userScores.length ? (total / userScores.length).toFixed(1) : 0;
      const highest = userScores.length ? Math.max(...userScores) : 0;

      setUserStats({
        gamesPlayed: userScores.length,
        averageScore: average,
        highestScore: highest,
      });
    };

    if (userId) fetchStats();
  }, [userId]);

  return (
    <div className="stats-page">
      <h2>
        📊 Stats for <span style={{ color: '#fdd835' }}>{userUsername || 'You'}</span>
      </h2>
      {userStats ? (
        <div className="stats-card">
          <p><strong>Games Played:</strong> {userStats.gamesPlayed}</p>
          <p><strong>Highest Score:</strong> {userStats.highestScore}</p>
          <p><strong>Average Score:</strong> {userStats.averageScore}</p>
        </div>
      ) : (
        <p>Loading stats...</p>
      )}

      <h2>🌍 Global Leaderboard</h2>
      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {topScores.map((entry, index) => (
              <tr
                key={entry.userId}
                className={entry.userId === userId ? 'highlight-row' : ''}
              >
                <td>
                  {entry.userId === userId ? '🧍 ' : ''}
                  {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `${userRank}`}
                </td>
                <td>{entry.username}</td>
                <td>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsPage;
