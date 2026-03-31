export interface Venue {
  id: number;
  name: string;
  bookingUrl: string;
}

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

// Bookable.net.au API types
export interface BookableActivityType {
  activityTypeId: number;
  name: string;
}

export interface BookableAttribute {
  AttributeID: number;
  Icon: string;
  Name: string;
  name?: string;
  OrganisationID: number;
}

export interface Bookable {
  BookableID: string;
  BookableType: number;
  Name: string;
  ActivityTypes: BookableActivityType[];
  Attributes: BookableAttribute[];
}

export interface Booking {
  BookableID: string;
  Start_Date: string;
  End_Date: string;
}

export interface OpeningHourDetail {
  IsOpen: boolean;
  OpenTime: string;
  CloseTime: string;
  UseSunset: boolean | null;
}

export interface OpeningHourEntry {
  Key: string;
  Value: OpeningHourDetail[];
}

export interface Hours {
  open: string;
  close: string;
  useSunset: boolean | null;
}

export interface BookingPeriod {
  start: string;
  end: string;
}
