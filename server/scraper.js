const fetch = require("node-fetch");

const API_BASE = "https://krg-prod.bookable.net.au/api/v2";
const ORG_ID = 1;

const JSON_HEADERS = {
  Accept: "application/json",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: JSON_HEADERS });
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

/**
 * Fetches availability data for a venue on a given date.
 * Returns an object with courts and their time slots.
 */
async function fetchVenueAvailability(venueId, date) {
  const dateStr =
    date instanceof Date ? date.toISOString().split("T")[0] : date;

  // Calculate the next day for the bookings period query
  const nextDate = new Date(dateStr + "T00:00:00");
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  // Fetch courts, bookings, and opening hours in parallel
  const [bookables, bookings, openingHours] = await Promise.all([
    fetchJson(
      `${API_BASE}/venues/${venueId}/bookables?externalOnly=true&excludeResource=true&hideNotInSeason=true&date=${dateStr}&capacity=null`
    ),
    fetchJson(
      `${API_BASE}/venues/${venueId}/bookingbookablesinperiod?fromDate=${dateStr}&toDate=${nextDateStr}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`
    ),
    fetchJson(
      `${API_BASE}/organisations/${ORG_ID}/venues/${venueId}/getopeninghours?fromDate=${dateStr}&toDate=${dateStr}&excludeResource=true`
    ),
  ]);

  // Filter to only tennis courts (must have a "Tennis court ..." activity type)
  const tennisCourts = bookables.filter(
    (b) =>
      b.BookableType === 2 &&
      b.ActivityTypes &&
      b.ActivityTypes.some((at) =>
        (at.name || "").toLowerCase().startsWith("tennis court")
      )
  );

  // Build opening hours lookup: BookableID -> { open, close }
  const hoursMap = {};
  for (const entry of openingHours) {
    if (entry.Value && entry.Value.length > 0) {
      const detail = entry.Value[0];
      if (detail.IsOpen) {
        hoursMap[entry.Key] = {
          open: detail.OpenTime,
          close: detail.CloseTime,
          useSunset: detail.UseSunset,
        };
      }
    }
  }

  // Build bookings lookup: BookableID -> array of { start, end }
  const bookingsMap = {};
  for (const booking of bookings) {
    if (!bookingsMap[booking.BookableID]) {
      bookingsMap[booking.BookableID] = [];
    }
    bookingsMap[booking.BookableID].push({
      start: booking.Start_Date,
      end: booking.End_Date,
    });
  }

  // Generate 15-minute time slots for each court
  const courts = tennisCourts.map((court) => {
    const courtId = court.BookableID;
    const hours = hoursMap[courtId];
    const courtBookings = bookingsMap[courtId] || [];

    // Generate slots from 6am to 10pm (or based on opening hours)
    const slots = generateTimeSlots(dateStr, hours, courtBookings);

    return {
      id: courtId,
      name: court.Name,
      hasLighting: court.Attributes
        ? court.Attributes.some((a) => a.Name === "Lighting" || a.name === "Lighting")
        : false,
      slots,
    };
  });

  // Sort courts by name
  courts.sort((a, b) => a.name.localeCompare(b.name));

  return courts;
}

function generateTimeSlots(dateStr, hours, bookings) {
  const slots = [];
  const stepMinutes = 15;

  // Default range: 6am to 10pm
  let startHour = 6;
  let endHour = 22;
  let endMinute = 0;

  if (hours) {
    const [openH, openM] = hours.open.split(":").map(Number);
    startHour = openH;

    if (!hours.useSunset && hours.close !== "00:00:00") {
      const [closeH, closeM] = hours.close.split(":").map(Number);
      endHour = closeH;
      endMinute = closeM;
    }
  }

  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60 + endMinute;

  for (let mins = startMinutes; mins < endMinutes; mins += stepMinutes) {
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const slotStart = new Date(`${dateStr}T${timeStr}:00`);
    const slotEnd = new Date(slotStart.getTime() + stepMinutes * 60000);

    // Check if this slot overlaps with any booking
    const isBooked = bookings.some((b) => {
      const bookStart = new Date(b.start);
      const bookEnd = new Date(b.end);
      return slotStart < bookEnd && slotEnd > bookStart;
    });

    slots.push({
      time: timeStr,
      status: isBooked ? "booked" : "available",
    });
  }

  return slots;
}

module.exports = { fetchVenueAvailability };
