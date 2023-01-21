export interface Session {
  repetitions: number;
  interval: number;
  eFactor: number;
  nextDueDate: Date;
  grade: number;
  dateCreated: Date;
  isRoamSrOldPracticeRecord?: boolean;
}

export interface Records {
  [key: string]: Session[];
}
