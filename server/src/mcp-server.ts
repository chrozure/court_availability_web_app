import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import venues from "./venues";
import badmintonVenues, { daifoVenues } from "./badminton-venues";
import { fetchVenueAvailability } from "./scraper";
import { fetchBadmintonAvailability } from "./badminton-scraper";
import { fetchDaifoAvailability } from "./daifo-scraper";
import { Court } from "./types";

const server = new McpServer({
  name: "court-availability",
  version: "1.0.0",
});

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, "0")}${suffix}`;
}

function getAvailableRanges(
  courts: Court[],
  filterTime?: string
): { courtName: string; ranges: string[] }[] {
  const results: { courtName: string; ranges: string[] }[] = [];

  for (const court of courts) {
    const availableSlots = court.slots.filter((s) => s.status === "available");
    if (availableSlots.length === 0) continue;

    // If a specific time is requested, check if court is available at that time
    if (filterTime) {
      const isAvail = availableSlots.some((s) => s.time === filterTime);
      if (!isAvail) continue;
    }

    // Group consecutive available slots into ranges
    const ranges: string[] = [];
    let rangeStart = availableSlots[0].time;
    let prev = availableSlots[0].time;

    for (let i = 1; i < availableSlots.length; i++) {
      const [ph, pm] = prev.split(":").map(Number);
      const [ch, cm] = availableSlots[i].time.split(":").map(Number);
      const prevMins = ph * 60 + pm;
      const curMins = ch * 60 + cm;

      if (curMins - prevMins > 15) {
        const endMins = prevMins + 15;
        const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
        const endM = String(endMins % 60).padStart(2, "0");
        ranges.push(
          `${formatTime(rangeStart)} - ${formatTime(`${endH}:${endM}`)}`
        );
        rangeStart = availableSlots[i].time;
      }
      prev = availableSlots[i].time;
    }
    // Close final range
    const [lastH, lastM] = prev.split(":").map(Number);
    const endMins = lastH * 60 + lastM + 15;
    const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
    const endM = String(endMins % 60).padStart(2, "0");
    ranges.push(
      `${formatTime(rangeStart)} - ${formatTime(`${endH}:${endM}`)}`
    );

    results.push({ courtName: court.name, ranges });
  }

  return results;
}

server.tool(
  "get_available_courts",
  "Find available tennis and badminton courts. Returns which courts are free, optionally filtered by a specific time.",
  {
    date: z
      .string()
      .optional()
      .describe("Date in YYYY-MM-DD format. Defaults to today."),
    time: z
      .string()
      .optional()
      .describe(
        "Time in HH:MM 24-hour format (e.g. '18:00'). If provided, only returns courts available at that time."
      ),
    sport: z
      .enum(["tennis", "badminton", "all"])
      .optional()
      .describe("Filter by sport. Defaults to 'all'."),
  },
  async ({ date, time, sport }) => {
    const queryDate = date || todayStr();
    const filterSport = sport || "all";
    const lines: string[] = [];

    // Normalize time to nearest 15-min slot
    let filterTime: string | undefined;
    if (time) {
      const [h, m] = time.split(":").map(Number);
      const rounded = Math.floor(m / 15) * 15;
      filterTime = `${String(h).padStart(2, "0")}:${String(rounded).padStart(2, "0")}`;
    }

    // Tennis
    if (filterSport === "tennis" || filterSport === "all") {
      for (const venue of venues) {
        try {
          const courts = await fetchVenueAvailability(venue.id, queryDate);
          const available = getAvailableRanges(courts, filterTime);
          if (available.length > 0) {
            lines.push(`🎾 ${venue.name}:`);
            for (const c of available) {
              lines.push(`  ${c.courtName}: ${c.ranges.join(", ")}`);
            }
            lines.push(`  Book: ${venue.bookingUrl}`);
            lines.push("");
          }
        } catch {
          lines.push(`🎾 ${venue.name}: Error fetching data`);
        }
      }
    }

    // Badminton
    if (filterSport === "badminton" || filterSport === "all") {
      for (const venue of badmintonVenues) {
        try {
          const courts = await fetchBadmintonAvailability(
            venue.sportId,
            queryDate
          );
          const available = getAvailableRanges(courts, filterTime);
          if (available.length > 0) {
            lines.push(`🏸 ${venue.name}:`);
            for (const c of available) {
              lines.push(`  ${c.courtName}: ${c.ranges.join(", ")}`);
            }
            lines.push(`  Book: ${venue.bookingUrl}`);
            lines.push("");
          }
        } catch {
          lines.push(`🏸 ${venue.name}: Error fetching data`);
        }
      }

      for (const venue of daifoVenues) {
        try {
          const courts = await fetchDaifoAvailability(venue, queryDate);
          const available = getAvailableRanges(courts, filterTime);
          if (available.length > 0) {
            lines.push(`🏸 ${venue.name}:`);
            for (const c of available) {
              lines.push(`  ${c.courtName}: ${c.ranges.join(", ")}`);
            }
            lines.push(`  Book: ${venue.bookingUrl}`);
            lines.push("");
          }
        } catch {
          lines.push(`🏸 ${venue.name}: Error fetching data`);
        }
      }
    }

    if (lines.length === 0) {
      const timeNote = filterTime ? ` at ${formatTime(filterTime)}` : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `No available courts found on ${queryDate}${timeNote}.`,
          },
        ],
      };
    }

    const header = filterTime
      ? `Available courts on ${queryDate} at ${formatTime(filterTime)}:`
      : `Available courts on ${queryDate}:`;

    return {
      content: [
        { type: "text" as const, text: `${header}\n\n${lines.join("\n")}` },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
