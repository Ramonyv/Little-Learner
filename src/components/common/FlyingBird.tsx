import { useEffect, useState } from 'react';

const BIRD_FRAMES = [
  '/home/bird-1.webp',
  '/home/bird-2.webp',
  '/home/bird-3.webp',
  '/home/bird-4.webp',
  '/home/bird-5.webp',
  '/home/bird-6.webp',
];

interface FlyingBirdProps {
  sizeClass?: string;
  flip?: boolean;
  startFrame?: number;
  className?: string;
}

export function FlyingBird({
  sizeClass = 'w-11 h-11 sm:w-14 sm:h-14',
  flip = false,
  startFrame = 0,
  className = '',
}: FlyingBirdProps) {
  const [frameIndex, setFrameIndex] = useState(startFrame % BIRD_FRAMES.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % BIRD_FRAMES.length);
    }, 130);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`pointer-events-none select-none animate-bird-flight ${className}`} aria-hidden="true">
      <img
        src={BIRD_FRAMES[frameIndex]}
        alt=""
        className={`${sizeClass} object-contain filter drop-shadow-sm ${flip ? '-scale-x-100' : ''}`}
      />
    </div>
  );
}
