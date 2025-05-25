### PolleNow
A personalized pollen forecast web application that helps users manage allergies by providing location-based pollen data and health recommendations.

### Overview
PolleNow allows users to save their location and receive real-time pollen forecasts for grass, tree, and weed pollen. The app displays current conditions, 5-day forecasts, and personalized health recommendations based on Google's Pollen API data.

### Key features
- User authenticaiton: JWT-based login/registration 
- Location management: save user's location for personalized forecasts 
- Real-time pollen data: Current and 5 day pollen forecasts 
- Health recommendation: Personalized tips based on pollen levels

### Tech stack
- Frontend: React, React Router, Axios, Vite
- Backend: Node.js, AWS Lambda, MongoDB, JWT
- External APIs: Google Pollen API, Google Maps Geocoding API

### Quick start
```backend
cd backend
npm install
cp .env  # Add your API keys
npx serverless offline
```

```frontend
cd frontend
npm install
npm run dev
```

### API endpoints

| Method | Endpoint | Description | 
|--------|----------|-------------|
| `POST` | `/auth/register` | Create user account |
| `POST` | `/auth/login` | User login | 
| `POST` | `/auth/logout` | User logout | 
| `POST` | `/auth/refresh-token` | Refresh access token | 
| `POST` | `/location` | Save user location (ZIP code) | 
| `GET` | `/location` | Get saved location | 
| `DELETE` | `/location` | Delete saved location | 
| `GET` | `/pollen/forecast?days=5` | Get pollen forecast (requires saved location) | 