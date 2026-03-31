export interface TimeSlot {
  time: string;
  status: "booked" | "available" | "closed";
}

export interface Court {
  id: string;
  name: string;
  hasLighting: boolean;
  slots: TimeSlot[];
}

export interface VenueAvailability {
  venueId: number;
  venueName: string;
  bookingUrl: string;
  date: string;
  courts: Court[];
  error?: string;
}
