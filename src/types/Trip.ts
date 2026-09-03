import type { Flight } from "./Flight";
import type { Activity } from "./Activity";

export type Hotel = {
  id?: string;

  updatedAt?: string;

  deletedAt?: string;

  name?: string;
  address?: string;
  phone?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  notes?: string;
};

export type CarRental = {
  id?: string;

  updatedAt?: string;

  deletedAt?: string;

  company?: string;
  vehicleType?: string;
  vehicle?: string;
  pickupLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnLocation?: string;
  returnDate?: string;
  returnTime?: string;
  confirmationNumber?: string;
  notes?: string;
};

export type Trip = {
  id?: string;

  sortOrder?: number;

  name: string;

  destinationCity?: string;

  flights: Flight[];

  hotels: Hotel[];

  cars: CarRental[];

  activities: Activity[];
};
