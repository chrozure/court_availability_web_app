import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import venues from "./venues";
import { fetchVenueAvailability } from "./scraper";
import { VenueAvailability } from "./types";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, "..", "public")));

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

// SPA fallback: serve index.html for any non-API route
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
