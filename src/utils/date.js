import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const daysBetween = (d1, d2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = d1;
  const secondDate = d2;

  const diffDays = Math.floor(Math.abs((firstDate - secondDate) / oneDay));

  return diffDays;
};

export const fromNow = (date) => dayjs(date).fromNow();
