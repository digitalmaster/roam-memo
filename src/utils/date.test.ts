import * as dateUtils from '~/utils/date';

describe('addDays', () => {
  test('Current timezone', () => {
    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    expect(process.env.TZ).toBe('UTC');
    expect(timezoneOffset).toEqual(0);
  });

  test('Add one day', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const tomorrow = new Date(new Date().getTime() + dayInMs * 1);
    const tomorrowResult = dateUtils.addDays(new Date(), 1);

    expect(tomorrow).toEqual(tomorrowResult);
  });

  test('Add a week ', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const nextWeek = new Date(new Date().getTime() + dayInMs * 7);
    const nextWeekResult = dateUtils.addDays(new Date(), 7);

    expect(nextWeek).toEqual(nextWeekResult);
  });
});

describe('subtractDays', () => {
  test('Subtract one day', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const yesterday = new Date(new Date().getTime() - dayInMs * 1);
    const yesterdayResult = dateUtils.subtractDays(new Date(), 1);

    expect(yesterday).toEqual(yesterdayResult);
  });

  test('Subtract a week ', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const lastWeek = new Date(new Date().getTime() - dayInMs * 7);
    const lastWeekResult = dateUtils.subtractDays(new Date(), 7);

    expect(lastWeek).toEqual(lastWeekResult);
  });

  test('Subtract a month ', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const lastMonth = new Date(new Date().getTime() - dayInMs * 32);
    const lastMonthResult = dateUtils.subtractDays(new Date(), 32);

    expect(lastMonth).toEqual(lastMonthResult);
  });
});
describe('daysBetween', () => {
  test('Same time', () => {
    const today = new Date();

    expect(dateUtils.daysBetween(today, today)).toEqual(0);
  });

  test('Same day', () => {
    const hourInMs = 1000 * 60 * 60;
    const today = new Date();
    const earlierToday = new Date(today.getTime() - hourInMs * 13);

    expect(dateUtils.daysBetween(today, earlierToday)).toEqual(0);
  });

  test('7 days ', () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const today = new Date();
    const lastWeek = new Date(new Date().getTime() - dayInMs * 7);

    expect(dateUtils.daysBetween(lastWeek, today)).toEqual(7);
  });
});
