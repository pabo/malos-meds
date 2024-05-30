export type Dose = {
  start: number;
  duration: number;
};

export type Med = {
  name?: string;
  color?: string;
  doses: Dose[];
};

export type Payload = {
  petName?: string;
  startYear?: number;
  startMonth?: number;
  meds: Med[];
};

export type GridLocation = {
  row: number;
  col: number;
} | null;
