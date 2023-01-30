export interface Session {
  repetitions: number;
  interval: number;
  eFactor: number;
  nextDueDate: Date;
  grade: number;
  dateCreated: Date;
  isRoamSrOldPracticeRecord?: boolean;
}

export interface NewSession extends Omit<Session, 'nextDueDate' | 'grade'> {
  isNew: true;
}

export interface Records {
  [key: string]: Session;
}

export interface NewRecords {
  [key: string]: NewSession;
}

export interface CompleteRecords {
  [key: string]: Session[];
}
