import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
export const getStringBetween = (string, from, to) =>
  string.substring(string.indexOf(from) + from.length, string.lastIndexOf(to));

export const parseRoamDateString = (roamDateString) =>
  dayjs(roamDateString, "MMMM Do, YYYY").toDate();

export const parseConfigString = (configString) =>
  configString.split("::").map((s) => s.trim());
