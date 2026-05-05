import { DaifoVenue } from "./daifo-scraper";

export interface BadmintonVenue {
  sportId: number;
  name: string;
  bookingUrl: string;
}

const badmintonVenues: BadmintonVenue[] = [
  {
    sportId: 7,
    name: "NBC Badminton - MQ Park",
    bookingUrl: "https://nbc.yepbooking.com.au/",
  },
];

export const daifoVenues: DaifoVenue[] = [
  {
    uniqueName: "phoenix",
    name: "Phoenix Badminton",
    bookingUrl: "https://booking.daifo.ai/phoenix/booking",
    config: {
      companyId: "dde69b6d-10ec-4246-a7a9-93da20561445",
      storeId: "af73f1a4-7ee1-4f16-8096-c312b4e0cfdd",
      calendarId: "b9162cd4-9f3d-4808-9c6b-990f6406a909",
      courts: [
        { id: "0e601026-39e5-49f6-9bd3-ba877fba095a", name: "Court 1" },
        { id: "acf73120-ace7-4d16-9c1f-cd25d7c03ab8", name: "Court 2" },
        { id: "457d68f7-9045-4957-9991-13155b9b254b", name: "Court 3" },
        { id: "a315345f-e0c2-43ad-9dcb-ec6a2574365a", name: "Court 4" },
        { id: "1fab0836-2b1a-4e65-9890-869e2ac3f63b", name: "Court 5" },
        { id: "27815af9-6e90-423d-bb51-87eb5e59c53c", name: "Court 6" },
        { id: "e87fd3a0-18f7-4dc9-bf10-d1c9d7ea566b", name: "Court 7" },
      ],
      openTime: "08:00",
      closeTime: "23:00",
    },
  },
];

export default badmintonVenues;
