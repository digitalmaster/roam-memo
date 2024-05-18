import { ReviewModes, Session } from '~/models/session';
import { generateNewSession } from '~/queries';
import * as dateUtils from '~/utils/date';

export const mockQueryResult = (data) => {
  const queryResult = generateMockRoamApiImplemtation(data);

  Object.defineProperty(window, 'roamAlphaAPI', {
    value: queryResult,
    writable: true,
  });
};

export const generateMockRoamApiImplemtation = (queryResult) => ({
  q: jest.fn(() => Promise.resolve(queryResult)),
  util: {
    pageTitleToDate: mockPageTitleToDate,
  },
});
export const generateMockRoamApiImplemtationRoot = ({ queryResult }) => {
  return () => ({
    roamAlphaAPI: generateMockRoamApiImplemtation(queryResult),
  });
};

type Child = {
  order: number;
  string: string;
  children?: Child[];
};

export class TestSessionsResponse {
  uid: string;
  sessions: any[];

  constructor({ uid = 'id_0' } = {}) {
    this.uid = uid;
    this.sessions = [];
  }

  withSession(overrides: { reviewMode?: ReviewModes } & { [key in keyof Session]?: any } = {}) {
    this.sessions.push({
      ...generateNewSession({ reviewMode: ReviewModes.DefaultSpacedInterval, isNew: false }),
      ...overrides,
    });

    return this;
  }

  createChild(order: number, string: string, children?: Child[]): Child {
    return { order, string, children };
  }

  build() {
    return [
      [
        this.createChild(0, 'data', [
          this.createChild(
            0,
            `((${this.uid}))`,
            this.sessions.map((session, index, sessions) =>
              this.createChild(
                sessions.length - 1 - index,
                '[[August 23rd, 2022}]] 🟢',
                Object.entries(session).map(([key, value], index, fieldList) => {
                  let parsedValue = '';
                  if (dateUtils.isDate(value)) {
                    parsedValue = mockDateToRoamDateString(value);
                  }

                  return this.createChild(
                    fieldList.length - 1 - index,
                    `${key}:: ${parsedValue || value}`
                  );
                })
              )
            )
          ),
        ]),
      ],
    ];
  }
}

function mockDateToRoamDateString(date) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let daySuffix;
  if (day % 10 === 1 && day !== 11) {
    daySuffix = 'st';
  } else if (day % 10 === 2 && day !== 12) {
    daySuffix = 'nd';
  } else if (day % 10 === 3 && day !== 13) {
    daySuffix = 'rd';
  } else {
    daySuffix = 'th';
  }

  return `[[${month} ${day}${daySuffix}, ${year}]]`;
}

function mockPageTitleToDate(formattedDate) {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  // Remove the surrounding brackets and split the string
  // eslint-disable-next-line no-useless-escape
  const cleanedDate = formattedDate.replace(/[\[\]]/g, '');
  const [monthDay, year] = cleanedDate.split(', ');
  const [month, dayWithSuffix] = monthDay.split(' ');

  // Extract the numeric part of the day
  const day = parseInt(dayWithSuffix);

  // Get the month index
  const monthIndex = months[month];

  // Create and return the Date object
  return new Date(year, monthIndex, day);
}
