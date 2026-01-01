import { Match, Series, Innings } from '@/types/cricket';
import { calculateStrikeRate, calculateEconomy, formatOvers } from './matchUtils';

const createPDFContent = (match: Match): string => {
  let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Match Scorecard - ${match.team1} vs ${match.team2}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #16a34a; text-align: center; }
    h2 { color: #1f2937; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
    h3 { color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #16a34a; color: white; }
    tr:nth-child(even) { background: #f9fafb; }
    .score { font-size: 24px; font-weight: bold; color: #16a34a; }
    .extras { color: #6b7280; font-size: 14px; }
    .mom { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0; }
    .winner { background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>🏏 Cricket Scorecard</h1>
  <h2>${match.team1} vs ${match.team2}</h2>
  <p><strong>Date:</strong> ${new Date(match.date).toLocaleDateString()}</p>
  <p><strong>Overs:</strong> ${match.oversPerInnings} | <strong>Players:</strong> ${match.playersPerTeam} per side</p>
`;

  match.innings.forEach((innings, idx) => {
    content += `
  <h3>${innings.battingTeam} Innings</h3>
  <p class="score">${innings.totalRuns}/${innings.totalWickets} (${formatOvers(innings.totalOvers, innings.totalBalls)} overs)</p>
  
  <h4>Batting</h4>
  <table>
    <tr>
      <th>Batter</th>
      <th>Runs</th>
      <th>Balls</th>
      <th>4s</th>
      <th>6s</th>
      <th>SR</th>
    </tr>
    ${innings.batters.map(b => `
    <tr>
      <td>${b.name}${b.isOut ? ' (out)' : ''}</td>
      <td>${b.runs}</td>
      <td>${b.balls}</td>
      <td>${b.fours}</td>
      <td>${b.sixes}</td>
      <td>${calculateStrikeRate(b.runs, b.balls)}</td>
    </tr>`).join('')}
  </table>
  <p class="extras">Extras: ${innings.extras.wides}wd, ${innings.extras.noBalls}nb, ${innings.extras.byes}b, ${innings.extras.legByes}lb = ${innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}</p>
  
  <h4>Bowling</h4>
  <table>
    <tr>
      <th>Bowler</th>
      <th>O</th>
      <th>M</th>
      <th>R</th>
      <th>W</th>
      <th>ECO</th>
    </tr>
    ${innings.bowlers.map(b => `
    <tr>
      <td>${b.name}</td>
      <td>${formatOvers(b.overs, b.balls)}</td>
      <td>${b.maidens}</td>
      <td>${b.runs}</td>
      <td>${b.wickets}</td>
      <td>${calculateEconomy(b.runs, b.overs, b.balls)}</td>
    </tr>`).join('')}
  </table>
`;
  });

  if (match.isComplete) {
    content += `
  <div class="winner">
    <h3>🏆 Winner: ${match.winner || 'Match Tied'}</h3>
  </div>
`;
    if (match.manOfMatch) {
      content += `
  <div class="mom">
    <h3>⭐ Man of the Match: ${match.manOfMatch}</h3>
  </div>
`;
    }
  }

  content += `
</body>
</html>`;

  return content;
};

const createSeriesPDFContent = (series: Series): string => {
  let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Series Summary - ${series.team1} vs ${series.team2}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #16a34a; text-align: center; }
    h2 { color: #1f2937; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #16a34a; color: white; }
    tr:nth-child(even) { background: #f9fafb; }
    .series-score { font-size: 32px; font-weight: bold; text-align: center; color: #16a34a; margin: 20px 0; }
    .mos { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .match-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>🏏 Series Summary</h1>
  <h2>${series.name}</h2>
  <p class="series-score">${series.team1} ${series.team1Wins} - ${series.team2Wins} ${series.team2}</p>
`;

  series.matches.forEach((match, idx) => {
    if (match.isComplete) {
      content += `
  <div class="match-card">
    <h3>Match ${idx + 1}</h3>
    <p><strong>${match.team1}:</strong> ${match.innings[0]?.totalRuns}/${match.innings[0]?.totalWickets}</p>
    <p><strong>${match.team2}:</strong> ${match.innings[1]?.totalRuns}/${match.innings[1]?.totalWickets}</p>
    <p><strong>Winner:</strong> ${match.winner}</p>
    <p><strong>Man of the Match:</strong> ${match.manOfMatch}</p>
  </div>
`;
    }
  });

  if (series.isComplete && series.manOfSeries) {
    content += `
  <div class="mos">
    <h2>🌟 Man of the Series</h2>
    <h3>${series.manOfSeries}</h3>
  </div>
`;
  }

  content += `
</body>
</html>`;

  return content;
};

export const exportMatchToPDF = (match: Match) => {
  const content = createPDFContent(match);
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const exportSeriesToPDF = (series: Series) => {
  const content = createSeriesPDFContent(series);
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
