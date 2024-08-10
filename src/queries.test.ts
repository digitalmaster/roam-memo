import * as queries from '~/queries';

describe.skip('selectPracticeCardsData', () => {
  test('returns all cards when daily limit is set to 0', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2'];
    const newCardsUids = ['newSha1', 'newSha2'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 0,
      isCramming: false,
    });

    expect(result).toEqual({
      dueCardsUids,
      newCardsUids,
    });
  });

  test('returns all cards when cramming', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2'];
    const newCardsUids = ['newSha1', 'newSha2'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 2,
      isCramming: true,
    });

    expect(result).toEqual({
      dueCardsUids,
      newCardsUids,
    });
  });

  test('returns all cards when total is not over the limit', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2'];
    const newCardsUids = ['newSha1', 'newSha2'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 4,
      isCramming: true,
    });

    expect(result).toEqual({
      dueCardsUids,
      newCardsUids,
    });
  });

  test('Distributes due and new count based on limit', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2', 'dueSha3', 'dueSha4'];
    const newCardsUids = ['newSha1', 'newSha2', 'newSha3', 'newSha4'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 4,
      isCramming: false,
    });
    const expectedResult = {
      dueCardsUids: dueCardsUids.slice(0, 3),
      newCardsUids: newCardsUids.slice(0, 1),
    };

    expect(result).toMatchObject(expectedResult);
  });

  test('Handles case where target new count is less available new card count', () => {
    const dueCardsUids = [
      'dueSha1',
      'dueSha2',
      'dueSha3',
      'dueSha4',
      'dueSha5',
      'dueSha6',
      'dueSha7',
      'dueSha8',
    ];
    const newCardsUids = ['newSha1'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 8,
      isCramming: false,
    });
    const expectedResult = {
      dueCardsUids: dueCardsUids.slice(0, 7),
      newCardsUids: newCardsUids.slice(0, 1),
    };

    expect(result).toMatchObject(expectedResult);
  });

  test('Handles case where target new is less than 1', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2', 'dueSha3', 'dueSha4'];
    const newCardsUids = ['newSha1', 'newSha2', 'newSha3', 'newSha4'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 2,
      isCramming: false,
    });
    const expectedResult = {
      dueCardsUids: dueCardsUids.slice(0, 1),
      newCardsUids: newCardsUids.slice(0, 1),
    };

    expect(result).toMatchObject(expectedResult);
  });

  test('Handles case where limit is 1', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2', 'dueSha3', 'dueSha4'];
    const newCardsUids = ['newSha1', 'newSha2', 'newSha3', 'newSha4'];
    const result = queries.calculateRemainingCounts({
      dueCardsUids,
      newCardsUids,
      dailyLimit: 1,
      isCramming: false,
    });
    const expectedResult = {
      dueCardsUids: dueCardsUids.slice(0, 1),
      newCardsUids: newCardsUids.slice(0, 0),
    };

    expect(result).toMatchObject(expectedResult);
  });
});
