import * as queries from '~/queries';
import * as dateUtils from '~/utils/date';
import * as testUtils from '~/utils/testUtils';
import { standardResponse } from './__mocks__/pluginPageBlockData';
import { ReviewModes } from './models/session';

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
        reviewMode: ReviewModes.DefaultSpacedInterval,
      },
      oAeyjk6Ow: {
        dateCreated: null,
        grade: 5,
        repetitions: 1,
        interval: 1,
        eFactor: 2.6,
        reviewMode: ReviewModes.DefaultSpacedInterval,
        nextDueDate: dateUtils.addDays(new Date(), 1),
      },
      dueSha2: {
        dateCreated: null,
        grade: 5,
        repetitions: 1,
        interval: 1,
        eFactor: 2.6,
        nextDueDate: dateUtils.subtractDays(new Date(), 1),
        reviewMode: ReviewModes.DefaultSpacedInterval,
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

describe('getPluginPageData', () => {
  let windowSpy;
  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('Standard mapped response', async () => {
    windowSpy.mockImplementation(
      testUtils.generateMockRoamApiImplemtationRoot({ queryResult: standardResponse })
    );
    const response = await queries.getPluginPageData({ dataPageTitle: 'roam/memo' });
    expect(response).toBeTruthy();
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
