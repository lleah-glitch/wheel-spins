import React, { useEffect, useRef, useMemo } from 'react';
import { Prize, PrizeType, AppConfig } from '../types';

// Gold Question Mark SVG Data URI
const GOLD_QUESTION_MARK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkZENzAwO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNCODg2MEI7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPHZpZXdCb3ggaWQ9InNoYWRvdyI+CiAgICAgIDxmaWx0ZXIgaWQ9ImRyb3BTaGFkb3ciPgogICAgICAgIDxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlQWxwaGEiIHN0ZERldmlhdGlvbj0iMiIvPgogICAgICAgIDxmZU9mZnNldCBkeD0iMiIgZHk9IjIiIHJlc3VsdD0ib2ZZnNldGJsdXIiLz4KICAgICAgICA8ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiYSgwLDAsMCwwLjUpIi8+CiAgICAgICAgPGZlQ29tcG9zaXRlIGluMj0ib2ZZnNldGJsdXIiIG9wZXJhdG9yPSJpbiIvPgogICAgICAgIDxmZU1lcmdlPgogICAgICAgICAgPGZlTWVyZ2VOb2RlLz4KICAgICAgICAgIDxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPgogICAgICAgIDwvZmVNZXJnZT4KICAgICAgPC9maWx0ZXI+CiAgICA8L3ZpZXdCb3g+CiAgPC9kZWZzPgogIDx0ZXh0IHg9IjUwIiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjgwIiBmaWxsPSJ1cmwoI2dyYWQxKSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsdGVyPSJ1cmwoI2Ryb3BTaGFkb3cpIj4/PC90ZXh0Pgo8L3N2Zz4=";

interface WheelProps {
  prizes: Prize[];
  mustSpin: boolean;
  prizeNumber: number; // Index of the winning prize
  onStopSpinning: () => void;
  displayMode: 'IMAGE' | 'TEXT'; // New Prop
}

const Wheel: React.FC<WheelProps> = ({ prizes, mustSpin, prizeNumber, onStopSpinning, displayMode }) => {
  const [rotation, setRotation] = React.useState(0);
  
  // Determine number of segments
  const segCount = prizes.length;
  const segAngle = 360 / segCount;

  // Generate SVG paths for slices
  const slices = useMemo(() => {
    return prizes.map((prize, i) => {
      const startAngle = i * segAngle;
      const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
      };

      const [startX, startY] = getCoordinatesForPercent(i / segCount);
      const [endX, endY] = getCoordinatesForPercent((i + 1) / segCount);

      const largeArcFlag = segAngle > 180 ? 1 : 0;

      const pathData = [
        `M 0 0`,
        `L ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`,
      ].join(' ');

      return {
        path: pathData,
        color: prize.color,
        rotation: startAngle + segAngle / 2,
        text: prize.name,
        prize: prize
      };
    });
  }, [prizes, segCount, segAngle]);

  useEffect(() => {
    if (mustSpin) {
      const newPrizeAngle = (prizeNumber * segAngle) + (segAngle / 2);
      const randomOffset = Math.floor(Math.random() * (segAngle * 0.6)) - (segAngle * 0.3); 
      const extraSpins = 360 * 5; 
      
      setRotation(prev => {
         const currentMod = prev % 360;
         const targetMod = (270 - newPrizeAngle);
         let dist = targetMod - currentMod;
         if(dist < 0) dist += 360;
         return prev + extraSpins + dist + randomOffset;
      });
    }
  }, [mustSpin, prizeNumber, segAngle]);

  return (
    <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
      {/* Pointer */}
      <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 w-12 h-14 filter drop-shadow-xl">
        <svg viewBox="0 0 100 100" className="w-full h-full">
           <path d="M 50 100 L 15 0 L 85 0 Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Wheel Container */}
      <div 
        className="w-full h-full rounded-full overflow-hidden border-[10px] border-white shadow-[0_0_40px_rgba(0,0,0,0.5)] relative transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
        style={{ transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={onStopSpinning}
      >
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform rotate-0" style={{ overflow: 'visible' }}>
          <defs>
             {/* Clip path for circular images */}
             <clipPath id="circleClip">
                <circle cx="0" cy="0" r="0.19" />
             </clipPath>
          </defs>

          {slices.map((slice, i) => {
            const textRadius = 0.65;
            const textAngleRad = (slice.rotation * Math.PI) / 180;
            const textX = Math.cos(textAngleRad) * textRadius;
            const textY = Math.sin(textAngleRad) * textRadius;

            // Updated logic: Check if a custom image exists independently of the type
            const hasCustomImage = !!slice.prize.imageUrl;
            // Always show an image in IMAGE mode: either Custom or Gold Question Mark
            const displayImage = hasCustomImage ? slice.prize.imageUrl : GOLD_QUESTION_MARK;

            return (
              <g key={i}>
                <path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.02" />
                <g transform={`translate(${textX}, ${textY}) rotate(${slice.rotation + 90})`}>
                  
                  {displayMode === 'IMAGE' ? (
                    <g>
                      {/* White Background Circle */}
                      <circle cx="0" cy="0" r="0.2" fill="white" stroke="white" strokeWidth="0.015" />
                      
                      {/* Image Layer - Using native SVG image tag for stability */}
                      <image 
                        href={displayImage} 
                        x="-0.2" 
                        y="-0.2" 
                        width="0.4" 
                        height="0.4" 
                        preserveAspectRatio="xMidYMid meet" 
                        clipPath="url(#circleClip)"
                      />
                    </g>
                  ) : (
                    // Text Mode
                    <text 
                      x="0" 
                      y="0" 
                      dy="0.05"
                      fontSize="0.14" 
                      fill="white" 
                      textAnchor="middle" 
                      fontWeight="bold"
                      style={{ 
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: 'system-ui, sans-serif'
                      }}
                      transform="rotate(180)"
                    >
                      {slice.text.length > 15 ? slice.text.substring(0, 12) + '..' : slice.text}
                    </text>
                  )}

                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center Cap */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-[6px] border-white z-10 flex items-center justify-center shadow-xl">
        <div className="text-white font-black text-2xl drop-shadow-md tracking-wider">SPIN</div>
      </div>
    </div>
  );
};

export default Wheel;