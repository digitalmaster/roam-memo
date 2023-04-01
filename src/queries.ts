import { getStringBetween, parseConfigString, parseRoamDateString } from '~/utils/string';
import * as stringUtils from '~/utils/string';
import * as dateUtils from '~/utils/date';
import { CompleteRecords, NewRecords, Records, NewSession, RecordUid } from '~/models/session';
import practice from '~/practice';

const getPageReferenceIds = async (pageTitle): Promise<string[]> => {
  const q = `[
    :find ?refUid
    :in $ ?tag
    :where
        [?tagPage :node/title ?tag]
        [?tagRefs :block/refs ?tagPage]
        [?tagRefs :block/uid ?refUid]
    ]`;

  const results = window.roamAlphaAPI.q(q, pageTitle).map((arr) => arr[0]);

  return results;
};

const mapPluginPageDataLatest = (queryResultsData): Records =>
  queryResultsData
    .map((arr) => arr[0])[0]
    .children?.reduce((acc, cur) => {
      const uid = getStringBetween(cur.string, '((', '))');
      acc[uid] = {};

      // Add date
      if (!cur.children) return acc;
      acc[uid].dateCreated = parseRoamDateString(
        getStringBetween(cur.children[0].string, '[[', ']]')
      );
      const latestChild = cur.children.find((child) => child.order === 0);
      for (const field of latestChild.children) {
        const [key, value] = parseConfigString(field.string);

        if (key === 'nextDueDate') {
          acc[uid][key] = parseRoamDateString(getStringBetween(value, '[[', ']]'));
        } else if (value === 'true' || value === 'false') {
          acc[uid][key] = value === 'true';
        } else {
          acc[uid][key] = Number(value);
        }
      }
      return acc;
    }, {}) || {};

const mapPluginPageData = (queryResultsData): CompleteRecords =>
  queryResultsData
    .map((arr) => arr[0])[0]
    .children?.reduce((acc, cur) => {
      const uid = getStringBetween(cur.string, '((', '))');
      acc[uid] = [];

      // Add date
      if (!cur.children) return acc;

      for (const child of cur.children) {
        const record = {
          refUid: uid,
          dateCreated: parseRoamDateString(getStringBetween(child.string, '[[', ']]')),
        };

        if (!child.children) return acc;

        for (const field of child.children) {
          const [key, value] = parseConfigString(field.string);

          if (key === 'nextDueDate') {
            record[key] = parseRoamDateString(getStringBetween(value, '[[', ']]'));
          } else if (value === 'true' || value === 'false') {
            record[key] = value === 'true';
          } else {
            record[key] = Number(value);
          }
        }

        acc[uid].push(record);
      }

      return acc;
    }, {}) || {};

export const getPluginPageData = async ({ dataPageTitle, limitToLatest = true }) => {
  const q = `[
    :find (pull ?pluginPageChildren [
      :block/string
      :block/children
      :block/order
      {:block/children ...}])
      :in $ ?pageTitle ?dataBlockName
      :where
      [?page :node/title ?pageTitle]
      [?page :block/children ?pluginPageChildren]
      [?pluginPageChildren :block/string ?dataBlockName]
    ]`;

  const dataBlockName = 'data';
  const queryResultsData = await window.roamAlphaAPI.q(q, dataPageTitle, dataBlockName);

  if (!queryResultsData.length) return {};

  return limitToLatest
    ? mapPluginPageDataLatest(queryResultsData)
    : mapPluginPageData(queryResultsData);
};

export const getDueCardUids = (data) => {
  const results: RecordUid[] = [];
  if (!Object.keys(data).length) return results;

  const now = new Date();
  Object.keys(data).forEach((cardUid) => {
    const cardData = data[cardUid];
    const nextDueDate = cardData.nextDueDate;

    if (nextDueDate <= now) {
      results.push(cardUid);
    }
  });

  return results;
};

export const generateNewCardProps = ({ dateCreated = undefined } = {}): NewSession => ({
  dateCreated: dateCreated || new Date(),
  eFactor: 2.5,
  interval: 0,
  repetitions: 0,
  isNew: true,
});

/**
 *  Limit of cards to practice ensuring that due cards are always
 *  first but ~25% new cards are still practiced when limit is less than total due
 *  cards.
 */
