"use client";

import { useMemo } from 'react';

type Star = {
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
};

const STAR_COUNT = 120;

function generateStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => {
    const size = Math.random() * 1.5 + 0.5;
    return {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 6,
    } satisfies Star;
  });
}

export function StarsBackground() {
  const stars = useMemo(() => generateStars(), []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020205]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,227,112,0.18),_transparent_55%)]" />
      {stars.map((star, index) => (
        <span
          key={`star-${index}`}
          className="star star-fade-in twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

