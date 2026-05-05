import fetch from "node-fetch";
import crypto from "crypto";
import { Court, TimeSlot } from "./types";

const DAIFO_API = "https://booking.daifo.ai/api";
const APP_KEY = "6zvX9SpR75sy*D7%XyLsY1iWeBiA$Fch";

function md5(s: string): string {
  return crypto.createHash("md5").update(s).digest("hex");
}

function generateTimestamp(): number {
  const now = Date.now();
  const seed = 100 * Math.floor(now / 100);
  const seedStr = seed.toString();
  let digitSum = 0;
  for (const ch of seedStr) digitSum += parseInt(ch, 10);
  const checkSum = (Math.floor(digitSum / 2) % 10) * 10 + (digitSum % 10);
  return seed + checkSum;
}

function makeHeaders(): Record<string, string> {
  const salt = generateTimestamp().toString();
  const sig = md5(md5(APP_KEY) + salt);
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-TIMESTAMP": salt,
    "X-IDEMPOTENCE-KEY": sig,
  };
}

interface DaifoVenueConfig {
  companyId: string;
  storeId: string;
  calendarId: string;
  courts: { id: string; name: string }[];
  openTime: string; // "08:00"
  closeTime: string; // "23:00"
}

export interface DaifoVenue {
  uniqueName: string;
  name: string;
  bookingUrl: string;
  config: DaifoVenueConfig;
}

interface DaifoTimeSlot {
  startDate: string;
  startTime: string;
  endTime: string;
  availabilityCount: number;
  customerId?: string;
}

interface DaifoCourtData {
  serviceId: string;
  serviceName: string;
  date: string;
  timeSlots: DaifoTimeSlot[];
}

interface DaifoAvailResponse {
  data: DaifoCourtData[];
}

export async function fetchDaifoAvailability(
  venue: DaifoVenue,
  date: string
): Promise<Court[]> {
  const { config } = venue;

  const res = await fetch(
    `${DAIFO_API}/appointment/view-public-individual-availabilities`,
    {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        companyId: config.companyId,
        dates: [date],
        storeId: config.storeId,
        calendarId: config.calendarId,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Daifo API error ${res.status}`);
  }

  const json = (await res.json()) as DaifoAvailResponse;
  if (!json.data || json.data.length === 0) return [];

  // Generate all 1-hour time slots for the opening range
  const [openH] = config.openTime.split(":").map(Number);
  const [closeH] = config.closeTime.split(":").map(Number);
  const hours: string[] = [];
  for (let h = openH; h < closeH; h++) {
    hours.push(`${String(h).padStart(2, "0")}:00`);
  }

  // The API returns one element per court with that court's booked slots
  const courts: Court[] = json.data.map((courtData) => {
    // Build set of booked hours for this court
    const bookedHours = new Set<string>();
    for (const slot of courtData.timeSlots) {
      if (slot.customerId) {
        bookedHours.add(slot.startTime);
      }
    }

    // Generate 15-minute slots for every hour in the range
    const slots: TimeSlot[] = [];
    for (const hourStr of hours) {
      const isBooked = bookedHours.has(hourStr);
      const [h] = hourStr.split(":").map(Number);
      for (let offset = 0; offset < 60; offset += 15) {
        const slotH = Math.floor((h * 60 + offset) / 60);
        const slotM = (h * 60 + offset) % 60;
        slots.push({
          time: `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`,
          status: isBooked ? "booked" : "available",
        });
      }
    }

    return {
      id: courtData.serviceId,
      name: courtData.serviceName,
      hasLighting: false,
      slots,
    };
  });

  // Sort courts by name (Court 1, Court 2, ...)
  courts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return courts;
}
