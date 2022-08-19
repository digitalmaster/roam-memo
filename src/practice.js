import { supermemo } from 'supermemo';
import { savePracticeData } from '~/queries';
import * as dateUtils from '~/utils/date';

const practice = async ({ interval, repetitions, eFactor, grade, refUid }) => {
  const supermemoInput = {
    interval,
    repetition: repetitions,
    efactor: eFactor,
  };

  // call supermemo API
  const supermemoResults = supermemo(supermemoInput, grade);
  const nextDueDate = dateUtils.addDays(new Date(), supermemoResults.interval);

  await savePracticeData({
    refUid: refUid,
    grade,
    repetitions: supermemoResults.repetition,
    interval: supermemoResults.interval,
    eFactor: supermemoResults.efactor,
    nextDueDate,
  });
};

export default practice;
