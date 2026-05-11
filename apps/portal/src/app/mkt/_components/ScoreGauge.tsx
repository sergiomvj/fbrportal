'use client';

interface ScoreGaugeProps {
  score: number;
  justificativa?: string;
}

function getScoreColor(score: number): string {
  if (score < 40) return '#EF4444';
  if (score <= 70) return '#F59E0B';
  return '#10B981';
}

function getScoreLabel(score: number): string {
  if (score < 40) return 'Baixo';
  if (score <= 70) return 'Moderado';
  return 'Alto';
}

export function ScoreGauge({ score, justificativa }: ScoreGaugeProps) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="mkt-score-gauge">
      <svg viewBox="0 0 120 120" width="140" height="140">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(30,46,72,0.5)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">
          {score}
        </text>
        <text x="60" y="75" textAnchor="middle" fill={color} fontSize="12" fontWeight="600">
          {getScoreLabel(score)}
        </text>
      </svg>
      {justificativa && (
        <div className="mkt-score-justificativa">
          <p>{justificativa}</p>
        </div>
      )}
    </div>
  );
}
