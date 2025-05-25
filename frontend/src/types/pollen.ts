export interface PollenLevel {
  level: number | null;
  category: string;
  inSeason: boolean;
  color?: {
    red?: number;
    green?: number;
    blue?: number;
  };
}

export interface DayForecast {
  date: string;
  dayName: string;
  pollenLevels: {
    grass: PollenLevel;
    tree: PollenLevel;
    weed: PollenLevel;
  };
  healthRecommendations: string[];
}

export interface PollenForecastData {
  location: {
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  forecast: DayForecast[];
  todaySummary: DayForecast;
  meta: {
    regionCode: string;
    totalDays: number;
    daysRequested: number;
    timestamp: string;
  };
}

export interface PollenApiResponse {
  success: boolean;
  data: PollenForecastData;
}

export interface LocationData {
  _id: string;
  userId: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}