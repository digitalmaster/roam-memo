import {
  getStringBetween,
  parseConfigString,
  parseRoamDateString,
} from './utils/string';

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

    for (const field of cur.children) {
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

export const updateDateOrCreateData = async (refUid) => {};
