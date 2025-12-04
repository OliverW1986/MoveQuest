interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
}

export default function Leaderboard({ entries = [] }: LeaderboardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Class Leaderboard</h3>
      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No data available</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-gray-600">#{entry.rank}</span>
                <span>{entry.name}</span>
              </div>
              <span className="font-semibold">{entry.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}