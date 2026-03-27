export interface Person {
  id: string;
  name: string;
  rank: string;
  militaryNumber: string;
  received: boolean;
  date: string | null;
  time: string | null;
  baseAmount: number;
  bonus: number;
  totalAmount: number;
}

export interface Department {
  id: number;
  name: string;
  persons: Person[];
}

export interface SystemState {
  departments: Department[];
  covenant: number;
  lastUpdate: string;
}

export const BASE_AMOUNT = 4000;
