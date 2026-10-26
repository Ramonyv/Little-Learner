import React from 'react';

interface SvgProps {
  className?: string;
  size?: number | string;
}

/**
 * Hero Banner Illustration:
 * Boy with red cap holding giant pencil and trophy, with school, sun, clouds and green bushes
 */
export const HeroIllustration: React.FC<SvgProps> = ({ className = "w-full max-w-md h-auto" }) => {
  return (
    <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Little learner hero illustration">
      {/* Background scenery */}
      {/* Sun */}
      <circle cx="395" cy="45" r="28" fill="#FFD329" stroke="#111827" strokeWidth="3" />
      <path d="M395 10 V 5 M395 85 V 80 M360 45 H 355 M435 45 H 430" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      
      {/* Clouds */}
      <g fill="#FFFFFF" stroke="#111827" strokeWidth="3">
        <path d="M 80 45 C 80 32 95 24 110 30 C 120 20 140 22 148 34 C 158 32 170 42 165 52 C 160 60 145 62 135 60 C 125 62 90 64 80 45 Z" />
        <path d="M 280 40 C 280 28 295 22 308 26 C 315 16 332 18 340 28 C 348 26 358 35 354 44 C 350 50 338 52 330 50 C 322 52 290 54 280 40 Z" />
      </g>

      {/* School building on left */}
      <rect x="25" y="105" width="80" height="95" fill="#FFE58F" stroke="#111827" strokeWidth="3.5" rx="4" />
      {/* School Roof */}
      <polygon points="15,105 65,65 115,105" fill="#FF6656" stroke="#111827" strokeWidth="3.5" strokeLinejoin="round" />
      {/* School Tower */}
      <rect x="52" y="42" width="26" height="25" fill="#FFE58F" stroke="#111827" strokeWidth="3" />
      <polygon points="48,42 65,22 82,42" fill="#FF6656" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
      {/* Flag */}
      <line x1="65" y1="22" x2="65" y2="8" stroke="#111827" strokeWidth="2.5" />
      <polygon points="65,8 82,14 65,20" fill="#087CF7" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      {/* Door */}
      <path d="M 52 200 V 162 C 52 154 78 154 78 162 V 200 Z" fill="#087CF7" stroke="#111827" strokeWidth="3" />
      {/* Windows */}
      <rect x="33" y="120" width="16" height="20" rx="3" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
      <rect x="81" y="120" width="16" height="20" rx="3" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />

      {/* Green Rolling Hills & Bushes */}
      <path d="M -10 215 C 30 185 80 190 120 205 C 160 220 220 185 270 200 C 320 215 390 180 470 215 L 470 260 L -10 260 Z" 
            fill="#20C86B" stroke="#111827" strokeWidth="3.5" />
      <path d="M 80 235 C 130 200 200 210 260 230 C 320 250 400 210 480 240 L 480 260 L 80 260 Z" 
            fill="#19AF5C" />

      {/* Golden Trophy on the right */}
      <g transform="translate(355, 145)">
        {/* Base */}
        <rect x="15" y="55" width="30" height="15" rx="3" fill="#111827" stroke="#111827" strokeWidth="2.5" />
        <rect x="22" y="44" width="16" height="12" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
        {/* Cup */}
        <path d="M 10 6 C 10 38 50 38 50 6 Z" fill="#FFD329" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="30" cy="6" rx="20" ry="5" fill="#FFE58F" stroke="#111827" strokeWidth="2.5" />
        {/* Handles */}
        <path d="M 10 10 C -2 10 -2 28 10 26" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <path d="M 50 10 C 62 10 62 28 50 26" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        {/* Star in cup */}
        <polygon points="30,14 32,20 38,20 33,24 35,30 30,26 25,30 27,24 22,20 28,20" fill="#111827" />
        {/* Sparkles */}
        <circle cx="58" cy="-5" r="3" fill="#FFD329" stroke="#111827" strokeWidth="1.5" />
        <circle cx="-5" cy="5" r="2" fill="#FF6656" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Boy Character with Red Cap & Big Pencil */}
      <g transform="translate(200, 70)">
        {/* Giant Red Pencil held diagonally */}
        <g transform="rotate(-32, 12, 85)">
          <rect x="-10" y="20" width="24" height="90" fill="#FF6656" stroke="#111827" strokeWidth="3.5" rx="2" />
          <polygon points="-10,20 2,-8 14,20" fill="#FFE58F" stroke="#111827" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="-2,4 2,-8 6,4" fill="#111827" />
          <rect x="-10" y="100" width="24" height="14" fill="#FFD329" stroke="#111827" strokeWidth="3" />
        </g>

        {/* Boy Body */}
        {/* Backpack strap */}
        <path d="M 50 85 C 45 105 48 125 52 140" stroke="#087CF7" strokeWidth="7" strokeLinecap="round" />
        <path d="M 50 85 C 45 105 48 125 52 140" stroke="#111827" strokeWidth="2.5" fill="none" />
        
        {/* Yellow Shirt */}
        <path d="M 50 82 C 60 78 85 78 95 82 L 102 140 C 85 144 60 144 45 140 Z" fill="#FFD329" stroke="#111827" strokeWidth="3.5" />
        <circle cx="72" cy="100" r="3" fill="#111827" />
        <circle cx="72" cy="118" r="3" fill="#111827" />

        {/* Arms */}
        {/* Right arm holding pencil */}
        <path d="M 50 86 C 30 92 18 108 24 122 C 28 130 38 128 42 118" fill="#FFD3B5" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
        {/* Left arm raised celebrating */}
        <path d="M 95 86 C 110 75 125 60 128 42 C 132 30 118 24 112 36 C 104 50 96 68 92 82" fill="#FFD3B5" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Head */}
        <circle cx="72" cy="52" r="28" fill="#FFD3B5" stroke="#111827" strokeWidth="3.5" />
        {/* Cute Ears */}
        <circle cx="44" cy="53" r="6" fill="#FFD3B5" stroke="#111827" strokeWidth="3" />
        <circle cx="100" cy="53" r="6" fill="#FFD3B5" stroke="#111827" strokeWidth="3" />

        {/* Red Cap */}
        <path d="M 45 46 C 47 22 97 22 99 46 Z" fill="#FF6656" stroke="#111827" strokeWidth="3.5" />
        {/* Cap visor */}
        <path d="M 40 46 C 50 43 95 43 110 46 C 105 52 45 52 40 46 Z" fill="#FF6656" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="72" cy="24" r="4" fill="#087CF7" stroke="#111827" strokeWidth="2.5" />

        {/* Hair peeking out */}
        <path d="M 46 48 Q 50 56 55 52 Q 60 56 65 52" fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />

        {/* Face */}
        {/* Happy closed eyes (arcs) */}
        <path d="M 58 52 C 60 48 68 48 70 52" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <path d="M 76 52 C 78 48 86 48 88 52" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        {/* Cheerful wide smile */}
        <path d="M 64 62 C 67 72 79 72 82 62 Z" fill="#FF6656" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
        {/* Rosy cheeks */}
        <ellipse cx="56" cy="61" rx="4" ry="2.5" fill="#FF9A8C" />
        <ellipse cx="90" cy="61" rx="4" ry="2.5" fill="#FF9A8C" />
      </g>
    </svg>
  );
};

