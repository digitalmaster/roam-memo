import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import calendar from 'dayjs/plugin/calendar';
dayjs.extend(calendar);

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
