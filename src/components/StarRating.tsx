import React from 'react';

interface StarRatingProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ score, size = 'md' }: StarRatingProps) {
  // 确定星星大小
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // 生成5个星星
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    let fillPercentage = 0;
    
    if (score !== null) {
      if (starNumber <= Math.floor(score)) {
        fillPercentage = 100;
      } else if (starNumber === Math.ceil(score) && score % 1 !== 0) {
        fillPercentage = (score % 1) * 100;
      }
    }

    return (
      <div key={starNumber} className={`relative inline-block ${sizeClasses[size]}`}>
        {/* 背景星星（灰色） */}
        <span className="text-gray-300">★</span>
        {/* 填充星星（黄色） */}
        {score !== null && (
          <span 
            className="absolute top-0 left-0 text-yellow-400 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            ★
          </span>
        )}
      </div>
    );
  });

  return <div className="flex items-center">{stars}</div>;
}