/**
 * Result Celebration Illustration:
 * Cheerful student with raised arms, trophy, and star confetti
 */
export const ResultCelebrationIllustration: React.FC<SvgProps> = ({ className = "w-44 h-44" }) => {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Celebration trophy and student">
      {/* Background Confetti & Stars */}
      <polygon points="30,30 33,36 40,36 34,40 36,46 30,42 24,46 26,40 20,36 27,36" fill="#FFD329" stroke="#111827" strokeWidth="1.5" />
      <polygon points="165,35 168,41 175,41 169,45 171,51 165,47 159,51 161,45 155,41 162,41" fill="#FF6656" stroke="#111827" strokeWidth="1.5" />
      <circle cx="45" cy="70" r="4" fill="#087CF7" stroke="#111827" strokeWidth="1.5" />
      <circle cx="155" cy="80" r="4" fill="#20C86B" stroke="#111827" strokeWidth="1.5" />
      <rect x="25" y="95" width="6" height="6" fill="#9256F5" transform="rotate(25 25 95)" />
      <rect x="170" y="105" width="6" height="6" fill="#FFD329" transform="rotate(45 170 105)" />

      {/* Celebrating Boy with Arms Up */}
      <g transform="translate(45, 30)">
        {/* Left Arm Raised */}
        <path d="M 28 65 C 10 50 -2 30 4 18 C 10 8 20 18 24 30 L 32 60" fill="#FFD3B5" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        {/* Right Arm Raised */}
        <path d="M 82 65 C 100 50 112 30 106 18 C 100 8 90 18 86 30 L 78 60" fill="#FFD3B5" stroke="#111827" strokeWidth="3" strokeLinecap="round" />

        {/* Yellow Body / Shirt */}
        <path d="M 32 60 C 45 55 65 55 78 60 L 85 110 C 70 115 40 115 25 110 Z" fill="#FFD329" stroke="#111827" strokeWidth="3.5" />
        
        {/* Backpack straps */}
        <path d="M 33 60 L 31 105" stroke="#087CF7" strokeWidth="5" strokeLinecap="round" />
        <path d="M 33 60 L 31 105" stroke="#111827" strokeWidth="2" fill="none" />
        <path d="M 77 60 L 79 105" stroke="#087CF7" strokeWidth="5" strokeLinecap="round" />
        <path d="M 77 60 L 79 105" stroke="#111827" strokeWidth="2" fill="none" />

        {/* Head */}
        <circle cx="55" cy="38" r="24" fill="#FFD3B5" stroke="#111827" strokeWidth="3.5" />
        {/* Ears */}
        <circle cx="31" cy="38" r="5" fill="#FFD3B5" stroke="#111827" strokeWidth="2.5" />
        <circle cx="79" cy="38" r="5" fill="#FFD3B5" stroke="#111827" strokeWidth="2.5" />

        {/* Red Cap with button */}
        <path d="M 33 32 C 34 12 76 12 77 32 Z" fill="#FF6656" stroke="#111827" strokeWidth="3.5" />
        <path d="M 28 32 C 38 29 72 29 82 32 C 78 37 32 37 28 32 Z" fill="#FF6656" stroke="#111827" strokeWidth="3" />
        <circle cx="55" cy="14" r="3.5" fill="#087CF7" stroke="#111827" strokeWidth="2" />

        {/* Face */}
        {/* Eyes smiling */}
        <ellipse cx="46" cy="38" rx="2.5" ry="3.5" fill="#111827" />
        <ellipse cx="64" cy="38" rx="2.5" ry="3.5" fill="#111827" />
        <circle cx="47" cy="36.5" r="1" fill="#FFFFFF" />
        <circle cx="65" cy="36.5" r="1" fill="#FFFFFF" />
        {/* Wide Happy Mouth */}
        <path d="M 47 47 C 50 56 60 56 63 47 Z" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
        {/* Cheeks */}
        <circle cx="40" cy="46" r="3" fill="#FF9A8C" />
        <circle cx="70" cy="46" r="3" fill="#FF9A8C" />
      </g>
    </svg>
  );
};

