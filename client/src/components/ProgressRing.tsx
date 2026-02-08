interface ProgressRingProps {
  solved: number;
  total: number;
}

export default function ProgressRing({ solved, total }: ProgressRingProps) {
  const radius = 46;
  const stroke = 8;
  const normalized = radius - stroke;
  const circumference = 2 * Math.PI * normalized;
  const progress = total === 0 ? 0 : solved / total;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex items-center justify-center rounded-full border border-codolio-border bg-codolio-panel p-4">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#2a2f37"
          fill="transparent"
          strokeWidth={stroke}
          r={normalized}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#f97316"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalized}
          cx={radius}
          cy={radius}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className="fill-white text-lg">
          {solved}/{total}
        </text>
      </svg>
    </div>
  );
}