export const selectPracticeCardsData = ({
  dueCardsUids,
  newCardsUids,
  dailyLimit,
  isCramming,
}: {
  dueCardsUids: RecordUid[];
  newCardsUids: RecordUid[];
  dailyLimit: number;
  isCramming: boolean;
}) => {
  // @TODO: Consider making this a config option
  const targetNewCardsRatio = 0.25;
  const totalDueCards = dueCardsUids.length;
  const totalNewCards = newCardsUids.length;
  const totalCards = totalDueCards + totalNewCards;

  if (!dailyLimit || isCramming || totalCards <= dailyLimit) {
    return {
      dueCardsUids,
      newCardsUids,
    };
  }

  let totalNewPracticeCount = totalNewCards; // 1
  let totalDuePracticeCount = totalDueCards; // 3

  // Calculate how many new cards to practice
  if (dailyLimit === 1) {
    totalNewPracticeCount = 0;
  } else {
    const targetNewCards = Math.max(Math.floor(dailyLimit * targetNewCardsRatio), 1);
    totalNewPracticeCount = Math.min(totalNewCards, targetNewCards);
  }

  // Calculate how many due cards to practice
  totalDuePracticeCount = dailyLimit - totalNewPracticeCount;

  return {
    dueCardsUids: dueCardsUids.slice(0, totalDuePracticeCount),
    newCardsUids: newCardsUids.slice(0, totalNewPracticeCount),
  };
};

export const getPracticeCardData = async ({ selectedTag, dataPageTitle, dailyLimit }) => {
  const pluginPageData = (await getPluginPageData({
    dataPageTitle,
    limitToLatest: true,
  })) as Records;

  const selectedTagReferencesIds = await getPageReferenceIds(selectedTag);
  const cardsData = { ...pluginPageData };
  const newCardsUids: RecordUid[] = [];

  // Filter out due cards that aren't references to the currently selected tag
  // @TODO: we could probably do this at getPluginPageData query for a
  // performance boost
  const dueCardsUids = getDueCardUids(cardsData).filter(
    (dueCardUid) => selectedTagReferencesIds.indexOf(dueCardUid) > -1
  );

  // Sort due cards by nextDueDate (due soonest first to increase retention,
  // accepting that cards that are more past due will likely be forgotten)
  dueCardsUids.sort((a, b) => {
    const aCard = cardsData[a];
    const bCard = cardsData[b];

    return aCard.nextDueDate < bCard.nextDueDate ? 1 : -1;
  });

  // Create new cards for all referenced cards with no data yet
  selectedTagReferencesIds.forEach((referenceId) => {
    if (!pluginPageData[referenceId]) {
      // New
      newCardsUids.push(referenceId);
      cardsData[referenceId] = {
        ...generateNewCardProps(),
      };
    }
  });

  // Currently list seems to be sorted from newest to oldest so refersing so
  // oldest new (this double flip hurts to say out loud but it's true) cards are
  // first
  newCardsUids.reverse();

  return {
    cardsData,
    allSelectedTagCardsUids: selectedTagReferencesIds,
    ...selectPracticeCardsData({ dueCardsUids, newCardsUids, dailyLimit }),
  };
};

const getParentChainInfo = async ({ refUid }) => {
  const q = `[
    :find (pull ?parentIds [
      :node/title
      :block/string
      :block/uid])
    :in $ ?refId
    :where
      [?block :block/uid ?refId]
      [?block :block/parents ?parentIds]
    ]`;

  const dataResults = await window.roamAlphaAPI.q(q, refUid);

  return dataResults.map((r) => r[0]);
};

export interface BlockInfo {
  string: string;
  children: any[];
  breadcrumbs: Breadcrumbs[];
}
export interface Breadcrumbs {
  [index: number]: { uid: string; title: string };
}
export const fetchBlockInfo: (refUid: any) => Promise<BlockInfo> = async (refUid) => {
  const blockInfoQuery = `[
    :find (pull ?block [
      :block/string
      :block/children
      {:block/children ...}])
    :in $ ?refId
    :where
      [?block :block/uid ?refId]
    ]`;
  const blockInfo = (await window.roamAlphaAPI.q(blockInfoQuery, refUid))[0][0];
  const parentChainInfo = await getParentChainInfo({ refUid });

  return {
    string: blockInfo.string,
    children: blockInfo.children?.map((child) => child.string),
    breadcrumbs: parentChainInfo,
  };
};

/**
 *  Shout out to David Bieber for these helpful functions Blog:
 *  https://davidbieber.com/snippets/2021-02-12-javascript-functions-for-inserting-blocks-in-roam/
 */
