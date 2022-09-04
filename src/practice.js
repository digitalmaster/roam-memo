import { supermemo } from 'supermemo';
import { savePracticeData } from '~/queries';
import * as dateUtils from '~/utils/date';

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