/**
 * Mid-Test Progress Illustration:
 * Boy walking with cheerful little puppy dog ("Keep going! You're doing great!")
 */
export const KeepGoingIllustration: React.FC<SvgProps> = ({ className = "w-40 h-40" }) => {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Boy walking with puppy">
      {/* Sun & ground */}
      <circle cx="160" cy="40" r="18" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
      <path d="M 10 160 C 50 148 120 152 190 160" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 10 162 L 190 162 L 190 180 L 10 180 Z" fill="#20C86B" />

      {/* Walking Boy */}
      <g transform="translate(40, 35)">
        {/* Legs */}
        <path d="M 35 100 L 25 125" stroke="#087CF7" strokeWidth="8" strokeLinecap="round" />
        <path d="M 45 100 L 55 125" stroke="#087CF7" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="20" cy="125" rx="7" ry="4" fill="#FF6656" stroke="#111827" strokeWidth="2" />
        <ellipse cx="60" cy="125" rx="7" ry="4" fill="#FF6656" stroke="#111827" strokeWidth="2" />

        {/* Body */}
        <path d="M 28 55 C 35 52 50 52 58 55 L 60 100 C 50 104 35 104 25 100 Z" fill="#FFD329" stroke="#111827" strokeWidth="3" />
        {/* Blue Backpack */}
        <rect x="15" y="60" width="14" height="28" rx="4" fill="#087CF7" stroke="#111827" strokeWidth="2.5" />

        {/* Head */}
        <circle cx="43" cy="35" r="18" fill="#FFD3B5" stroke="#111827" strokeWidth="3" />
        {/* Red Cap */}
        <path d="M 27 30 C 28 15 58 15 59 30 Z" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
        <path d="M 23 30 C 30 28 58 28 65 30 Z" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="48" cy="35" r="2" fill="#111827" />
        <path d="M 46 42 Q 51 46 54 42" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Cheerful Puppy Dog */}
      <g transform="translate(115, 105)">
        {/* Body */}
        <ellipse cx="25" cy="32" rx="16" ry="12" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
        {/* Tail wagging */}
        <path d="M 9 28 C 4 20 6 12 10 14" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        {/* Legs */}
        <rect x="15" y="40" width="5" height="15" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
        <rect x="30" y="40" width="5" height="15" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
        {/* Head */}
        <circle cx="36" cy="22" r="12" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
        {/* Floppy Ear */}
        <ellipse cx="32" cy="18" rx="5" ry="9" fill="#FF6656" stroke="#111827" strokeWidth="2" />
        {/* Face */}
        <circle cx="40" cy="21" r="2" fill="#111827" />
        <circle cx="45" cy="24" r="2.5" fill="#111827" />
      </g>
    </svg>
  );
};

