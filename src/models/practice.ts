import { RecordUid } from './session';

export enum CompletionStatus {
  Finished = 'finished',
  Partial = 'partial',
  Unstarted = 'unstarted',
}
export type Today = {
  tags: {
    [tag: string]: {
      status: CompletionStatus;
      completed: number;
      due: number;
      new: number;
      dueUids: RecordUid[];
      newUids: RecordUid[];
    };
  };
  combinedToday: {
    status: CompletionStatus;
    completed: number;
    due: number;
    new: number;
    dueUids: RecordUid[];
    newUids: RecordUid[];
  };
};

export const TodayInitial: Today = {
  tags: {},
  combinedToday: {
    status: CompletionStatus.Unstarted,
    completed: 0,
    due: 0,
    new: 0,
    dueUids: [],
    newUids: [],
  },
};
