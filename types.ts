export interface Coordinates {
  x: number;
  y: number;
}

export enum MissionStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  COMPLETED = 'COMPLETED',
}

export type GameMode = 'HEROES' | 'ZOMBIES';

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objectives: Objective[]; 
  zoneId: number;
  position: Coordinates;
  status: MissionStatus;
  dependencies: string[]; // IDs of missions that must be completed first
  locationState?: string; // The specific US State name
  gameMode: GameMode; // New field: determines which map/mode this mission belongs to
}

export interface BossZone {
  id: number;
  name: string;
  bossName: string;
  color: string;
  description: string;
}

export interface GameState {
  missions: Mission[];
  selectedMissionId: string | null;
}

export interface StateFeature {
  id: string; // State FIPS code or name
  type: string;
  properties: {
    name: string;
  };
  geometry: any;
}

export interface PersonalObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Hero {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  personalObjectives: PersonalObjective[];
  assignedMissionId?: string | null; // ID of the main map mission assigned to this hero
}