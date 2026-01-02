
import { Machine, MachineStatus, MachineType } from './types';

export const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E";

export const DEFAULT_WASHER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z'/%3E%3C/svg%3E";

export const DEFAULT_DRYER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3.5-6c0 1.93-1.57 3.5-3.5 3.5S8.5 13.93 8.5 12 10.07 8.5 12 8.5s3.5 1.57 3.5 3.5zM7 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z'/%3E%3C/svg%3E";

export const DEFAULT_GUIDE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748B'%3E%3Cpath d='M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z'/%3E%3C/svg%3E";

export const INITIAL_MACHINES: Machine[] = [
  { id: 'W1', name: 'Washer 01', type: MachineType.WASHER, status: MachineStatus.AVAILABLE },
  { id: 'W2', name: 'Washer 02', type: MachineType.WASHER, status: MachineStatus.AVAILABLE },
  { id: 'W3', name: 'Washer 03', type: MachineType.WASHER, status: MachineStatus.AVAILABLE },
  { id: 'W4', name: 'Washer 04', type: MachineType.WASHER, status: MachineStatus.AVAILABLE },
  { id: 'D1', name: 'Dryer 01', type: MachineType.DRYER, status: MachineStatus.AVAILABLE },
  { id: 'D2', name: 'Dryer 02', type: MachineType.DRYER, status: MachineStatus.AVAILABLE },
  { id: 'D3', name: 'Dryer 03', type: MachineType.DRYER, status: MachineStatus.AVAILABLE },
  { id: 'D4', name: 'Dryer 04', type: MachineType.DRYER, status: MachineStatus.AVAILABLE },
];
