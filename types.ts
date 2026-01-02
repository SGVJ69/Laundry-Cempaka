
export enum MachineType {
  WASHER = 'WASHER',
  DRYER = 'DRYER'
}

export enum MachineStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  ownerId?: string; // Track who owns the current session
  remainingMinutes?: number;
}

export type Page = 'HOME' | 'AVAILABILITY' | 'CONFIRM_BOOKING' | 'USER_GUIDE' | 'SUCCESS' | 'TIMER_VIEW' | 'THANK_YOU';

export interface ActiveBooking {
  machineId: string;
  machineName: string;
  type: MachineType;
  startTime: number;
  durationMinutes: number;
}
