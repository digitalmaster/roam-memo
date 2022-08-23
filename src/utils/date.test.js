import * as dateUtils from '~/utils/date';

describe('addDays', () => {
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
