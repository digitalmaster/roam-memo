export const getStringBetween = (string, from, to) =>
  string.substring(string.indexOf(from) + from.length, string.lastIndexOf(to));

export const parseRoamDateString = (roamDateString) =>
  window.roamAlphaAPI.util.pageTitleToDate(roamDateString);

export const dateToRoamDateString = (jsDateObject) =>
  window.roamAlphaAPI.util.dateToPageTitle(jsDateObject);

export const parseConfigString = (configString) => configString.split('::').map((s) => s.trim());
