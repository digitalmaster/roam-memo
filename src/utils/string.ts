export const getStringBetween = (string, from, to) =>
  string.substring(string.indexOf(from) + from.length, string.lastIndexOf(to));

export const parseRoamDateString = (roamDateString: string): Date =>
  window.roamAlphaAPI.util.pageTitleToDate(roamDateString.trim());

export const dateToRoamDateString = (jsDateObject) =>
  window.roamAlphaAPI.util.dateToPageTitle(jsDateObject);

export const toDateString = (jsDateObject) => jsDateObject.toLocaleDateString('en-US');

export const parseConfigString = (configString) => configString.split('::').map((s) => s.trim());

export const pluralize = (value: number, singular: string, plural: string) => {
  if (value === 1) return singular;
  return plural;
};

export const isNumeric = (str) => {
  if (typeof str != 'string') return false; // we only process strings!

  return (
    // @ts-expect-error we expect data to not be number
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  );
};
