import { useId } from "react";

// Small landscape drawings share a horizon with the settlement view.
export function LandChoice({ forest }: { forest: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 38" className="land-choice">
      <path fill="#b3b8a1" d="M0 0h100v38H0z" />
      <circle cx="77" cy="8" r="4" fill="#f5d89f" />
      <path fill="#728773" d="m0 20 18-10 14 7 20-10 22 12 14-6 12 5v20H0z" />
      <path fill={forest ? "#53674a" : "#ccaa67"} d="M0 24q40-10 100-3v17H0z" />
      {forest ? (
        [9, 23, 34, 49, 60, 76, 90].map((x, i) => (
          <g key={x} transform={`translate(${x},${23 + (i % 3) * 3})`}>
            <path stroke="#604937" strokeWidth="2" d="M0-3v9" />
            <path fill={i % 2 ? "#385a46" : "#4b7051"} d="m0-15-7 14h14z" />
          </g>
        ))
      ) : (
        <g stroke="#8b683d" strokeWidth="2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${5 + i * 16} 21l${-32 + i * 8} 19`} />
          ))}
        </g>
      )}
    </svg>
  );
}

export function EventScene({
  family,
  stage,
  icon,
}: {
  family: string;
  stage: number;
  icon: string;
}) {
  const sky = useId();
  return (
    <svg
      className="event-vignette"
      viewBox="0 0 440 74"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={sky} x2="0" y2="1">
          <stop stopColor="#688081" />
          <stop offset="1" stopColor="#e5c389" />
        </linearGradient>
      </defs>
      <path fill={`url(#${sky})`} d="M0 0h440v74H0z" />
      <circle cx="364" cy="18" r="9" fill="#f2db9a" />
      <path
        fill="#708778"
        d="m0 40 42-19 41 14 61-29 38 21 33-12 48 17 46-16 43 20 44-18 44 17v39H0z"
      />
      <path fill="#596e55" d="M0 52q98-29 192-7t248-6v35H0z" />
      <path fill="#9e8654" d="M0 62q124-22 233-8t207 2v18H0z" />
      {[48, 92, 128, 227, 268, 315].map((x, i) => (
        <g key={x} transform={`translate(${x},${48 + (i % 3) * 4})`}>
          {stage === 0 ? (
            <>
              <path fill="#c7a473" stroke="#695138" d="m-13 6 13-20 13 20z" />
              <path fill="#493f31" d="m-4 6 4-8 4 8z" />
            </>
          ) : stage < 6 ? (
            <>
              <path fill="#d6b986" d="M-10-7h20V6h-20z" />
              <path fill="#80553b" d="m-14-6 14-12 14 12z" />
              <path fill="#584b39" d="M-2-2h5v8h-5z" />
            </>
          ) : (
            <>
              <path
                fill="#52676a"
                d={`M-11 6v-${18 + (i % 3) * 5}h21v${18 + (i % 3) * 5}z`}
              />
              <path
                stroke="#e6bf83"
                strokeWidth="3"
                strokeDasharray="3 3"
                d="M-8-8H8M-8-3H8"
              />
            </>
          )}
        </g>
      ))}
      {family === "food" &&
        [0, 1, 2, 3, 4, 5, 6].map((n) => (
          <path
            key={n}
            d={`M${30 + n * 12} 59l${-14 + n * 2} 15`}
            stroke="#d5b06d"
            strokeWidth="3"
          />
        ))}
      <circle
        cx="393"
        cy="36"
        r="23"
        fill="#263a34"
        stroke="#e2d4ad"
        strokeWidth="2"
      />
      <text x="393" y="45" textAnchor="middle" fontSize="24">
        {icon}
      </text>
    </svg>
  );
}
