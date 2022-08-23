import * as queries from '~/queries';
import * as dateUtils from '~/utils/date';

describe('getDueCardUids', () => {
  test('returns cards due today', () => {
    const data = {
      dueSha1: {
        dateCreated: null,
        grade: 5,
        repetitions: 1,
        interval: 1,
        eFactor: 2.6,
        nextDueDate: new Date(),
      },
      oAeyjk6Ow: {
        dateCreated: null,
        grade: 5,
        repetitions: 1,
        interval: 1,
        eFactor: 2.6,
        nextDueDate: dateUtils.addDays(new Date(), 1),
      },
      dueSha2: {
        dateCreated: null,
        grade: 5,
        repetitions: 1,
        interval: 1,
        eFactor: 2.6,
        nextDueDate: dateUtils.subtractDays(new Date(), 1),
      },
    };
    const result = queries.getDueCardUids(data);

    expect(result).toEqual(['dueSha1', 'dueSha2']);
  });

  test('empty data', () => {
    const data = {};
    const result = queries.getDueCardUids(data);

    expect(result).toEqual([]);
  });
});
