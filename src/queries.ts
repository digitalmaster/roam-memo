import { getStringBetween, parseConfigString, parseRoamDateString } from '~/utils/string';
import * as stringUtils from '~/utils/string';
import * as dateUtils from '~/utils/date';
import {
  CompleteRecords,
  Records,
  NewSession,
  RecordUid,
  ReviewModes,
  Session,
  IntervalMultiplierType,
} from '~/models/session';
import practice from '~/practice';

const getPageReferenceIds = async (selectedTag, dataPageTitle): Promise<string[]> => {
  // First query the data page so that we can exclude those references from the results
  // Otherwise tags used on data page will show up as practice cards
  const dataPageQuery = `[
    :find ?page
    :where
      [?page :node/title "${dataPageTitle}"]
  ]`;
  const dataPage = window.roamAlphaAPI.q(dataPageQuery)[0][0];

  const q = `[
    :find ?refUid
    :in $ ?tag ?dataPage
    :where
      [?tagPage :node/title ?tag]
      [?tagRefs :block/refs ?tagPage]
      [?tagRefs :block/uid ?refUid]
      [?tagRefs :block/page ?homePage]
      [(!= ?homePage ?dataPage)]
    ]`;

  const results = window.roamAlphaAPI.q(q, selectedTag, dataPage).map((arr) => arr[0]);

  return results;
};

const getSelectedTagPageBlocksIds = async (selectedTag): Promise<string[]> => {
  const queryResults = await getChildBlocksOnPage(selectedTag);

  if (!queryResults.length) return [];

  const children = queryResults[0][0].children;
  const filteredChildren = children.filter((child) => !!child.string);

  return filteredChildren.map((arr) => arr.uid);
};

// Ensure that the reviewMode field is always present
const ensureReviewModeField = (record) => {
  const hasReviewModeField = record.children.some((child) => child.string.includes('reviewMode'));
  const children = hasReviewModeField
    ? record.children
    : [
        ...record.children,
        {
          order: record.children.length,
          string: `reviewMode:: ${ReviewModes.DefaultSpacedInterval}`,
        },
      ];

  return {
    ...record,
    children,
  };
};

const parseFieldValues = (object, node) => {
  for (const field of ensureReviewModeField(node).children) {
    const [key, value] = parseConfigString(field.string);

    if (key === 'nextDueDate') {
      object[key] = parseRoamDateString(getStringBetween(value, '[[', ']]'));
    } else if (value === 'true' || value === 'false') {
      object[key] = value === 'true';
    } else if (stringUtils.isNumeric(value)) {
      object[key] = Number(value);
    } else {
      object[key] = value;
    }
  }
};

const mapPluginPageDataLatest = (queryResultsData): Records =>
  queryResultsData
    .map((arr) => arr[0])[0]
    .children?.reduce((acc, cur) => {
      const uid = getStringBetween(cur.string, '((', '))');
      acc[uid] = {};

      if (!cur.children) return acc;

      const latestChild = cur.children.find((child) => child.order === 0);

      acc[uid].dateCreated = parseRoamDateString(getStringBetween(latestChild.string, '[[', ']]'));

      if (!latestChild.children) return acc;
      parseFieldValues(acc[uid], latestChild);

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

        parseFieldValues(record, child);

        acc[uid].push(record);
      }

      return acc;
    }, {}) || {};

const getPluginPageBlockData = async ({ dataPageTitle, blockName }) => {
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

  return await window.roamAlphaAPI.q(q, dataPageTitle, blockName);
};

export const getPluginPageData = async ({ dataPageTitle, limitToLatest = true }) => {
  const queryResultsData = await getPluginPageBlockData({ dataPageTitle, blockName: 'data' });
  if (!queryResultsData.length) return {};

  return limitToLatest
    ? mapPluginPageDataLatest(queryResultsData)
    : mapPluginPageData(queryResultsData);
};

const mapPluginPageCachedData = (queryResultsData, selectedTag) => {
  const data = queryResultsData.map((arr) => arr[0])[0].children;
  if (!data || !data.length) return {};

  const tagData = data.find((d) => d.string === `[[${selectedTag}]]`);
  if (!tagData) return {};

  const result =
    tagData.children?.reduce((acc, cur) => {
      if (!cur.string) return acc;
      const [key, value] = cur.string.split('::').map((s: string) => s.trim());

      const date = parseRoamDateString(value);
      acc[key] = date ? date : value;

      return acc;
    }, {}) || {};

  return result;
};

export const getPluginPageCachedData = async ({ dataPageTitle, selectedTag }) => {
  const queryResultsData = await getPluginPageBlockData({ dataPageTitle, blockName: 'cache' });

  if (!queryResultsData.length) return {};

  return mapPluginPageCachedData(queryResultsData, selectedTag);
};

export const getDueCardUids = (data: Records) => {
  const results: RecordUid[] = [];
  if (!Object.keys(data).length) return results;

  const now = new Date();
  Object.keys(data).forEach((cardUid) => {
    const cardData = data[cardUid] as Session;
    const nextDueDate = cardData.nextDueDate;

    if (nextDueDate <= now) {
      results.push(cardUid);
    }
  });

  return results;
};

