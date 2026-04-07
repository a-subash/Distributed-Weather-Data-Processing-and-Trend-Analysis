# Distributed Weather Data Processing and Trend Analysis

## Prerequisites
- Node 18+
- Python 3.11+
- Docker (optional, for one-command setup)

## Quick Start (Docker)
1. Export your OpenWeather API key if available  
   - Windows PowerShell: `$env:OPENWEATHER_API_KEY="your_key"`
2. In project root, run: `docker-compose up`
3. Open frontend: http://localhost:5173  
   Backend API: http://localhost:8000/docs

## Manual Setup
### Backend
1. `python -m venv .venv && .venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (macOS/Linux)
2. `pip install -r backend/requirements.txt`
4. Optional: start MongoDB locally on `mongodb://localhost:27017`. If not running, the app falls back to in-memory storage.
5. `python -m uvicorn backend.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173

## Features
- Live weather, forecast, AQI via backend only
- Kafka simulation with asyncio Queue
- Pandas processing and anomaly detection with severity
- ARIMA forecasting with graceful fallback
- PySpark batch job with pandas fallback
- Premium dark UI with Tailwind, Recharts, animations

## Endpoints
- GET /api/weather/live
- GET /api/weather/city/{city}
- GET /api/weather/forecast/{city}
- GET /api/weather/aqi/{city}
- GET /api/weather/anomalies
- GET /api/weather/history
- GET /api/predict/{city}

## Notes
- If external API or MongoDB are unavailable, the app returns sample data and in-memory results to ensure stability.
- Default city is Hyderabad in the UI.
