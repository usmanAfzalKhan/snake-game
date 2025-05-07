import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const StatsPage = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const q = query(collection(db, 'scores'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      let total = 0, max = 0, count = 0;
      snapshot.forEach(doc => {
        const score = doc.data().score;
        total += score;
        max = Math.max(max, score);
        count++;
      });

      // Now calculate world ranking
      const allScoresSnap = await getDocs(collection(db, 'scores'));
      const userHighScores = {};

      allScoresSnap.forEach(doc => {
        const { userId: uid, score } = doc.data();
        if (!userHighScores[uid] || userHighScores[uid] < score) {
          userHighScores[uid] = score;
        }
      });

      const sorted = Object.entries(userHighScores).sort((a, b) => b[1] - a[1]);
      const rank = sorted.findIndex(([uid]) => uid === userId) + 1;

      setStats({
        highest: max,
        average: count ? total / count : 0,
        games: count,
        rank,
        totalPlayers: sorted.length,
      });

      setLoading(false);
    };

    if (userId) fetchStats();
  }, [userId]);

  if (loading) return <div>Loading your stats...</div>;

  return (
    <div className="stats-page">
      <h2>📊 Your Stats</h2>
      <p>🎯 Highest Score: {stats.highest}</p>
      <p>📈 Average Score: {stats.average.toFixed(2)}</p>
      <p>🎮 Games Played: {stats.games}</p>
      <p>🌍 World Rank: #{stats.rank} of {stats.totalPlayers}</p>
    </div>
  );
};

export default StatsPage;
