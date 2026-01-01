import React, { useRef, useEffect } from 'react';
import { Match } from '@/types/cricket';

interface StatsChartProps {
  match: Match;
  type: 'runs' | 'wickets';
}

const StatsChart: React.FC<StatsChartProps> = ({ match, type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get data
    const team1Data = match.innings[0] || null;
    const team2Data = match.innings[1] || null;

    let team1Value = 0;
    let team2Value = 0;

    if (type === 'runs') {
      team1Value = team1Data?.totalRuns || 0;
      team2Value = team2Data?.totalRuns || 0;
    } else {
      team1Value = team1Data?.bowlers.reduce((sum, b) => sum + b.wickets, 0) || 0;
      team2Value = team2Data?.bowlers.reduce((sum, b) => sum + b.wickets, 0) || 0;
    }

    const maxValue = Math.max(team1Value, team2Value, 1);
    const barWidth = chartWidth / 4;
    const gap = chartWidth / 8;

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#1f2937';
    ctx.setLineDash([5, 5]);
    for (let i = 0; i <= 4; i++) {
      const y = height - padding - (i / 4) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxValue * i) / 4).toString(), padding - 8, y + 4);
    }
    ctx.setLineDash([]);

    // Draw bars
    const drawBar = (x: number, value: number, color: string, label: string) => {
      const barHeight = (value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      // Gradient fill
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '40');
      ctx.fillStyle = gradient;

      // Draw bar with rounded top
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 8);

      // Team label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.fillText(label.slice(0, 10), x + barWidth / 2, height - padding + 20);
    };

    const x1 = padding + gap;
    const x2 = padding + gap * 3 + barWidth;

    drawBar(x1, team1Value, '#22c55e', match.team1);
    drawBar(x2, team2Value, '#3b82f6', match.team2);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'runs' ? 'Total Runs' : 'Wickets Taken', width / 2, 24);
  }, [match, type]);

  return (
    <div className="cricket-card p-4">
      <canvas
        ref={canvasRef}
        className="w-full h-48"
        style={{ width: '100%', height: '200px' }}
      />
    </div>
  );
};

export default StatsChart;
