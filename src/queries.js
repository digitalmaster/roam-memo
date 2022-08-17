import { getStringBetween, parseRoamDateString } from "./utils/string";

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
    const uid = getStringBetween(cur.string, "((", "))");
    acc[uid] = {};

    for (const field of cur.children) {
      const [key, value] = field.string.split("::").map((s) => s.trim());

      if (key === "nextDueDate") {
        acc[uid][key] = parseRoamDateString(
          getStringBetween(value, "[[", "]]")
        );
      } else {
        acc[uid][key] = Number(value);
      }
    }
    return acc;
  }, {});

  return results;
};

const getCardData = async ({ tag, pluginPageTitle }) => {
  const dataBlockName = "data";
  const data = await getData({ pageTitle: pluginPageTitle, dataBlockName });

  // @TODO: Handle case where no data exists yet. Use references list to create default
  const referencesIds = await getPageReferenceIds(tag);
  return data;
};

export const getCards = async ({ tag, pluginPageTitle }) => {
  const results = await getCardData({ tag, pluginPageTitle });
  return results;
};
