# Football Streaming App

A mobile application for streaming live football matches with real-time scores, match listings, and user authentication.

## Project Structure

```
streaming-app/
├── mobile/          # React Native Expo app
├── backend/         # NestJS API server
└── docs/            # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- Expo CLI (for mobile development)

### Installation

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma migrate dev
npm run start:dev
```

#### Mobile App
```bash
cd mobile
npm install
npm start
```

## Development

See [2-WEEK-PLAN.md](./2-WEEK-PLAN.md) for detailed development roadmap.

## Features

- 🔐 User Authentication
- 📺 Live Match Streaming
- ⚽ Live Scores
- 📋 Match Listings
- ⭐ Favorites
- 👤 User Profile

## Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma
- **Streaming**: HLS/DASH
- **Auth**: JWT

## License

Ensure proper licensing for streaming content before production use.
