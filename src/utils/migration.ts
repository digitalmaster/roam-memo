import practice from '~/practice';
import * as queries from '~/queries';

export const importRoamSrOldData = async ({ pluginPageTitle }) => {
  const oldReviewData = await queries.getOldRoamSrPracticeData();
  const newReviewData = await convertRoamSrPracticeData(oldReviewData, pluginPageTitle);
  console.log('DEBUG:: ~ file: migration.ts ~ line 8 ~ newReviewData', newReviewData);

  // Used to Filter blocks that already exist
  const pluginPageData = await queries.getPluginPageData({ pluginPageTitle });
  // Ignore old data if already started practicing
  // if (typeof pluginPageData[refUid] !== 'undefined') continue;
};

const convertRoamSrPracticeData = async (oldReviewRecords, pluginPageTitle) => {
  const results = {};
  for (const [_, resultsArr] of Object.entries(oldReviewRecords)) {
    //@ts-ignore
    for (const result of resultsArr) {
      const { refUid, dateCreated, grade } = result;

      let practiceInputData = {
        refUid,
        grade,
        pluginPageTitle,
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
        const newCardData = queries.generateNewCardProps({ dateCreated });
        practiceInputData = { ...practiceInputData, ...newCardData };
      }

      const practiceResult = {
        ...(await practice(practiceInputData, true)),
        grade,
        dateCreated,
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
