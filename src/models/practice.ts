import { RecordUid } from './session';

export enum CompletionStatus {
  Finished = 'finished',
  Partial = 'partial',
  Unstarted = 'unstarted',
}

export enum RenderMode {
  Normal = 'normal',
  AnswerFirst = 'answerFirst',
}

export type Today = {
  tags: {
    [tag: string]: {
      status: CompletionStatus;
      due: number;
      new: number;
      dueUids: RecordUid[];
      newUids: RecordUid[];
      completed: number;
      completedUids: RecordUid[];
      completedDue: number;
      completedNew: number;
      completedDueUids: RecordUid[];
      completedNewUids: RecordUid[];
      renderMode: RenderMode;
    };
  };
  combinedToday: {
    status: CompletionStatus;
    due: number;
    new: number;
    dueUids: RecordUid[];
    newUids: RecordUid[];
    completed: number;
    completedUids: RecordUid[];
    completedDue: number;
    completedNew: number;
    completedDueUids: RecordUid[];
    completedNewUids: RecordUid[];
  };
};

export const TodayInitial: Today = {
  tags: {},
  combinedToday: {
    status: CompletionStatus.Unstarted,
    due: 0,
    new: 0,
    dueUids: [],
    newUids: [],
    completed: 0,
    completedUids: [],
    completedDue: 0,
    completedDueUids: [],
    completedNew: 0,
    completedNewUids: [],
  },
};
