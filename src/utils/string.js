import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
export const getStringBetween = (string, from, to) =>
  string.substring(string.indexOf(from) + from.length, string.lastIndexOf(to));

export const parseRoamDateString = (roamDateString) =>
  dayjs(roamDateString, 'MMMM Do, YYYY').toDate();

export const dateToRoamDateString = (jsDateObject) =>
  dayjs(jsDateObject).format('MMMM Do, YYYY');

export const parseConfigString = (configString) =>
  configString.split('::').map((s) => s.trim());
