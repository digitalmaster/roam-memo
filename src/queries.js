import {
  getStringBetween,
  parseConfigString,
  parseRoamDateString,
} from '~/utils/string';
import config from '~/config';
import * as stringUtils from '~/utils/string';
import * as dateUtils from '~/utils/date';

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getPageReferenceIds = async (pageTitle) => {
  const q = `[
    :find ?refUid
    :in $ ?tag
    :where
        [?tagPage :node/title ?tag]
        [?tagRefs :block/refs ?tagPage]
        [?tagRefs :block/uid ?refUid]
    ]`;

  const results = (await window.roamAlphaAPI.q(q, pageTitle)).map(
    (arr) => arr[0]
  );

  return results;
};

const getData = async ({ pageTitle, dataBlockName }) => {
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

  const dataResults = await window.roamAlphaAPI
    .q(q, pageTitle, dataBlockName)
    .map((arr) => arr[0])[0].children;

  const results = dataResults.reduce((acc, cur) => {
    const uid = getStringBetween(cur.string, '((', '))');
    acc[uid] = {};

    // Add date
    acc[uid].dateCreated = parseRoamDateString(
      getStringBetween(cur.children[0].string, '[[', ']]')
    );
    const latestChild = cur.children.find((child) => child.order === 0);
    for (const field of latestChild.children) {
      const [key, value] = parseConfigString(field.string);

      if (key === 'nextDueDate') {
        acc[uid][key] = parseRoamDateString(
          getStringBetween(value, '[[', ']]')
        );
      } else {
        acc[uid][key] = Number(value);
      }
    }
    return acc;
  }, {});

  return results;
};

const getDueCardUids = (data) => {
  const results = [];
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

export const getCardData = async ({ tag, pluginPageTitle }) => {
  const dataBlockName = 'data';
  const data = await getData({ pageTitle: pluginPageTitle, dataBlockName });

  // @TODO: Handle case where no data exists yet. Use references list to create default
  const referencesIds = await getPageReferenceIds(tag);
  return { cardData: data, dueCardUids: getDueCardUids(data) };
};

export const fetchBlockInfo = async (refUid) => {
  const q = `[
    :find (pull ?block [
      :block/string
      :block/children
      {:block/children ...}])
    :in $ ?refId
    :where
      [?block :block/uid ?refId]
    ]`;

  const dataResults = (await window.roamAlphaAPI.q(q, refUid))[0][0];
  return {
    questionBlockString: dataResults.string,
    questionBlockChildren: dataResults.children.map((child) => child.string),
  };
};

const getPage = (page) => {
  // returns the uid of a specific page in your graph.
  // _page_: the title of the page.
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

const getOrCreatePage = async (page) => {
  // returns the uid of a specific page in your graph, creating it first if it does not already exist.
  // _page_: the title of the page.
  roamAlphaAPI.createPage({ page: { title: page } });
  let result;
  while (!result) {
    await sleep(25);
    result = getPage(page);
  }
  return result;
};

const getBlockOnPage = (page, block) => {
  // returns the uid of a specific block on a specific page.
  // _page_: the title of the page.
  // _block_: the text of the block.
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
  // returns the uid of a specific child block underneath a specific parent block.
  // _parent_uid_: the uid of the parent block.
  // _block_: the text of the child block.
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

const createChildBlock = async (parent_uid, block, order) => {
  // returns the uid of a specific child block underneath a specific parent block, creating it first if it's not already there.
  // _parent_uid_: the uid of the parent block.
  // _block_: the text of the child block.
  // _order_: (optional) controls where to create the block, 0 for inserting at the top, -1 for inserting at the bottom.
  if (!order) {
    order = 0;
  }
  await window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': parent_uid, order: order },
    block: { string: block },
  });
  let block_uid;
  while (!block_uid) {
    await sleep(25);
    block_uid = getChildBlock(parent_uid, block);
  }
  return block_uid;
};

const createBlockOnPage = async (page, block, order) => {
  // creates a new top-level block on a specific page, returning the new block's uid.
  // _page_: the title of the page.
  // _block_: the text of the block.
  // _order_: (optional) controls where to create the block, 0 for top of page, -1 for bottom of page.
  let page_uid = getPage(page);
  return createChildBlock(page_uid, block, order);
};

const getOrCreateBlockOnPage = async (page, block, order) => {
  // returns the uid of a specific block on a specific page, creating it first as a top-level block if it's not already there.
  // _page_: the title of the page.
  // _block_: the text of the block.
  // _order_: (optional) controls where to create the block, 0 for top of page, -1 for bottom of page.
  let block_uid = getBlockOnPage(page, block);
  if (block_uid) return block_uid;
  return createBlockOnPage(page, block, order);
};

const getOrCreateChildBlock = async (parent_uid, block, order) => {
  // creates a new child block underneath a specific parent block, returning the new block's uid.
  // _parent_uid_: the uid of the parent block.
  // _block_: the text of the new block.
  // _order_: (optional) controls where to create the block, 0 for inserting at the top, -1 for inserting at the bottom.
  let block_uid = getChildBlock(parent_uid, block);
  if (block_uid) return block_uid;
  return createChildBlock(parent_uid, block, order);
};

export const savePracticeData = async ({ refUid, ...data }) => {
  await getOrCreatePage(config.pluginPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(
    config.pluginPageTitle,
    'data',
    -1
  );

  // Get child that matches refUid
  const cardDataBlockUid = await getOrCreateChildBlock(
    dataBlockUid,
    `((${refUid}))`,
    0
  );

  // Create new date child Note: Not using returned block id here because it
  // will be wrong if we practice the same question on the same day. This is
  // because the create createBlock() API doesn't return a refId for the created
  // block yet. As a workaround, i'm refetching children again and grabing the
  // top one
  const todayRoamDateString = stringUtils.dateToRoamDateString(new Date());
  const emoji = data.grade < 3 ? '🔴' : data.grade > 3 ? '🟢' : '🟠';
  await createChildBlock(
    cardDataBlockUid,
    `[[${todayRoamDateString}}]] ${emoji}`,
    0
  );
  const updatedCardBlocks = getChildrenBlocks(cardDataBlockUid);
  const newDataBlockId = updatedCardBlocks.find(
    (block) => block.order === 0
  ).uid;

  // Insert new block info
  const nextDueDate = dateUtils.addDays(new Date(), data.interval);
  for (const key of Object.keys(data)) {
    let value = data[key];
    if (key === 'nextDueDate') {
      value = `[[${stringUtils.dateToRoamDateString(nextDueDate)}]]`;
    }

    await createChildBlock(newDataBlockId, `${key}:: ${value}`, -1);
  }
};