const getPage = (page) => {
  // returns the uid of a specific page in your graph. _page_: the title of the
  // page.
  let results = window.roamAlphaAPI.q(
    `
    [:find ?uid
     :in $ ?title
     :where
     [?page :node/title ?title]
     [?page :block/uid ?uid]
    ]`,
    page
  );
  if (results.length) {
    return results[0][0];
  }
};

export const getOrCreatePage = async (pageTitle) => {
  const page = getPage(pageTitle);
  if (page) return page;
  const uid = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.data.page.create({ page: { title: pageTitle, uid } });

  return getPage(pageTitle);
};

const getBlockOnPage = (page, block) => {
  // returns the uid of a specific block on a specific page. _page_: the title
  // of the page. _block_: the text of the block.
  let results = window.roamAlphaAPI.q(
    `
    [:find ?block_uid
     :in $ ?page_title ?block_string
     :where
     [?page :node/title ?page_title]
     [?page :block/uid ?page_uid]
     [?block :block/parents ?page]
     [?block :block/string ?block_string]
     [?block :block/uid ?block_uid]
    ]`,
    page,
    block
  );
  if (results.length) {
    return results[0][0];
  }
};

const getChildBlock = (parent_uid, block) => {
  // returns the uid of a specific child block underneath a specific parent
  // block. _parent_uid_: the uid of the parent block. _block_: the text of the
  // child block.
  let results = window.roamAlphaAPI.q(
    `
    [:find ?block_uid
     :in $ ?parent_uid ?block_string
     :where
     [?parent :block/uid ?parent_uid]
     [?block :block/parents ?parent]
     [?block :block/string ?block_string]
     [?block :block/uid ?block_uid]
    ]`,
    parent_uid,
    block
  );
  if (results.length) {
    return results[0][0];
  }
};

// eslint-disable-next-line
const getChildrenBlocks = (parent_uid) => {
  // returns the uids of children blocks underneath a specific parent block
  // _parent_uid_: the uid of the parent block.
  let results = window.roamAlphaAPI.q(
    `
    [:find ?child_uid ?child_order
     :in $ ?parent_uid
     :where
     [?parent :block/uid ?parent_uid]
     [?parent :block/children ?child]
     [?child :block/uid ?child_uid]
     [?child :block/order ?child_order]
    ]`,
    parent_uid
  );
  if (results.length) {
    return results.map((result) => ({ uid: result[0], order: result[1] }));
  }
};

const createChildBlock = async (parent_uid, block, order, blockProps = {}) => {
  // returns the uid of a specific child block underneath a specific parent
  // block, creating it first if it's not already there. _parent_uid_: the uid
  // of the parent block. _block_: the text of the child block. _order_:
  // (optional) controls where to create the block, 0 for inserting at the top,
  // -1 for inserting at the bottom.
  if (!order) {
    order = 0;
  }

  const uid = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': parent_uid, order: order },
    block: { string: block, uid, ...blockProps },
  });

  return uid;
};

const createBlockOnPage = async (page, block, order, blockProps) => {
  // creates a new top-level block on a specific page, returning the new block's
  // uid. _page_: the title of the page. _block_: the text of the block.
  // _order_: (optional) controls where to create the block, 0 for top of page,
  // -1 for bottom of page.
  let page_uid = getPage(page);
  return createChildBlock(page_uid, block, order, blockProps);
};

export const getOrCreateBlockOnPage = async (page, block, order, blockProps) => {
  // returns the uid of a specific block on a specific page, creating it first
  // as a top-level block if it's not already there. _page_: the title of the
  // page. _block_: the text of the block. _order_: (optional) controls where to
  // create the block, 0 for top of page, -1 for bottom of page.
  let block_uid = getBlockOnPage(page, block);
  if (block_uid) return block_uid;
  return createBlockOnPage(page, block, order, blockProps);
};

const getOrCreateChildBlock = async (parent_uid, block, order, blockProps) => {
  // creates a new child block underneath a specific parent block, returning the
  // new block's uid. _parent_uid_: the uid of the parent block. _block_: the
  // text of the new block. _order_: (optional) controls where to create the
  // block, 0 for inserting at the top, -1 for inserting at the bottom.
  let block_uid = getChildBlock(parent_uid, block);
  if (block_uid) return block_uid;
  return createChildBlock(parent_uid, block, order, blockProps);
};

