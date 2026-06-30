import express, { Request, Response } from "express";
import cors from "cors";
import venues from "./venues";
import { fetchVenueAvailability } from "./scraper";
import badmintonVenues, { daifoVenues } from "./badminton-venues";
import { fetchBadmintonAvailability } from "./badminton-scraper";
import { fetchDaifoAvailability } from "./daifo-scraper";
import { VenueAvailability } from "./types";

const app = express();

app.use(cors());
app.use(express.json());

// GET /api/venues - list configured venues
app.get("/api/venues", (_req: Request, res: Response) => {
  res.json(
    venues.map((v) => ({
      id: v.id,
      name: v.name,
      bookingUrl: v.bookingUrl,
    }))
  );
});

// GET /api/availability?date=2026-03-31 - get availability for all venues
app.get("/api/availability", async (req: Request, res: Response) => {
  const date =
    (req.query.date as string) || new Date().toISOString().split("T")[0];

  try {
    const results: VenueAvailability[] = await Promise.all(
      venues.map(async (venue): Promise<VenueAvailability> => {
        try {
          const courts = await fetchVenueAvailability(venue.id, date);
          return {
            venueId: venue.id,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts,
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error(`Error fetching venue ${venue.name}:`, message);
          return {
            venueId: venue.id,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts: [],
            error: message,
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// GET /api/badminton/availability?date=2026-05-05 - get badminton availability
app.get("/api/badminton/availability", async (req: Request, res: Response) => {
  const date =
    (req.query.date as string) || new Date().toISOString().split("T")[0];

  try {
    const nbcResults = await Promise.all(
      badmintonVenues.map(async (venue): Promise<VenueAvailability> => {
        try {
          const courts = await fetchBadmintonAvailability(venue.sportId, date);
          return {
            venueId: venue.sportId,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts,
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error(`Error fetching badminton venue ${venue.name}:`, message);
          return {
            venueId: venue.sportId,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts: [],
            error: message,
          };
        }
      })
    );

    const daifoResults = await Promise.all(
      daifoVenues.map(async (venue, idx): Promise<VenueAvailability> => {
        try {
          const courts = await fetchDaifoAvailability(venue, date);
          return {
            venueId: 1000 + idx,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts,
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error(`Error fetching Daifo venue ${venue.name}:`, message);
          return {
            venueId: 1000 + idx,
            venueName: venue.name,
            bookingUrl: venue.bookingUrl,
            date,
            courts: [],
            error: message,
          };
        }
      })
    );

    res.json([...nbcResults, ...daifoResults]);
  } catch (err) {
    console.error("Error fetching badminton availability:", err);
    res.status(500).json({ error: "Failed to fetch badminton availability" });
  }
});

export default app;
