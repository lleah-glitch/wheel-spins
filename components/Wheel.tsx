import React, { useEffect, useRef, useMemo } from 'react';
import { Prize } from '../types';
import { Gift, Smartphone, Watch, Bike, Coins, Frown, Star, Car } from 'lucide-react';

interface WheelProps {
  prizes: Prize[];
  mustSpin: boolean;
  prizeNumber: number; // Index of the winning prize
  onStopSpinning: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  'Gift': Gift,
  'Smartphone': Smartphone,
  'Watch': Watch,
  'Bike': Bike,
  'Coins': Coins,
  'Frown': Frown,
  'Star': Star,
  'Car': Car
};

const Wheel: React.FC<WheelProps> = ({ prizes, mustSpin, prizeNumber, onStopSpinning }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState(0);
  
  // Determine number of segments
  const segCount = prizes.length;
  const segAngle = 360 / segCount;

  // Generate SVG paths for slices
  const slices = useMemo(() => {
    return prizes.map((prize, i) => {
      const startAngle = i * segAngle;
      const endAngle = (i + 1) * segAngle;

      // Convert polar to cartesian
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
        icon: prize.icon || 'Gift'
      };
    });
  }, [prizes, segCount, segAngle]);

  useEffect(() => {
    if (mustSpin) {
      // Calculate landing rotation
      // We want the winning index to land at -90deg (top of circle in standard CSS rotation, 
      // assuming the wheel starts with index 0 at 0deg-right).
      // Actually, let's align index 0 to right.
      // To land index i at the pointer (let's say pointer is at Right/0deg for simplicity, then we rotate the pointer wrapper).
      
      // Let's assume the pointer is at 270deg (TOP).
      // Current structure: Index 0 starts at 0deg (Right) and goes clockwise.
      // Center of Index i is at: i * segAngle + segAngle/2.
      // We want this angle to be at 270deg (Top) after rotation.
      // Target Rotation = 270 - (Center of Prize).
      // Add extra spins (360 * 5).
      
      const newPrizeAngle = (prizeNumber * segAngle) + (segAngle / 2);
      // We want (CurrentRotation + delta) % 360 to align such that prize is at top.
      // Easier: Just calculate total degrees to rotate to.
      
      const randomOffset = Math.floor(Math.random() * (segAngle * 0.8)) - (segAngle * 0.4); // Add some randomness within the slice
      const extraSpins = 360 * 5; // 5 full spins
      const targetRotation = extraSpins + (270 - newPrizeAngle) + randomOffset;
      
      // We need to add this to the *current* rotation to ensure we don't spin backwards if we reset.
      // But for simplicity, we just set a massive forward rotation. 
      // Since we reset on stop? No, let's accumulate.
      
      // Simpler Logic:
      // Just set the transform.
      setRotation(prev => {
         // Round previous to nearest 360 to avoid "unwinding" visual glitches if needed, but simply adding works for a single spin session.
         // To make it reusable without reset:
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-8 h-10">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[40px] border-t-white drop-shadow-lg filter"></div>
      </div>

      {/* Wheel Container */}
      <div 
        className="w-full h-full rounded-full overflow-hidden border-4 border-gaming-800 shadow-[0_0_50px_rgba(139,92,246,0.3)] relative transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
        style={{ transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={onStopSpinning}
      >
        <svg 
          viewBox="-1 -1 2 2" 
          className="w-full h-full transform rotate-0" 
          style={{ overflow: 'visible' }}
        >
          {slices.map((slice, i) => {
            const Icon = IconMap[slice.icon] || Gift;
            // Calculate text position (approx 0.65 radius out)
            const textRadius = 0.65;
            const textAngleRad = (slice.rotation * Math.PI) / 180;
            const textX = Math.cos(textAngleRad) * textRadius;
            const textY = Math.sin(textAngleRad) * textRadius;

            return (
              <g key={i}>
                <path d={slice.path} fill={slice.color} stroke="#1e293b" strokeWidth="0.01" />
                <g transform={`translate(${textX}, ${textY}) rotate(${slice.rotation})`}>
                  {/* Icon */}
                  <foreignObject x="-0.1" y="-0.1" width="0.2" height="0.2">
                     <div className="flex justify-center items-center h-full text-white drop-shadow-md">
                        <Icon size={24} strokeWidth={2.5} />
                     </div>
                  </foreignObject>
                  {/* Text */}
                  <text 
                    x="0" 
                    y="0.15" 
                    fontSize="0.08" 
                    fill="white" 
                    textAnchor="middle" 
                    fontWeight="bold"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    transform="rotate(90)" // Text runs along radius? No, let's rotate 90 to face center if preferred, or 0 to be upright relative to slice
                  >
                    {slice.text.length > 12 ? slice.text.substring(0, 10) + '..' : slice.text}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center Cap */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gaming-900 rounded-full border-4 border-white z-10 flex items-center justify-center shadow-lg">
        <div className="text-gaming-accent font-bold text-xl">GO</div>
      </div>
    </div>
  );
};

export default Wheel;