const getPracticedTodayCount = (data: Records = {}): number => {
  let count = 0;

  Object.keys(data).forEach((cardUid) => {
    const cardData = data[cardUid];
    const isCreatedToday = dateUtils.isSameDay(cardData.dateCreated, new Date());

    if (isCreatedToday) count++;
  });

  return count;
};
export const generateNewSession = ({
  reviewMode = ReviewModes.DefaultSpacedInterval,
  dateCreated = undefined,
  isNew = true,
} = {}): NewSession => {
  if (reviewMode === ReviewModes.DefaultSpacedInterval) {
    return {
      dateCreated: dateCreated || new Date(),
      eFactor: 2.5,
      interval: 0,
      repetitions: 0,
      isNew,
      reviewMode,
    };
  }

  return {
    dateCreated: dateCreated || new Date(),
    intervalMultiplier: 3,
    intervalMultiplierType: IntervalMultiplierType.Days,
    isNew,
    reviewMode,
  };
};

const calculateDailyLimit = (dailyLimit: number, completedTodayCount: number) => {
  if (!dailyLimit) return 0;

  // Note never return 0 as a daily limit
  return Math.max(1, dailyLimit - completedTodayCount);
};

/**
 *  Limit of cards to practice ensuring that due cards are always
 *  first but ~25% new cards are still practiced when limit is less than total due
 *  cards.
 */
interface SelectedPracticeDataProps {
  dueCardsUids: RecordUid[];
  newCardsUids: RecordUid[];
  dailyLimit: number;
  isCramming: boolean;
  completedTodayCount?: number;
  lastCompletedDate?: Date;
}
export const selectPracticeData = ({
  dueCardsUids,
  newCardsUids,
  dailyLimit,
  completedTodayCount = 0,
  isCramming,
  lastCompletedDate,
}: SelectedPracticeDataProps) => {
  const isLastCompleteDateToday =
    lastCompletedDate && dateUtils.isSameDay(lastCompletedDate, new Date());

  if (isLastCompleteDateToday) {
    return {
      dueCardsUids: [],
      newCardsUids: [],
      remainingDueCardsCount: dueCardsUids.length,
    };
  }

  // @TODO: Consider making this a config option
  const targetNewCardsRatio = 0.25;
  const totalDueCards = dueCardsUids.length;
  const totalNewCards = newCardsUids.length;
  const totalCards = totalDueCards + totalNewCards;
  dailyLimit = calculateDailyLimit(dailyLimit, completedTodayCount);

  if (!dailyLimit || isCramming || totalCards <= dailyLimit) {
    return {
      dueCardsUids,
      newCardsUids,
    };
  }

  let totalNewPracticeCount = totalNewCards;
  let totalDuePracticeCount = totalDueCards;

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
    remainingDueCardsCount:
      totalDueCards - totalDuePracticeCount + (totalNewCards - totalNewPracticeCount),
  };
};

