import { CompleteRecords } from '~/models/session';
import { generateNewSession } from '~/queries/utils';
import { getStringBetween, parseRoamDateString } from '~/utils/string';

const oldRoamSrGradeMap = {
  ['r/1']: {
    oldDisplayButtonText: 'Again',
    memoDisplayButtonText: 'Forgot',
    memoGrade: 0,
  },
  ['r/2']: {
    oldDisplayButtonText: 'Hard',
    memoDisplayButtonText: 'Hard',
    memoGrade: 3,
  },
  ['r/3']: {
    oldDisplayButtonText: 'Good',
    memoDisplayButtonText: 'Good',
    memoGrade: 4,
  },
  ['r/4']: {
    oldDisplayButtonText: 'Easy',
    memoDisplayButtonText: 'Perfect',
    memoGrade: 5,
  },
};

const mapOldRoamSrPracticeData = (data, pageTitle) => {
  return data.reduce((acc, [result]) => {
    const dateString = result.title;

    result.children
      // Filter out unrelated rows (could probably do this in query but ya 🤷🏽‍♂️)
      .filter((row) => row.string === `[[${pageTitle}]]`)
      // Filter out rows with no records
      .filter((row) => !!row.children)
      .forEach(({ children: recordList }) => {
        for (const { string: record } of recordList) {
          const values = record.split(' ');
          // Skip all invalid records: [uid, gradeString]
          if (values.length !== 2) continue;

          const [refUidString, gradeString] = values;

          // Skip empty string values 🤷🏽
          if (!refUidString || !gradeString) continue;

          const refUid = getStringBetween(refUidString, '((', '))');
          if (!acc[refUid]) acc[refUid] = [];
          acc[refUid].push({
            refUid,
            grade: oldRoamSrGradeMap[getStringBetween(gradeString, '[[', ']]')].memoGrade,
            dateCreated: parseRoamDateString(dateString),
            isRoamSrOldPracticeRecord: true,
          });
        }
      });

    return acc;
  }, {});
};

const sortOldRoamSrPracticeData = (mappedData) => {
  for (const key in mappedData) {
    mappedData[key] = mappedData[key].sort((a, b) => a.dateCreated - b.dateCreated);
  }
  return mappedData;
};

export const getOldRoamSrPracticeData = async () => {
  const reviewTagPageName = 'roam/sr/review';
  const reviewPageReferenceData = await window.roamAlphaAPI.q(
    `
    [:find (pull ?parentPageId [
      :node/title
      :block/string
      :block/children
      {:block/children ...}])
     :in $ ?reviewTagPageName
     :where
     [?pageId :node/title ?reviewTagPageName]
     [?refIds :block/refs ?pageId]
     [?parentPageId :block/children, ?refIds]
    ]`,
    reviewTagPageName
  );

  return sortOldRoamSrPracticeData(
    mapOldRoamSrPracticeData(reviewPageReferenceData, reviewTagPageName)
  );
};

const getMergedOldAndExistingRecords = (oldReviewRecords, existingPracticeData) => {
  const mergedPracticeData = { ...oldReviewRecords };
  // Iterate existing practice data
  for (const refUid in existingPracticeData) {
    if (refUid in oldReviewRecords) {
      // This means we have old data for a card we've already started training

      // If old record belongs to a card we've already imported, it means we've
      // already merged before and we can keep the existing data (instead of
      // duplicating it)
      if (existingPracticeData[refUid].some((r) => r.isRoamSrOldPracticeRecord)) {
        mergedPracticeData[refUid] = [...existingPracticeData[refUid]];
      } else {
        mergedPracticeData[refUid] = [
          ...mergedPracticeData[refUid],
          ...existingPracticeData[refUid],
        ];
      }

      mergedPracticeData[refUid].sort((a, b) => a.dateCreated - b.dateCreated);
    }
  }

  return mergedPracticeData;
};

export const generateRecordsFromRoamSrData = async (
  oldReviewRecords,
  existingPracticeData,
  dataPageTitle
) => {
  const mergedRecords = getMergedOldAndExistingRecords(oldReviewRecords, existingPracticeData);
  const results: CompleteRecords = {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, resultsArr] of Object.entries(mergedRecords)) {
    //@ts-ignore
    for (const result of resultsArr) {
      const { refUid, dateCreated, grade, isRoamSrOldPracticeRecord } = result;

      let practiceInputData = {
        refUid,
        grade,
        dataPageTitle,
        dateCreated,
        eFactor: undefined,
        repetitions: undefined,
        interval: undefined,
      };

      if (results[refUid]) {
        const lastPracticeResult = results[refUid][results[refUid].length - 1];
        const { eFactor, repetitions, interval } = lastPracticeResult;
        practiceInputData = { ...practiceInputData, eFactor, repetitions, interval };
      } else {
        const newCardData = generateNewSession({ dateCreated });
        practiceInputData = { ...practiceInputData, ...newCardData };
      }

      const practiceResult = {
        // @ts-expect-error
        ...(await practice(practiceInputData, true)),
        grade,
        dateCreated,
        isRoamSrOldPracticeRecord: !!isRoamSrOldPracticeRecord,
      };

      if (results[refUid]) {
        results[refUid].push(practiceResult);
      } else {
        results[refUid] = [practiceResult];
      }
    }
  }

  return results;
};
