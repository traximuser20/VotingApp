# Cat vs Dog Vote

A full-stack voting app built with Vue 3, Express, and MongoDB.

## Tech Stack

- **Frontend:** Vue 3, Vite, Tailwind CSS
- **Backend:** Express 5, Mongoose
- **Database:** MongoDB

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Make sure MongoDB is running, then start the dev server:
   ```bash
   npm run dev
   ```

Frontend: http://localhost:5173  
API: http://localhost:5000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/votes` | Get current vote counts |
| POST | `/api/votes` | Cast a vote (`{ "choice": "cat" \| "dog" }`) |
| DELETE | `/api/votes` | Reset all votes (requires `x-delete-secret` header) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cat-dog-vote` |
| `DELETE_SECRET` | Secret token for reset endpoint | required |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
