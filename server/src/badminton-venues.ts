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

export default badmintonVenues;