export const getPracticeData = async ({
  selectedTag,
  dataPageTitle,
  dailyLimit,
  isCramming,
  lastCompletedDate,
}) => {
  const pluginPageData = (await getPluginPageData({
    dataPageTitle,
    limitToLatest: true,
  })) as Records;

  // Get all the cards for the selected tag
  const selectedTagReferencesIds = await getPageReferenceIds(selectedTag, dataPageTitle);
  const selectedTagPageBlocksIds = await getSelectedTagPageBlocksIds(selectedTag);
  const allSelectedTagCardsUids = selectedTagReferencesIds.concat(selectedTagPageBlocksIds);
  const selectedTagCardsData = Object.keys(pluginPageData).reduce((acc, cur) => {
    if (allSelectedTagCardsUids.indexOf(cur) > -1) {
      acc[cur] = pluginPageData[cur];
    }
    return acc;
  }, {});

  const newCardsUids: RecordUid[] = [];

  // Filter out due cards that aren't references to the currently selected tag
  // @TODO: we could probably do this at getPluginPageData query for a
  // performance boost
  const dueCardsUids = getDueCardUids(selectedTagCardsData);

  // Used to adjust daily limit so you can complete daily limit in chunks
  // throughout the same day
  const completedTodayCount = getPracticedTodayCount(selectedTagCardsData);

  // Sort due cards by nextDueDate (due soonest first to increase retention,
  // accepting that cards that are more past due will likely be forgotten)
  dueCardsUids.sort((a, b) => {
    const aCard = selectedTagCardsData[a];
    const bCard = selectedTagCardsData[b];

    return aCard.nextDueDate < bCard.nextDueDate ? 1 : -1;
  });

  // Create new cards for all referenced cards with no data yet
  allSelectedTagCardsUids.forEach((referenceId) => {
    if (!pluginPageData[referenceId]) {
      // New
      newCardsUids.push(referenceId);
      pluginPageData[referenceId] = {
        ...generateNewSession(),
      };
    }
  });

  // Currently list seems to be sorted from newest to oldest so refersing so
  // oldest new (this double flip hurts to say out loud but it's true) cards are
  // first
  newCardsUids.reverse();

  return {
    pluginPageData,
    allSelectedTagCardsUids,
    completedTodayCount,
    ...selectPracticeData({
      dueCardsUids,
      newCardsUids,
      dailyLimit,
      completedTodayCount,
      isCramming,
      lastCompletedDate,
    }),
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
  const results = window.roamAlphaAPI.q(
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
  const results = window.roamAlphaAPI.q(
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

const getChildBlock = (
  parent_uid: string,
  block: string,
  options: {
    exactMatch?: boolean;
  } = {
    exactMatch: true,
  }
) => {
  // returns the uid of a specific child block underneath a specific parent
  // block. _parent_uid_: the uid of the parent block. _block_: the text of the
  // child block.
  const exactMatchQuery = `
    [:find ?block_uid
    :in $ ?parent_uid ?block_string
    :where
      [?parent :block/uid ?parent_uid]
      [?block :block/parents ?parent]
      [?block :block/string ?block_string]
      [?block :block/uid ?block_uid]
    ]
  `;

  const startsWithQuery = `
    [:find ?block_uid
      :in $ ?parent_uid ?block_sub_string
      :where
        [?parent :block/uid ?parent_uid]
        [?block :block/parents ?parent]
        [?block :block/string ?block_string]
        [(clojure.string/starts-with? ?block_string ?block_sub_string)]
        [?block :block/uid ?block_uid]
    ]
  `;

  const query = options.exactMatch ? exactMatchQuery : startsWithQuery;

  const results = window.roamAlphaAPI.q(query, parent_uid, block);
  if (results.length) {
    return results[0][0];
  }
};

const getChildBlocksOnPage = async (page) => {
  const q = `[
    :find (pull ?tagPage [
      :block/uid
      :block/string
      :block/children
      {:block/children ...}])
    :in $ ?tag
    :where
      [?tagPage :node/title ?tag]
      [?tagPage :block/children ?tagPageChildren]
    ]`;

  const queryResults = await window.roamAlphaAPI.q(q, page);

  if (!queryResults.length) return [];

  return queryResults;
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
  const page_uid = getPage(page);
  return createChildBlock(page_uid, block, order, blockProps);
};

export const getOrCreateBlockOnPage = async (page, block, order, blockProps) => {
  // returns the uid of a specific block on a specific page, creating it first
  // as a top-level block if it's not already there. _page_: the title of the
  // page. _block_: the text of the block. _order_: (optional) controls where to
  // create the block, 0 for top of page, -1 for bottom of page.
  const block_uid = getBlockOnPage(page, block);
  if (block_uid) return block_uid;
  return createBlockOnPage(page, block, order, blockProps);
};

const getOrCreateChildBlock = async (parent_uid, block, order, blockProps) => {
  // creates a new child block underneath a specific parent block, returning the
  // new block's uid. _parent_uid_: the uid of the parent block. _block_: the
  // text of the new block. _order_: (optional) controls where to create the
  // block, 0 for inserting at the top, -1 for inserting at the bottom.
  const block_uid = getChildBlock(parent_uid, block);
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
      return '🟢';
  }
};

export const saveCacheData = async ({ dataPageTitle, data, selectedTag }) => {
  await getOrCreatePage(dataPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(dataPageTitle, 'cache', -1, {
    open: false,
    heading: 3,
  });

  // Insert selected tag parent block
  const selectedTagBlockUid = await getOrCreateChildBlock(dataBlockUid, `[[${selectedTag}]]`, -1, {
    open: false,
  });

  // Insert new block info
  for (const key of Object.keys(data)) {
    // Delete block that starts with key if already exists
    const existingBlockUid = await getChildBlock(selectedTagBlockUid, `${key}::`, {
      exactMatch: false,
    });
    if (existingBlockUid) {
      await window.roamAlphaAPI.deleteBlock({ block: { uid: existingBlockUid } });
    }

    let value = data[key];
    if (dateUtils.isDate(value)) {
      value = stringUtils.dateToRoamDateString(value);
    }

    await createChildBlock(selectedTagBlockUid, `${key}:: ${value}`, -1);
  }
};

export const deleteCacheDataKey = async ({ dataPageTitle, selectedTag, toDeleteKeyId }) => {
  await getOrCreatePage(dataPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(dataPageTitle, 'cache', -1, {
    open: false,
    heading: 3,
  });

  const selectedTagBlockUid = await getOrCreateChildBlock(dataBlockUid, `[[${selectedTag}]]`, -1, {
    open: false,
  });

  const existingBlockUid = await getChildBlock(selectedTagBlockUid, `${toDeleteKeyId}::`, {
    exactMatch: false,
  });

  if (existingBlockUid) {
    await window.roamAlphaAPI.deleteBlock({ block: { uid: existingBlockUid } });
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
  const nextDueDate = data.nextDueDate || dateUtils.addDays(referenceDate, data.interval);

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
