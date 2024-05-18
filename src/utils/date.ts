import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import calendar from 'dayjs/plugin/calendar';
dayjs.extend(calendar);

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  const result = new Date(date);
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

export const fromNow = (date) => {
  return dayjs(date).fromNow();
};

export const customFromNow = (date) => {
  const daysDiff = daysBetween(new Date(), date);
  if (daysDiff > -7 && daysDiff < 7) {
    return dayjs(date).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd', // Tuesday
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd', // Last Tuesday
      // sameElse: '', // we switch to .fromNow() at this range
    });
  } else {
    return fromNow(date);
  }
};

export const isSameDay = (d1: Date, d2: Date) => {
  if (!isDate(d1) || !isDate(d2)) return false;

  return d1.toDateString() === d2.toDateString();
};

export const isDate = (date: unknown) =>
  // @ts-expect-error we expect data to not be number
  date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