/**
 * Trophy Illustration:
 * Golden trophy with star and ribbons
 */
export const TrophyIllustration: React.FC<SvgProps> = ({ className = "w-28 h-28" }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Golden trophy">
      <rect x="25" y="80" width="50" height="14" rx="4" fill="#111827" stroke="#111827" strokeWidth="2" />
      <rect x="42" y="65" width="16" height="16" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
      {/* Cup */}
      <path d="M 22 18 C 22 55 78 55 78 18 Z" fill="#FFD329" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="50" cy="18" rx="28" ry="7" fill="#FFE58F" stroke="#111827" strokeWidth="2.5" />
      {/* Handles */}
      <path d="M 22 24 C 6 24 6 46 22 42" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      <path d="M 78 24 C 94 24 94 46 78 42" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      {/* Star */}
      <polygon points="50,26 53,33 60,33 55,38 57,45 50,40 43,45 45,38 40,33 47,33" fill="#111827" />
    </svg>
  );
};

/**
 * Question Illustrations:
 * Renders cute children's book vector icons for questions with picture clues
 */
export const QuestionIllustration: React.FC<{ name?: string; className?: string }> = ({ 
  name = 'cat', 
  className = "w-36 h-36" 
}) => {
  switch (name) {
    case 'cat':
      return (
        <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Cute cat">
          {/* Cloud above */}
          <path d="M 100 22 C 100 15 110 10 120 14 C 126 8 138 10 142 16 C 148 15 155 21 152 27 C 150 31 142 32 135 31 C 130 32 108 33 100 22 Z" fill="#EBF4FE" stroke="#111827" strokeWidth="2" />
          {/* Grass & little bush */}
          <path d="M 20 125 C 40 120 120 120 140 125" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="125" cy="122" rx="10" ry="5" fill="#20C86B" stroke="#111827" strokeWidth="2" />
          <ellipse cx="35" cy="123" rx="8" ry="4" fill="#20C86B" stroke="#111827" strokeWidth="2" />
          
          {/* Cat body */}
          <ellipse cx="80" cy="95" rx="30" ry="24" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
          {/* Cat tail */}
          <path d="M 108 98 C 122 98 128 85 125 76" fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cat Paws */}
          <ellipse cx="68" cy="116" rx="8" ry="5" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
          <ellipse cx="92" cy="116" rx="8" ry="5" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
          
          {/* Cat Head */}
          <circle cx="80" cy="55" r="26" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
          {/* Ears */}
          <polygon points="58,40 50,15 70,30" fill="#FFFFFF" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="60,37 54,20 68,30" fill="#FF9A8C" />
          <polygon points="102,40 110,15 90,30" fill="#FFFFFF" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="100,37 106,20 92,30" fill="#FF9A8C" />
          
          {/* Face */}
          <ellipse cx="71" cy="53" rx="3.5" ry="4.5" fill="#111827" />
          <ellipse cx="89" cy="53" rx="3.5" ry="4.5" fill="#111827" />
          <circle cx="72" cy="51" r="1.2" fill="#FFFFFF" />
          <circle cx="90" cy="51" r="1.2" fill="#FFFFFF" />
          <polygon points="78,61 82,61 80,64" fill="#FF6656" stroke="#111827" strokeWidth="1.5" />
          <path d="M 76 65 Q 80 68 84 65" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="58" y1="58" x2="44" y2="55" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <line x1="58" y1="63" x2="45" y2="65" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <line x1="102" y1="58" x2="116" y2="55" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <line x1="102" y1="63" x2="115" y2="65" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          {/* Rosy Cheeks */}
          <circle cx="63" cy="62" r="3.5" fill="#FF9A8C" />
          <circle cx="97" cy="62" r="3.5" fill="#FF9A8C" />
        </svg>
      );

    case 'apple':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Red apple">
          {/* Stem */}
          <path d="M 60 30 C 58 18 64 12 70 8" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          {/* Leaf */}
          <path d="M 64 22 C 75 15 88 18 90 26 C 82 32 70 28 64 22 Z" fill="#20C86B" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Apple body */}
          <path d="M 60 34 C 45 20 20 32 20 60 C 20 90 45 108 60 108 C 75 108 100 90 100 60 C 100 32 75 20 60 34 Z" 
                fill="#FF6656" stroke="#111827" strokeWidth="3.5" strokeLinejoin="round" />
          {/* Gloss highlight */}
          <path d="M 34 50 C 32 60 35 72 40 78" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'sun':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Smiling bright sun">
          <circle cx="60" cy="60" r="30" fill="#FFD329" stroke="#111827" strokeWidth="3.5" />
          {/* Rays */}
          <g stroke="#111827" strokeWidth="3.5" strokeLinecap="round">
            <line x1="60" y1="12" x2="60" y2="20" />
            <line x1="60" y1="100" x2="60" y2="108" />
            <line x1="12" y1="60" x2="20" y2="60" />
            <line x1="100" y1="60" x2="108" y2="60" />
            <line x1="26" y1="26" x2="32" y2="32" />
            <line x1="88" y1="88" x2="94" y2="94" />
            <line x1="94" y1="26" x2="88" y2="32" />
            <line x1="32" y1="88" x2="26" y2="94" />
          </g>
          {/* Cute Face */}
          <ellipse cx="50" cy="56" rx="2.5" ry="3.5" fill="#111827" />
          <ellipse cx="70" cy="56" rx="2.5" ry="3.5" fill="#111827" />
          <path d="M 52 66 Q 60 74 68 66" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="44" cy="64" r="3" fill="#FF9A8C" />
          <circle cx="76" cy="64" r="3" fill="#FF9A8C" />
        </svg>
      );

    case 'pencil':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Pencil">
          <g transform="rotate(45, 60, 60)">
            <rect x="50" y="25" width="20" height="65" fill="#FFD329" stroke="#111827" strokeWidth="3" />
            <polygon points="50,25 60,5 70,25" fill="#FFE58F" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="57,11 60,5 63,11" fill="#111827" />
            <rect x="50" y="90" width="20" height="15" fill="#FF6656" stroke="#111827" strokeWidth="3" rx="2" />
            <rect x="50" y="85" width="20" height="7" fill="#E5E7EB" stroke="#111827" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'elephant':
      return (
        <svg viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Elephant">
          <ellipse cx="70" cy="65" rx="35" ry="28" fill="#CBD5E1" stroke="#111827" strokeWidth="3" />
          <rect x="48" y="75" width="10" height="25" rx="3" fill="#CBD5E1" stroke="#111827" strokeWidth="3" />
          <rect x="68" y="75" width="10" height="25" rx="3" fill="#CBD5E1" stroke="#111827" strokeWidth="3" />
          <rect x="88" y="75" width="10" height="25" rx="3" fill="#CBD5E1" stroke="#111827" strokeWidth="3" />
          {/* Head & Trunk */}
          <circle cx="42" cy="50" r="22" fill="#CBD5E1" stroke="#111827" strokeWidth="3" />
          <path d="M 30 52 C 22 55 16 68 20 80 C 24 88 32 82 28 75 C 26 70 30 65 35 62" fill="#CBD5E1" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          {/* Big Ear */}
          <ellipse cx="50" cy="48" rx="14" ry="18" fill="#E2E8F0" stroke="#111827" strokeWidth="3" />
          <circle cx="36" cy="44" r="2.5" fill="#111827" />
        </svg>
      );

    case 'school':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="School">
          <rect x="25" y="45" width="70" height="55" fill="#FFE58F" stroke="#111827" strokeWidth="3" rx="2" />
          <polygon points="15,45 60,18 105,45" fill="#FF6656" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          <rect x="52" y="10" width="16" height="15" fill="#FFE58F" stroke="#111827" strokeWidth="2.5" />
          <polygon points="48,10 60,2 72,10" fill="#087CF7" stroke="#111827" strokeWidth="2.5" />
          <path d="M 50 100 V 75 C 50 70 70 70 70 75 V 100 Z" fill="#087CF7" stroke="#111827" strokeWidth="2.5" />
          <rect x="32" y="55" width="14" height="15" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
          <rect x="74" y="55" width="14" height="15" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
        </svg>
      );

    case 'tree':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Tall green tree">
          <rect x="50" y="65" width="20" height="42" fill="#92400E" stroke="#111827" strokeWidth="3" rx="2" />
          <circle cx="60" cy="50" r="32" fill="#20C86B" stroke="#111827" strokeWidth="3" />
          <circle cx="42" cy="55" r="20" fill="#19AF5C" stroke="#111827" strokeWidth="2.5" />
          <circle cx="78" cy="55" r="20" fill="#19AF5C" stroke="#111827" strokeWidth="2.5" />
          <circle cx="60" cy="35" r="22" fill="#20C86B" stroke="#111827" strokeWidth="2.5" />
        </svg>
      );

    case 'car':
      return (
        <svg viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Red car">
          <rect x="15" y="38" width="100" height="30" rx="8" fill="#FF6656" stroke="#111827" strokeWidth="3" />
          <path d="M 32 38 L 45 18 H 85 L 98 38 Z" fill="#FF6656" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          <rect x="48" y="22" width="16" height="14" rx="2" fill="#EBF4FE" stroke="#111827" strokeWidth="2" />
          <rect x="68" y="22" width="16" height="14" rx="2" fill="#EBF4FE" stroke="#111827" strokeWidth="2" />
          {/* Wheels */}
          <circle cx="38" cy="68" r="14" fill="#111827" stroke="#111827" strokeWidth="2" />
          <circle cx="38" cy="68" r="6" fill="#E5E7EB" />
          <circle cx="92" cy="68" r="14" fill="#111827" stroke="#111827" strokeWidth="2" />
          <circle cx="92" cy="68" r="6" fill="#E5E7EB" />
          {/* Headlight */}
          <ellipse cx="112" cy="46" rx="4" ry="6" fill="#FFD329" stroke="#111827" strokeWidth="2" />
        </svg>
      );

    case 'dog':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Puppy dog">
          <ellipse cx="60" cy="72" rx="30" ry="22" fill="#FFE58F" stroke="#111827" strokeWidth="3" />
          <circle cx="60" cy="42" r="22" fill="#FFE58F" stroke="#111827" strokeWidth="3" />
          {/* Floppy Ears */}
          <ellipse cx="40" cy="38" rx="8" ry="16" fill="#D97706" stroke="#111827" strokeWidth="2.5" />
          <ellipse cx="80" cy="38" rx="8" ry="16" fill="#D97706" stroke="#111827" strokeWidth="2.5" />
          {/* Face */}
          <circle cx="53" cy="40" r="2.5" fill="#111827" />
          <circle cx="67" cy="40" r="2.5" fill="#111827" />
          <ellipse cx="60" cy="48" rx="4" ry="3" fill="#111827" />
          <path d="M 57 52 Q 60 56 63 52" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          {/* Wagging tail */}
          <path d="M 88 68 C 98 60 102 50 100 42" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'clock':
      return (
        <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Clock">
          <circle cx="55" cy="55" r="42" fill="#FFFFFF" stroke="#111827" strokeWidth="3.5" />
          <circle cx="55" cy="55" r="3" fill="#111827" />
          <line x1="55" y1="55" x2="55" y2="28" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <line x1="55" y1="55" x2="72" y2="55" stroke="#FF6656" strokeWidth="2.5" strokeLinecap="round" />
          {/* Numbers */}
          <circle cx="55" cy="20" r="2" fill="#111827" />
          <circle cx="90" cy="55" r="2" fill="#111827" />
          <circle cx="55" cy="90" r="2" fill="#111827" />
          <circle cx="20" cy="55" r="2" fill="#111827" />
        </svg>
      );

    case 'butterfly':
      return (
        <svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Butterfly">
          {/* Left Wings */}
          <path d="M 55 55 C 30 20 8 35 15 60 C 20 75 45 65 55 60 Z" fill="#9256F5" stroke="#111827" strokeWidth="2.5" />
          <path d="M 55 62 C 35 68 18 80 25 95 C 32 105 50 85 55 70 Z" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
          {/* Right Wings */}
          <path d="M 65 55 C 90 20 112 35 105 60 C 100 75 75 65 65 60 Z" fill="#9256F5" stroke="#111827" strokeWidth="2.5" />
          <path d="M 65 62 C 85 68 102 80 95 95 C 88 105 70 85 65 70 Z" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
          {/* Body */}
          <rect x="57" y="40" width="6" height="40" rx="3" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
          {/* Antennae */}
          <path d="M 58 40 C 52 30 45 32 46 25" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M 62 40 C 68 30 75 32 74 25" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'fish':
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Swimming fish">
          {/* Body */}
          <path d="M 85 45 C 75 25 35 25 20 45 C 35 65 75 65 85 45 Z" fill="#087CF7" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          {/* Tail */}
          <polygon points="82,45 108,22 108,68" fill="#FFD329" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          {/* Eye */}
          <circle cx="36" cy="42" r="4" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
          <circle cx="35" cy="42" r="2" fill="#111827" />
          {/* Fin */}
          <path d="M 45 45 C 55 45 60 55 52 58 Z" fill="#FFD329" stroke="#111827" strokeWidth="2" />
        </svg>
      );

    case 'cake':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Birthday cake">
          <ellipse cx="60" cy="88" rx="42" ry="14" fill="#FFE58F" stroke="#111827" strokeWidth="3" />
          <rect x="25" y="52" width="70" height="36" fill="#FF8A7A" stroke="#111827" strokeWidth="3" />
          <ellipse cx="60" cy="52" rx="35" ry="12" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
          <rect x="57" y="24" width="6" height="28" fill="#087CF7" stroke="#111827" strokeWidth="2" />
          <path d="M 60 12 C 56 18 56 22 60 24 C 64 22 64 18 60 12 Z" fill="#FFD329" stroke="#111827" strokeWidth="2" />
        </svg>
      );

    case 'umbrella':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Colorful umbrella">
          <path d="M 20 65 C 20 30 100 30 100 65 Z" fill="#9256F5" stroke="#111827" strokeWidth="3.5" />
          <path d="M 45 65 C 45 32 75 32 75 65 Z" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
          <path d="M 60 25 V 95 C 60 105 72 105 72 95" fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="25" x2="60" y2="15" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'bird':
      return (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Singing bird">
          <ellipse cx="65" cy="55" rx="28" ry="22" fill="#087CF7" stroke="#111827" strokeWidth="3" />
          <circle cx="82" cy="42" r="16" fill="#087CF7" stroke="#111827" strokeWidth="3" />
          <polygon points="96,40 110,45 96,50" fill="#FFD329" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="86" cy="38" r="2.5" fill="#111827" />
          <polygon points="38,55 15,45 15,65" fill="#FF6656" stroke="#111827" strokeWidth="2.5" />
          <path d="M 60 76 L 55 92 M 72 76 L 72 92" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'smile':
      return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Smiling face">
          <circle cx="60" cy="60" r="42" fill="#FFD329" stroke="#111827" strokeWidth="3.5" />
          <circle cx="46" cy="52" r="4" fill="#111827" />
          <circle cx="74" cy="52" r="4" fill="#111827" />
          <path d="M 44 68 Q 60 84 76 68" fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="38" cy="65" rx="5" ry="3" fill="#FF8A7A" />
          <ellipse cx="82" cy="65" rx="5" ry="3" fill="#FF8A7A" />
        </svg>
      );

    default:
      // Default book or star illustration
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Question illustration">
          <rect x="18" y="24" width="64" height="52" rx="6" fill="#EBF4FE" stroke="#111827" strokeWidth="3" />
          <circle cx="50" cy="50" r="16" fill="#FFD329" stroke="#111827" strokeWidth="2.5" />
          <polygon points="50,42 53,47 58,47 54,51 55,56 50,53 45,56 46,51 42,47 47,47" fill="#111827" />
        </svg>
      );
  }
};
