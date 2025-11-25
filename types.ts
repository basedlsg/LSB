export interface ScrollState {
  progress: number;
  currentSection: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export enum SectionId {
  VOID = 0,
  FIRST_TOOL = 1,
  SHARED_LEARNING = 2,
  NEW_REALITY = 3,
  INVITATION = 4
}
