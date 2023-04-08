export const getStringBetween = (string, from, to) =>
  string.substring(string.indexOf(from) + from.length, string.lastIndexOf(to));

export const parseRoamDateString = (roamDateString: string): Date =>
  window.roamAlphaAPI.util.pageTitleToDate(roamDateString.trim());

export const dateToRoamDateString = (jsDateObject) =>
  window.roamAlphaAPI.util.dateToPageTitle(jsDateObject);

export const toDateString = (jsDateObject) => jsDateObject.toLocaleDateString('en-US');

export const parseConfigString = (configString) => configString.split('::').map((s) => s.trim());
