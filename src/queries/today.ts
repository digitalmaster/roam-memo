import * as dateUtils from '~/utils/date';
import * as objectUtils from '~/utils/object';
import { CompleteRecords, RecordUid, Session } from '~/models/session';
import { CompletionStatus, RenderMode, Today, TodayInitial } from '~/models/practice';
import { generateNewSession } from '~/queries/utils';

export const initializeToday = ({ tagsList, cachedData }) => {
  const today: Today = objectUtils.deepClone(TodayInitial);

  for (const tag of tagsList) {
    const cachedTagData = cachedData?.[tag];

    today.tags[tag] = {
      status: CompletionStatus.Unstarted,
      completed: 0,
      due: 0,
      new: 0,
      newUids: [],
      dueUids: [],
      completedUids: [],
      completedDue: 0,
      completedNew: 0,
      completedDueUids: [],
      completedNewUids: [],
      renderMode: cachedTagData?.renderMode || RenderMode.Normal,
    };
  }

  return today;
};

export const calculateTodayStatus = ({ today, tagsList }) => {
  // Calculate the status of each tag
  for (const tag of tagsList) {
    const completed = today.tags[tag].completed;
    const remaining = today.tags[tag].new + today.tags[tag].due;

    if (remaining === 0) {
      today.tags[tag].status = CompletionStatus.Finished;
    } else if (completed > 0) {
      today.tags[tag].status = CompletionStatus.Partial;
    } else {
      today.tags[tag].status = CompletionStatus.Unstarted;
    }
  }

  // Calculate the status of the combined counts
  const completed = today.combinedToday.completed;
  const remaining = today.combinedToday.new + today.combinedToday.due;

  if (remaining === 0) {
    today.combinedToday.status = CompletionStatus.Finished;
  } else if (completed > 0) {
    today.combinedToday.status = CompletionStatus.Partial;
  } else {
    today.combinedToday.status = CompletionStatus.Unstarted;
  }
};

/**
 * Adds data for all the cards practised today
 */
export const calculateCompletedTodayCounts = async ({ today, tagsList, sessionData }) => {
  for (const tag of tagsList) {
    let count = 0;
    const completedUids = [];
    const completedDueUids = [];
    const completedNewUids = [];

    const currentTagSessionData = sessionData[tag];
    Object.keys(currentTagSessionData).forEach((cardUid) => {
      const cardData = currentTagSessionData[cardUid];
      const latestSession = cardData[cardData.length - 1];
      const isCompletedToday =
        latestSession && dateUtils.isSameDay(latestSession.dateCreated, new Date());

      if (isCompletedToday) {
        const isFirstSession = cardData.length === 1;
        const wasDueToday = !isFirstSession;
        const wasNew = isFirstSession;

        count++;
        completedUids.push(cardUid);
        if (wasDueToday) completedDueUids.push(cardUid);
        if (wasNew) completedNewUids.push(cardUid);
      }
    });

    today.tags[tag] = {
      ...(today.tags[tag] || {}),
      completed: count,
      completedUids,
      completedDueUids,
      completedNewUids,
      completedDue: completedDueUids.length,
      completedNew: completedNewUids.length,
    };
  }

  return today;
};

export const calculateCombinedCounts = ({ today, tagsList }) => {
  // Reset combined counts
  const todayInitial: Today = objectUtils.deepClone(TodayInitial);

  today.combinedToday = todayInitial.combinedToday;

  for (const tag of tagsList) {
    today.combinedToday.due += today.tags[tag].due;
    today.combinedToday.new += today.tags[tag].new;
    today.combinedToday.dueUids = today.combinedToday.dueUids.concat(today.tags[tag].dueUids);
    today.combinedToday.newUids = today.combinedToday.newUids.concat(today.tags[tag].newUids);
    today.combinedToday.completed += today.tags[tag].completed;
    today.combinedToday.completedUids = today.combinedToday.completedUids.concat(
      today.tags[tag].completedUids
    );
    today.combinedToday.completedDue += today.tags[tag].completedDue;
    today.combinedToday.completedDueUids = today.combinedToday.completedDueUids.concat(
      today.tags[tag].completedDueUids
    );
    today.combinedToday.completedNew += today.tags[tag].completedNew;
    today.combinedToday.completedNewUids = today.combinedToday.completedNewUids.concat(
      today.tags[tag].completedNewUids
    );
  }
};

