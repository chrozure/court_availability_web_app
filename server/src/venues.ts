import { Venue } from "./types";

// Configuration for venues to fetch from bookable.net.au
// To add a new venue, just add a new entry with id, name, and bookingUrl.
const venues: Venue[] = [
  {
    id: 44,
    name: "Roseville Park Tennis Courts",
    bookingUrl: "https://krg.bookable.net.au/venues/44/roseville-park-tennis-courts",
  },
  {
    id: 50,
    name: "St Ives Village Green Tennis Courts",
    bookingUrl: "https://krg.bookable.net.au/venues/50/st-ives-village-green-tennis-courts",
  },
  {
    id: 8,
    name: "Lindfield Soldiers Memorial Park Tennis Courts",
    bookingUrl: "https://krg.bookable.net.au/venues/8/lindfield-soldiers-memorial-park-tennis-courts",
  },
  {
    id: 52,
    name: "Turramurra Memorial Park Tennis Courts",
    bookingUrl: "https://krg.bookable.net.au/venues/52/turramurra-memorial-park-tennis-courts",
  },
];

export default venues;
