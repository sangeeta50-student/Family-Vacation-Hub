import type { Flight } from "./Flight";

export type Trip = {
  name: string;

  destination?: string;
  
  flights: Flight[];
};