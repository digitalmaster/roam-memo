import * as practice from '~/practice';

describe('supermemo: simulate practice', () => {
  let initInput;
  let result;

  describe('Easy Path', () => {
    beforeAll(() => {
      initInput = {
        interval: 0,
        repetition: 0,
        efactor: 2.5,
      };
      result = undefined;
    });
    test('First practice', () => {
      result = practice.supermemo(initInput, 5);
      expect(result).toEqual({ efactor: 2.6, interval: 1, repetition: 1 });
    });

    test('Second practice', () => {
      result = practice.supermemo(result, 5);

      expect(result).toEqual({ efactor: 2.7, interval: 6, repetition: 2 });
    });

    test('Next practice', () => {
      result = practice.supermemo(result, 5);

      expect(result).toEqual({ efactor: 2.8000000000000003, interval: 16, repetition: 3 });
    });

    test('Next practice', () => {
      result = practice.supermemo(result, 5);

      expect(result).toEqual({ efactor: 2.9000000000000004, interval: 45, repetition: 4 });
    });

    test('Next practice', () => {
      result = practice.supermemo(result, 5);

      expect(result).toEqual({ efactor: 3.0000000000000004, interval: 131, repetition: 5 });
    });
  });

  describe('Regressions', () => {
    beforeEach(() => {
      initInput = { efactor: 3.0000000000000004, interval: 131, repetition: 5 };
      result = undefined;
    });

    test('Grade 0: Reset and review today', () => {
      result = practice.supermemo(initInput, 0);

      expect(result).toEqual({ efactor: 2.2000000000000006, interval: 0, repetition: 0 });
    });

    test('Grade 1: Review tomorrow', () => {
      result = practice.supermemo(initInput, 1);

      expect(result).toEqual({ efactor: 2.4600000000000004, interval: 1, repetition: 0 });
    });
  });

  describe('Relative', () => {
    const initInput = { efactor: 3.0000000000000004, interval: 131, repetition: 5 };
    const gradeResultsArr = new Array(6)

      .fill(undefined)
      .map((_, i) => ({ grade: i, ...practice.supermemo(initInput, i) }));

    const [result0, result1, result2, result3, result4, result5] = gradeResultsArr;

    test('Grade 0 should produce interval less all the rest', () => {
      const [result0, ...otherResults] = gradeResultsArr;

      for (const otherResult of otherResults) {
        expect(result0.interval).toBeLessThan(otherResult.interval);
      }
    });

    test('Grade 0 should be relative to Grade 1', () => {
      expect(result0.efactor).toBeLessThan(result1.efactor);
      expect(result0.interval).toBeLessThan(result1.interval);
    });

    test('1 and two both reset interval to 1 (review tomorrow)', () => {
      expect(result1.interval).toBe(1);
      expect(result2.interval).toBe(1);
    });

    test('Grade 1 should be relative to Grade 2', () => {
      expect(result1.efactor).toBeLessThan(result2.efactor);
    });

    test('Grade 2 should be relative to Grade 3', () => {
      expect(result2.efactor).toBeLessThan(result3.efactor);
      expect(result2.interval).toBeLessThan(result3.interval);
    });

    test('Grade 3 should be relative to Grade 4', () => {
      expect(result3.efactor).toBeLessThan(result4.efactor);
      expect(result3.interval).toBeLessThan(result4.interval);
    });

    test('Grade 4 should be relative to Grade 5', () => {
      expect(result4.efactor).toBeLessThan(result5.efactor);
      expect(result4.interval).toBeLessThan(result5.interval);
    });
  });
});
