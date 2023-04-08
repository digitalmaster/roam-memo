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

export type RecordUid = string;

export interface Records {
  [key: RecordUid]: Session;
}

export interface NewRecords {
  [key: RecordUid]: NewSession;
}

export interface CompleteRecords {
  [key: RecordUid]: Session[];
}
