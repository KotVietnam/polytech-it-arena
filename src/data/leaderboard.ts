export interface LeaderboardRecord {
  username: string
  points: number
  lastTrack: string
}

export const baseLeaderboard: LeaderboardRecord[] = [
  { username: 'petrov.a', points: 1280, lastTrack: 'CyberSecurity' },
  { username: 'sidorova.m', points: 1195, lastTrack: 'DevOps' },
  { username: 'karimov.d', points: 1110, lastTrack: 'Networks' },
  { username: 'ivanenko.l', points: 1035, lastTrack: 'SysAdmin' },
  { username: 'smirnov.v', points: 980, lastTrack: 'CyberSecurity' },
  { username: 'aliyeva.n', points: 940, lastTrack: 'DevOps' },
]
