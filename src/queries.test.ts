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

describe.skip('getPluginPageData', () => {
  let windowSpy;
  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  const standardResponse = [
    [
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    order: 4,
                    string: 'grade:: 5',
                  },
                  {
                    order: 3,
                    string: 'repetitions:: 1',
                  },
                  {
                    order: 2,
                    string: 'interval:: 1',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 2.6',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 24th, 2022]]',
                  },
                ],
                order: 0,
                string: '[[August 23rd, 2022}]] 🟢',
              },
            ],
            order: 3,
            string: '((oAeyjk6Ow))',
          },
          {
            children: [
              {
                children: [
                  {
                    order: 4,
                    string: 'grade:: 0',
                  },
                  {
                    order: 3,
                    string: 'repetitions:: 0',
                  },
                  {
                    order: 2,
                    string: 'interval:: 1',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 1.7000000000000002',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 23rd, 2022]]',
                  },
                ],
                order: 2,
                string: '[[August 23rd, 2022}]] 🔴',
              },
              {
                children: [
                  {
                    order: 4,
                    string: 'grade:: 5',
                  },
                  {
                    order: 3,
                    string: 'repetitions:: 1',
                  },
                  {
                    order: 2,
                    string: 'interval:: 1',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 1.8000000000000003',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 24h, 2022]]',
                  },
                ],
                order: 1,
                string: '[[August 23rd, 2022}]] 🟢',
              },
              {
                children: [
                  {
                    order: 4,
                    string: 'grade:: 5',
                  },
                  {
                    order: 3,
                    string: 'repetitions:: 2',
                  },
                  {
                    order: 2,
                    string: 'interval:: 6',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 1.9000000000000004',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 29th, 2022]]',
                  },
                ],
                order: 0,
                string: '[[August 23rd, 2022}]] 🟢',
              },
            ],
            order: 2,
            string: '((Yz-azwpsr))',
          },
          {
            children: [
              {
                children: [
                  {
                    order: 3,
                    string: 'grade:: 0',
                  },
                  {
                    order: 2,
                    string: 'repetitions:: 0',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 1.7000000000000002interval:: 1',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 23rd, 2022]]',
                  },
                ],
                order: 0,
                string: '[[August 23rd, 2022}]] 🔴',
              },
            ],
            order: 1,
            string: '((EWWvgyRvG))',
          },
          {
            children: [
              {
                children: [
                  {
                    order: 4,
                    string: 'grade:: 5',
                  },
                  {
                    order: 3,
                    string: 'repetitions:: 1',
                  },
                  {
                    order: 2,
                    string: 'interval:: 1',
                  },
                  {
                    order: 1,
                    string: 'eFactor:: 2.6',
                  },
                  {
                    order: 0,
                    string: 'nextDueDate:: [[August 24th, 2022]]',
                  },
                ],
                order: 0,
                string: '[[August 23rd, 2022}]] 🟢',
              },
            ],
            order: 0,
            string: '((aUbsEHmyb))',
          },
        ],
        order: 0,
        string: 'data',
      },
    ],
  ];

  it('Standard mapped response', () => {
    windowSpy.mockImplementation(() => ({
      roamAlphaAPI: {
        q: () => new Promise((resolves) => resolves(standardResponse)),
      },
    }));

    expect(queries.getPluginPageData({ dataPageTitle: 'roam/memo' })).resolves.toBe({});
  });
});

describe('selectPracticeCardsData', () => {
  test('returns all cards when daily limit is set to 0', () => {
    const dueCardsUids = ['dueSha1', 'dueSha2'];
    const newCardsUids = ['newSha1', 'newSha2'];
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
    const result = queries.selectPracticeData({
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
