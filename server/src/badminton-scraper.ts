import fetch from "node-fetch";
import { Court, TimeSlot } from "./types";

const YEPBOOKING_AJAX =
  "https://nbc.yepbooking.com.au/ajax/ajax.schema.php";

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
 * The HTML returned by yepbooking is malformed (missing </tr> tags),
 * which breaks DOM parsers. We use regex-based extraction instead.
 */
export async function fetchBadmintonAvailability(
  sportId: number,
  date: string
): Promise<Court[]> {
  const d = new Date(date + "T00:00:00");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const url = `${YEPBOOKING_AJAX}?day=${day}&month=${month}&year=${year}&id_sport=${sportId}&event=pageLoad&tab_type=normal&timetableWidth=780&schema_fixed_date=`;

  const res = await fetch(url);
  const html = await res.text();

  // --- Extract court names from lane table rows ---
  const laneRegex = /trSchemaLane_(\d+)[\s\S]*?<span>(.*?)<\/span>/g;
  const courtInfos: { laneId: string; name: string }[] = [];
  let laneMatch;
  while ((laneMatch = laneRegex.exec(html)) !== null) {
    // Only take the first occurrence of each lane (from the lane table)
    if (!courtInfos.some((c) => c.laneId === laneMatch![1])) {
      courtInfos.push({ laneId: laneMatch[1], name: laneMatch[2].trim() });
    }
  }
  if (courtInfos.length === 0) return [];

  // --- Extract time headers ---
  // They appear as <td colspan="1">10:00am</td> in tr.times inside schemaIndividual
  const timesMatch = html.match(
    /schemaIndividual[\s\S]*?<tr class="times">([\s\S]*?)<\/tr>/
  );
  if (!timesMatch) return [];

  const timeHeaders: string[] = [];
  const thRegex = /<td[^>]*>(\d{1,2}:\d{2}(?:am|pm))<\/td>/gi;
  let thMatch;
  while ((thMatch = thRegex.exec(timesMatch[1])) !== null) {
    timeHeaders.push(parseAmPmTo24h(thMatch[1]));
  }
  if (timeHeaders.length === 0) return [];

  // --- Parse each court's row from the data table ---
  // The data table rows also use trSchemaLane_XX classes.
  // We need the SECOND occurrence of each lane (first is in lane table).
  const courts: Court[] = [];

  for (const info of courtInfos) {
    // Find the second occurrence of trSchemaLane_XX (the data row)
    const rowPattern = new RegExp(
      `trSchemaLane_${info.laneId}">(.*?)(?=<tr class="|$)`,
      "s"
    );
    // Find all occurrences
    const allOccurrences: string[] = [];
    const globalPattern = new RegExp(
      `trSchemaLane_${info.laneId}">(.*?)(?=<tr |$)`,
      "gs"
    );
    let rowMatch;
    while ((rowMatch = globalPattern.exec(html)) !== null) {
      allOccurrences.push(rowMatch[1]);
    }

    // The second occurrence is the data row (first is the lane label row)
    const dataRowHtml = allOccurrences.length >= 2 ? allOccurrences[1] : null;
    if (!dataRowHtml) continue;

    // Extract each <td> with its title and class
    const tdRegex = /<td\b([^>]*)>/g;
    const hourlySlots: TimeSlot[] = [];
    let timeIdx = 0;
    let tdMatch;

    while ((tdMatch = tdRegex.exec(dataRowHtml)) !== null) {
      const attrs = tdMatch[1];

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
      id: info.laneId,
      name: info.name,
      hasLighting: false,
      slots,
    });
  }

  courts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return courts;
}
