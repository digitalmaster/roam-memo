import * as React from 'react';
import { Today, TodayInitial } from '~/models/practice';
import { CompleteRecords } from '~/models/session';
import * as queries from '~/queries';

const usePracticeCardsData = ({
  tagsList,
  selectedTag,
  dataPageTitle,
  isCramming,
  dailyLimit,
  shuffleCards,
}) => {
  const [practiceData, setPracticeData] = React.useState<CompleteRecords>({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [today, setToday] = React.useState<Today>(TodayInitial);

  const refetchTriggerFn = () => setRefetchTrigger((trigger) => !trigger);

  React.useEffect(() => {
    (async () => {
      if (!selectedTag) return;

      const { practiceData, todayStats } = await queries.getPracticeData({
        tagsList,
        dataPageTitle,
        dailyLimit,
        isCramming,
        shuffleCards,
      });

      setToday(todayStats);
      setPracticeData(practiceData);
    })();
  }, [selectedTag, dataPageTitle, refetchTrigger, isCramming, dailyLimit, tagsList]);

  return {
    practiceData,
    fetchPracticeData: refetchTriggerFn,
    today,
  };
};

export default usePracticeCardsData;