/**
 * Create new cards for all referenced cards with no session data yet
 */
export const addNewCards = ({
  today,
  tagsList,
  cardUids,
  pluginPageData,
  shuffleCards,
}: {
  today: Today;
  tagsList: string[];
  cardUids: Record<string, RecordUid[]>;
  pluginPageData: CompleteRecords;
  shuffleCards: boolean;
}) => {
  for (const currentTag of tagsList) {
    const allSelectedTagCardsUids = cardUids[currentTag];
    const newCardsUids: RecordUid[] = [];

    allSelectedTagCardsUids.forEach((referenceId) => {
      if (!pluginPageData[referenceId] || !pluginPageData[referenceId].length) {
        // New
        newCardsUids.push(referenceId);
        pluginPageData[referenceId] = [generateNewSession()];
      }
    });

    // Shuffle cards if necessary in the most efficient way possible
    if (shuffleCards) {
      newCardsUids.sort(() => Math.random() - 0.5);
    } else {
      // Currently list seems to be sorted from newest to oldest so refersing so
      // oldest new (this double flip hurts to say out loud but it's true) cards are
      // first
      newCardsUids.reverse();
    }

    today.tags[currentTag] = {
      ...today.tags[currentTag],
      newUids: newCardsUids,
      new: newCardsUids.length,
    };
  }
};

export const getDueCardUids = (currentTagSessionData: CompleteRecords, isCramming) => {
  const results: RecordUid[] = [];
  if (!Object.keys(currentTagSessionData).length) return results;

  const now = new Date();
  Object.keys(currentTagSessionData).forEach((cardUid) => {
    const cardData = currentTagSessionData[cardUid] as Session[];

    const latestSession = cardData[cardData.length - 1];
    if (!latestSession) return;

    const nextDueDate = latestSession.nextDueDate;

    if (isCramming || nextDueDate <= now) {
      results.push(cardUid);
    }
  });

  // Sort due cards by nextDueDate (due soonest first to increase retention,
  // accepting that cards that are more past due will likely be forgotten)
  results.sort((a, b) => {
    const aCards = currentTagSessionData[a] as Session[];
    const aLatestSession = aCards[aCards.length - 1];
    const bCards = currentTagSessionData[b] as Session[];
    const bLatestSession = bCards[bCards.length - 1];

    return aLatestSession.nextDueDate < bLatestSession.nextDueDate ? 1 : -1;
  });

  return results;
};

export const addDueCards = ({ today, tagsList, sessionData, isCramming, shuffleCards }) => {
  for (const currentTag of tagsList) {
    const currentTagSessionData = sessionData[currentTag];
    const dueCardsUids = getDueCardUids(currentTagSessionData, isCramming);

    if (shuffleCards) {
      dueCardsUids.sort(() => Math.random() - 0.5);
    }

    today.tags[currentTag] = {
      ...today.tags[currentTag],
      dueUids: dueCardsUids,
      due: dueCardsUids.length,
    };
  }
};

/**
 * Here we're adding back completed cards to counts. This is so we can compute
 * the initial distribution of cards (the distribution before we completed
 * cards). This allows us to maintain the same distribution on re-runs (enabling
 * features like partial completions that don't redistribute everytime)
 */
export const restoreCompletedUids = ({ today, tagsList }) => {
  for (const currentTag of tagsList) {
    today.tags[currentTag].newUids.push(...today.tags[currentTag].completedNewUids);
    today.tags[currentTag].dueUids.push(...today.tags[currentTag].completedDueUids);
    today.tags[currentTag].new = today.tags[currentTag].newUids.length;
    today.tags[currentTag].due = today.tags[currentTag].dueUids.length;
  }
};
