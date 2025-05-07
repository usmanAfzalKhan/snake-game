// StatsPage.js
// This component shows the logged-in user's stats and the global leaderboard

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./StatsPage.css";

const StatsPage = ({ userId }) => {
  // State to store current user's personal stats
  const [userStats, setUserStats] = useState(null);
  // Top scores for leaderboard (top 3 + current user)
  const [topScores, setTopScores] = useState([]);
  // The rank of the current user among all players
  const [userRank, setUserRank] = useState(null);
  // Username of the current user
  const [userUsername, setUserUsername] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch all scores and user profiles from Firestore
      const scoresSnapshot = await getDocs(collection(db, "scores"));
      const usersSnapshot = await getDocs(collection(db, "users"));

      // Convert Firestore docs into plain JS objects
      const scores = [];
      scoresSnapshot.forEach((doc) => {
        scores.push({ id: doc.id, ...doc.data() });
      });

      const users = {};
      usersSnapshot.forEach((doc) => {
        users[doc.id] = doc.data();
      });

      // Group scores by user ID and find each user's highest score
      const userScoresMap = {};
      scores.forEach((score) => {
        if (!userScoresMap[score.userId]) userScoresMap[score.userId] = [];
        userScoresMap[score.userId].push(score.score);
      });

      // Create leaderboard with highest score and username for each user
      const leaderboard = Object.keys(userScoresMap).map((uid) => {
        const allScores = userScoresMap[uid];
        const highest = Math.max(...allScores);
        return {
          userId: uid,
          username: users[uid]?.username || "Unknown",
          score: highest,
        };
      });

      // Sort leaderboard in descending order by score
      leaderboard.sort((a, b) => b.score - a.score);
      const top3 = leaderboard.slice(0, 3); // Top 3 scorers

      // Find the current user's ranking and entry on the leaderboard
      const userIndex = leaderboard.findIndex(
        (entry) => entry.userId === userId
      );
      const userEntry = leaderboard[userIndex];
      setUserRank(userIndex + 1); // Rankings are 1-based
      setUserUsername(userEntry?.username || "You");

      // Include current user in leaderboard view if not in top 3
      setTopScores(userIndex > 2 && userEntry ? [...top3, userEntry] : top3);

      // Compute the current user's overall stats
      const userScores = userScoresMap[userId] || [];
      const total = userScores.reduce((a, b) => a + b, 0); // Total of all scores
      const average = userScores.length
        ? (total / userScores.length).toFixed(1)
        : 0; // Avg score
      const highest = userScores.length ? Math.max(...userScores) : 0; // Highest score

      setUserStats({
        gamesPlayed: userScores.length,
        averageScore: average,
        highestScore: highest,
      });
    };

    // Only fetch stats when we have a user ID
    if (userId) fetchStats();
  }, [userId]);

  return (
    <div className="stats-page">
      <h2>
        📊 Stats for{" "}
        <span style={{ color: "#fdd835" }}>{userUsername || "You"}</span>
      </h2>
      {userStats ? (
        <div className="stats-card">
          {/* User's personal game stats */}
          <p>
            <strong>Games Played:</strong> {userStats.gamesPlayed}
          </p>
          <p>
            <strong>Highest Score:</strong> {userStats.highestScore}
          </p>
          <p>
            <strong>Average Score:</strong> {userStats.averageScore}
          </p>
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
                className={entry.userId === userId ? "highlight-row" : ""}
              >
                <td>
                  {/* Medal emoji for top 3; otherwise, show rank */}
                  {entry.userId === userId ? "🧍 " : ""}
                  {index === 0
                    ? "🥇 1"
                    : index === 1
                    ? "🥈 2"
                    : index === 2
                    ? "🥉 3"
                    : `${userRank}`}
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
