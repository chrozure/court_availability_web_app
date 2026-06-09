import fetch from "node-fetch";
import { Court, TimeSlot } from "./types";

const YEPBOOKING_BASE = "https://nbc.yepbooking.com.au";
const YEPBOOKING_AJAX = `${YEPBOOKING_BASE}/ajax/ajax.schema.php`;

/**
 * Convert "10:00am" / "1:00pm" to "10:00" / "13:00".
 */
function parseAmPmTo24h(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m) return "00:00";
  let h = parseInt(m[1]);
  const min = m[2];
  const period = m[3].toLowerCase();
  if (period === "pm" && h !== 12) h += 12;
  if (period === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

/**
 * Fetches badminton court availability from yepbooking for a given
 * sport/venue ID on a given date.
 *
 * The endpoint requires a POST request with a valid session cookie.
 * The HTML returned is malformed (missing </tr> tags), so we use
 * regex-based extraction.
 */
export async function fetchBadmintonAvailability(
  sportId: number,
  date: string
): Promise<Court[]> {
  const d = new Date(date + "T00:00:00");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  // First hit the main page to obtain a session cookie
  const mainRes = await fetch(YEPBOOKING_BASE);
  const setCookieHeader = mainRes.headers.get("set-cookie");
  const sessionCookie = setCookieHeader?.match(/PHPSESSID=[^;]+/)?.[0] ?? "";

  // POST to the AJAX endpoint (GET no longer returns data)
  const body = new URLSearchParams({
    day: String(day),
    month: String(month),
    year: String(year),
    id_sport: String(sportId),
    event: "pageLoad",
    tab_type: "normal",
    timetableWidth: "780",
    schema_fixed_date: "",
  });

  const res = await fetch(YEPBOOKING_AJAX, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${YEPBOOKING_BASE}/`,
      Cookie: sessionCookie,
    },
    body: body.toString(),
  });
  const html = await res.text();

  // --- Extract time headers ---
  // They appear as <td colspan="1">10:00am</td> in tr.times inside <thead>
  const timesMatch = html.match(
    /<tr class="times">([\s\S]*?)(?:<\/tr>|<tr[\s>])/
  );
  if (!timesMatch) return [];

  const timeHeaders: string[] = [];
  const thRegex = /<td[^>]*>(\d{1,2}:\d{2}(?:am|pm))<\/td>/gi;
  let thMatch;
  while ((thMatch = thRegex.exec(timesMatch[1])) !== null) {
    timeHeaders.push(parseAmPmTo24h(thMatch[1]));
  }
  if (timeHeaders.length === 0) return [];

  // --- Parse each court row ---
  // Each row is: <tr class="trSchemaLane_XX"><th ...><span>CourtName</span></th><td>...</td>...
  // Rows are NOT closed with </tr>, so we match from one trSchemaLane to the next.
  const rowRegex =
    /trSchemaLane_(\d+)">([\s\S]*?)(?=<tr class="trSchemaLane_|<tr class="prices"|$)/g;
  const courts: Court[] = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const laneId = rowMatch[1];
    const rowHtml = rowMatch[2];

    // Extract court name from <th><div><span>...</span></div></th>
    const nameMatch = rowHtml.match(/<th[^>]*>[\s\S]*?<span>(.*?)<\/span>/);
    if (!nameMatch) continue;
    const courtName = nameMatch[1].trim();

    // Extract each <td> with its title/class and content
    const tdRegex = /<td\b([^>]*)>([\s\S]*?)(?=<td\b|<tr[\s>]|$)/g;
    const hourlySlots: TimeSlot[] = [];
    let timeIdx = 0;
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const attrs = tdMatch[1];
      const cellContent = tdMatch[2];

      const titleMatch = attrs.match(/title="([^"]*)"/);
      const title = titleMatch ? titleMatch[1] : "";

      const classMatch = attrs.match(/class="([^"]*)"/);
      const cls = classMatch ? classMatch[1] : "";

      const colspanMatch = attrs.match(/colspan="(\d+)"/);
      const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;

      let status: "booked" | "available" | "closed";
      if (title.includes("Closed")) {
        status = "closed";
      } else if (cls.includes("booked")) {
        status = "booked";
      } else {
        // "old" class = was available but past, empty link = currently available
        status = "available";
      }

      for (
        let i = 0;
        i < colspan && timeIdx < timeHeaders.length;
        i++, timeIdx++
      ) {
        hourlySlots.push({ time: timeHeaders[timeIdx], status });
      }
    }

    // Expand each 1-hour slot into four 15-minute slots
    const slots: TimeSlot[] = [];
    for (const hs of hourlySlots) {
      const [h] = hs.time.split(":").map(Number);
      for (let offset = 0; offset < 60; offset += 15) {
        const totalMin = h * 60 + offset;
        const slotH = Math.floor(totalMin / 60);
        const slotM = totalMin % 60;
        slots.push({
          time: `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`,
          status: hs.status,
        });
      }
    }

    courts.push({
      id: laneId,
      name: courtName,
      hasLighting: false,
      slots,
    });
  }

  courts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return courts;
}