const getEmojiFromGrade = (grade) => {
  switch (grade) {
    case 5:
      return '🟢';
    case 4:
      return '🔵';
    case 3:
      return '🟠';
    case 2:
      return '🟠';
    case 0:
      return '🔴';
    default:
      break;
  }
};

export const savePracticeData = async ({ refUid, dataPageTitle, dateCreated, ...data }) => {
  await getOrCreatePage(dataPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(dataPageTitle, 'data', -1, {
    open: false,
    heading: 3,
  });

  // Get child that matches refUid
  const cardDataBlockUid = await getOrCreateChildBlock(dataBlockUid, `((${refUid}))`, 0, {
    open: false,
  });

  const referenceDate = dateCreated || new Date();
  const dateCreatedRoamDateString = stringUtils.dateToRoamDateString(referenceDate);
  const emoji = getEmojiFromGrade(data.grade);
  const newDataBlockId = await createChildBlock(
    cardDataBlockUid,
    `[[${dateCreatedRoamDateString}]] ${emoji}`,
    0,
    {
      open: false,
    }
  );

  // Insert new block info
  const nextDueDate = dateUtils.addDays(referenceDate, data.interval);
  for (const key of Object.keys(data)) {
    let value = data[key];
    if (key === 'nextDueDate') {
      value = `[[${stringUtils.dateToRoamDateString(nextDueDate)}]]`;
    }

    await createChildBlock(newDataBlockId, `${key}:: ${value}`, -1);
  }
};
interface BulkSavePracticeDataOptions {
  token: string;
  records: CompleteRecords;
  selectedUids: string[];
  dataPageTitle: string;
}
export const bulkSavePracticeData = async ({
  token,
  records,
  selectedUids,
  dataPageTitle,
}: BulkSavePracticeDataOptions) => {
  // Uncomment during development to prevent accidental data loss
  // if (dataPageTitle === 'roam/memo') {
  //   alert('NOPE! Protecting your graph data. Cannot save data to memo page during dev');
  //   return;
  // }
  await getOrCreatePage(dataPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(dataPageTitle, 'data', -1, {
    open: false,
    heading: 3,
  });

  const payload = {
    graphName: 'jcb',
    data: {
      action: 'batch-actions',
      actions: [],
    },
  };

  // Create practice entries
  for (const refUid of selectedUids) {
    // Check if entry already exists, if it does, delete it first so we don't
    // have duplicates
    const existingEntryUid = getChildBlock(dataBlockUid, `((${refUid}))`);
    if (existingEntryUid) {
      payload.data.actions.push({
        action: 'delete-block',
        block: {
          uid: existingEntryUid,
        },
      });
    }

    const entryUid = window.roamAlphaAPI.util.generateUID();
    payload.data.actions.push({
      action: 'create-block',
      location: {
        'parent-uid': dataBlockUid,
        order: 0,
      },
      block: {
        string: `((${refUid}))`,
        uid: entryUid,
        open: false,
      },
    });

    // Add sessions
    const sessions = records[refUid];
    for (const session of sessions) {
      // Add Session Heading
      const dateCreatedRoamDateString = stringUtils.dateToRoamDateString(session.dateCreated);
      const emoji = getEmojiFromGrade(session.grade);
      const sessionHeadingUid = window.roamAlphaAPI.util.generateUID();
      payload.data.actions.push({
        action: 'create-block',
        location: {
          'parent-uid': entryUid,
          order: 0,
        },
        block: {
          string: `[[${dateCreatedRoamDateString}]] ${emoji}`,
          uid: sessionHeadingUid,
          open: false,
        },
      });

      // Add Session Data
      for (const key of Object.keys(session)) {
        let value = session[key];
        if (key === 'dateCreated') continue; // no need to store this
        if (key === 'nextDueDate') {
          value = `[[${stringUtils.dateToRoamDateString(value)}]]`;
        }
        payload.data.actions.push({
          action: 'create-block',
          location: {
            'parent-uid': sessionHeadingUid,
            order: -1,
          },
          block: {
            string: `${key}:: ${value}`,
            open: false,
          },
        });
      }
    }
  }
  const baseUrl = 'https://roam-memo-server.onrender.com';
  // const baseUrl = 'http://localhost:3000';
  try {
    await fetch(`${baseUrl}/save-roam-sr-data`, {
      method: 'POST',

      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error Bulk Saving', error);
  }
};

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
        const newCardData = generateNewCardProps({ dateCreated });
        practiceInputData = { ...practiceInputData, ...newCardData };
      }

      const practiceResult = {
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
