export enum ReviewModes {
  FixedInterval = 'FIXED_INTERVAL',
  DefaultSpacedInterval = 'SPACED_INTERVAL',
}

interface SessionCommon {
  nextDueDate?: Date;
  dateCreated?: Date;
  isRoamSrOldPracticeRecord?: boolean;
}

export type Session = {
  reviewMode: ReviewModes;
  repetitions?: number;
  interval?: number;
  eFactor?: number;
  grade?: number;
  intervalMultiplier?: number;
  intervalMultiplierType?: IntervalMultiplierType;
} & SessionCommon;

export interface NewSession extends Omit<Session, 'nextDueDate' | 'grade'> {
  isNew: boolean;
}

export type RecordUid = string;

export interface Records {
  [key: RecordUid]: Session | NewSession;
}

export interface NewRecords {
  [key: RecordUid]: NewSession;
}

export interface CompleteRecords {
  [key: RecordUid]: Session[];
}

export enum IntervalMultiplierType {
  Days = 'Days',
  Weeks = 'Weeks',
  Months = 'Months',
  Years = 'Years',
}
