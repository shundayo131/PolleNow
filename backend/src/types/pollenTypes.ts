export interface PollenTypeInfo {
  code: string;
  displayName: string;
  healthRecommendations?: string[];
  inSeason?: boolean;
  indexInfo?: {
    code: string;
    displayName: string;
    value: number;
    category: string;
    indexDescription: string;
    color: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
}

export interface PlantInfo {
  code: string;
  displayName: string;
  inSeason?: boolean;
  indexInfo?: {
    code: string;
    displayName: string;
    value: number;
    category: string;
    indexDescription: string;
    color: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
}

export interface DailyInfo {
  date: {
    year: number;
    month: number;
    day: number;
  };
  pollenTypeInfo: PollenTypeInfo[];
  plantInfo: PlantInfo[];
}

export interface PollenForecastResponse {
  dailyInfo: DailyInfo[];
  regionCode?: string;
}