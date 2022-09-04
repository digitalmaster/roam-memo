import { savePracticeData } from '~/queries';
import * as dateUtils from '~/utils/date';

const supermemo = (item, grade) => {
  let nextInterval;
  let nextRepetition;
  let nextEfactor;

  if (grade === 0) {
    // If we completely forgot we should review again ASAP.
    nextInterval = 0;
    nextRepetition = 0;
  } else if (grade < 3) {
    nextInterval = 1;
    nextRepetition = 0;
  } else {
    // grade >= 3
    if (item.repetition === 0) {
      nextInterval = 1;
      nextRepetition = 1;
    } else if (item.repetition === 1) {
      nextInterval = 6;
      nextRepetition = 2;
    } else {
      nextInterval = Math.round(item.interval * item.efactor);
      nextRepetition = item.repetition + 1;
    }
  }

  nextEfactor = item.efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  if (nextEfactor < 1.3) nextEfactor = 1.3;

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    efactor: nextEfactor,
  };
};

export const getPracticeResultData = ({ grade, interval, repetitions, eFactor }) => {
  const supermemoInput = {
    interval,
    repetition: repetitions,
    efactor: eFactor,
  };

  // call supermemo API
  const supermemoResults = supermemo(supermemoInput, grade);

  const nextDueDate = dateUtils.addDays(new Date(), supermemoResults.interval);

  return {
    repetitions: supermemoResults.repetition,
    interval: supermemoResults.interval,
    eFactor: supermemoResults.efactor,
    nextDueDate,
    nextDueDateFromNow: dateUtils.customFromNow(nextDueDate),
  };
};

const practice = async ({ interval, repetitions, eFactor, grade, refUid, pluginPageTitle }) => {
  // Just don't want to store nextDueDateFromNow
  // eslint-disable-next-line no-unused-vars
  const { nextDueDateFromNow, ...practiceResultData } = getPracticeResultData({
    grade,
    interval,
    repetitions,
    eFactor,
  });

  await savePracticeData({
    refUid: refUid,
    pluginPageTitle,
    grade,
    ...practiceResultData,
  });
};

export default practice;
