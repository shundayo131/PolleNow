// frontend/src/components/PollenCard.tsx

import React from 'react';
import { PollenLevel } from '../types/pollen';

interface PollenCardProps {
  type: string;
  pollenData: PollenLevel;
}

const PollenCard: React.FC<PollenCardProps> = ({ type, pollenData }) => {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'very low':
        return '#10b981'; // green
      case 'low':
        return '#10b981'; // green
      case 'moderate':
        return '#f59e0b'; // yellow
      case 'high':
        return '#ef4444'; // red
      case 'very high':
        return '#dc2626'; // dark red
      default:
        return '#6b7280'; // gray
    }
  };

  const formatPollenType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grass':
        return '🌱 Grass';
      case 'tree':
        return '🌳 Tree';
      case 'weed':
        return '🌿 Weed';
      default:
        return type;
    }
  };

  return (
    <div className="pollen-card">
      <div className="pollen-type">{formatPollenType(type)}</div>
      <div 
        className="pollen-level"
        style={{ color: getCategoryColor(pollenData.category) }}
      >
        {pollenData.level !== null ? pollenData.level : '-'}
      </div>
      <div className="pollen-category">{pollenData.category}</div>
      {pollenData.inSeason && (
        <div className="in-season">In Season</div>
      )}
    </div>
  );
};

export default PollenCard;