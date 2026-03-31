# Tennis Court Availability

A web app that shows tennis court availability across multiple venues in the Ku-ring-gai area (Sydney, Australia) on a single page. Data is fetched from the [bookable.net.au](https://krg.bookable.net.au/) booking platform.

## Venues

- Roseville Park Tennis Courts
- St Ives Village Green Tennis Courts
- Lindfield Soldiers Memorial Park Tennis Courts
- Turramurra Memorial Park Tennis Courts

New venues can be added by editing `server/venues.js`.

## Features

- Visual timeline showing availability for every court at each venue
- Date picker to browse different days
- Past time slots are visually distinguished (grey = was available, muted pink = was booked)
- Links to the original booking site for each venue
- Refresh button to re-fetch availability

## Prerequisites

- Node.js 20+

## Setup

Install dependencies for both the server and client:

```bash
cd server
npm install

cd ../client
npm install
```

## Running (development)

Start the backend server (port 3001):

```bash
cd server
npx tsx src/index.ts
```

Start the frontend dev server (port 5173):

```bash
cd client
npx vite
```

Then open http://localhost:5173 in your browser.

## Running (production)

Build the frontend and start the server:

```bash
npm run build
npm start
```

Then open http://localhost:3001 in your browser. The Express server serves both the API and the built frontend.

## Deploying

This app is designed to deploy as a single process. For platforms like **Render**, **Railway**, or **Fly.io**:

1. Push the repo to GitHub
2. Connect the repo on your chosen platform
3. Set the build and start commands:
   - **Install**: `npm run install:all`
   - **Build**: `npm run build`
   - **Start**: `npm start`
4. Set the `PORT` environment variable if required by the platform (most set it automatically)

## Adding a new venue

1. Find the venue on [krg.bookable.net.au](https://krg.bookable.net.au/) and note the venue ID from the URL (e.g. `/venues/44/...` → ID is `44`)
2. Add an entry to `server/venues.js`:
   ```js
   {
     id: 44,
     name: "Venue Name",
     bookingUrl: "https://krg.bookable.net.au/venues/44/venue-slug",
   }
   ```
3. Restart the backend server

## Project structure

```
server/              Express backend (TypeScript)
  src/
    index.ts         API server (port 3001)
    scraper.ts       Fetches data from bookable.net.au API
    venues.ts        Venue configuration
    types.ts         Shared type definitions
  dist/              Compiled JS output
  public/            Built frontend (generated)

client/              React frontend (Vite + TypeScript)
  src/
    App.tsx                Main app with date picker and refresh
    types.ts               Shared type definitions
    components/
      DatePicker.tsx       Date navigation
      VenueTimeline.tsx    Venue section with legend
      CourtTimeline.tsx    Horizontal timeline for a single court
    index.css              Styles
```
