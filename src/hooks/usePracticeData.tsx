import * as React from 'react';
import { NewRecords, Records, RecordUid } from '~/models/session';
import * as queries from '~/queries';

const calculateCombinedCardCounts = (displayCardCounts) => {
  const combinedCounts = { combined: { new: 0, due: 0 } };
  for (const key of Object.keys(displayCardCounts)) {
    combinedCounts.combined.new += displayCardCounts[key].new;
    combinedCounts.combined.due += displayCardCounts[key].due;
  }

  return {
    ...displayCardCounts,
    ...combinedCounts,
  };
};

const usePracticeCardsData = ({
  tagsList,
  selectedTag,
  dataPageTitle,
  isCramming,
  dailyLimit,
  lastCompletedDate,
}) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState<RecordUid[]>([]);
  const [practiceData, setPracticeData] = React.useState<Records | NewRecords>({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);

  const [displayCardCounts, setDisplayCardCounts] = React.useState({});

  const [completedTodayCount, setCompletedTodayCount] = React.useState(0);
  const [remainingDueCardsCount, setRemainingDueCardsCount] = React.useState(0);
  const refetchTriggerFn = () => setRefetchTrigger((trigger) => !trigger);

  React.useEffect(() => {
    (async () => {
      if (!selectedTag) return;

      const {
        pluginPageData,
        newCardsUids,
        dueCardsUids,
        allSelectedTagCardsUids,
        completedTodayCount,
        remainingDueCardsCount,
      } = await queries.getPracticeData({
        selectedTag,
        dataPageTitle,
        dailyLimit,
        isCramming,
        lastCompletedDate,
      });

      setRemainingDueCardsCount(remainingDueCardsCount);
      setPracticeData(pluginPageData);
      setCompletedTodayCount(completedTodayCount);

      if (isCramming) {
        setPracticeCardsUids(
          Object.keys(pluginPageData).filter((uid) => allSelectedTagCardsUids.includes(uid))
        );
      } else {
        // Always practice due cards first
        // @TODO: Perhaps make this order configurable?
        setPracticeCardsUids([...dueCardsUids, ...newCardsUids]);
      }

      const displayCountsData = {
        [selectedTag]: { new: newCardsUids.length, due: dueCardsUids.length },
      };
      for (const tag of tagsList) {
        if (tag === selectedTag) continue;

        const { newCardsUids, dueCardsUids } = await queries.getPracticeData({
          selectedTag: tag,
          dataPageTitle,
          dailyLimit,
          isCramming,
          lastCompletedDate,
        });

        displayCountsData[tag] = { new: newCardsUids.length, due: dueCardsUids.length };
      }

      setDisplayCardCounts(displayCountsData);
    })();
  }, [
    selectedTag,
    dataPageTitle,
    refetchTrigger,
    isCramming,
    dailyLimit,
    lastCompletedDate,
    tagsList,
  ]);

  return {
    practiceCardsUids,
    practiceData,
    displayCardCounts: calculateCombinedCardCounts(displayCardCounts),
    fetchPracticeData: refetchTriggerFn,
    completedTodayCount,
    remainingDueCardsCount,
  };
};

export default usePracticeCardsData;
