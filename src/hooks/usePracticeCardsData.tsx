import * as React from 'react';
import { Records } from '~/models/session';
import * as queries from '~/queries';

const usePracticeCardsData = ({ selectedTag, dataPageTitle }) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState<string[]>([]);
  const [practiceCardsData, setPracticeCardsData] = React.useState<Records>({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [displayCardCounts, setDisplayCardCounts] = React.useState({ new: 0, due: 0 });

  React.useEffect(() => {
    (async () => {
      const { cardsData, newCardsUids, dueCardsUids } = await queries.getPracticeCardData({
        selectedTag,
        dataPageTitle,
      });

      // Always practice due cards first
      // @TODO: Perhaps make this order configurable?
      setPracticeCardsData(cardsData);
      setPracticeCardsUids([...dueCardsUids, ...newCardsUids]);
      setDisplayCardCounts({ new: newCardsUids.length, due: dueCardsUids.length });
    })();
  }, [selectedTag, dataPageTitle, refetchTrigger]);

  return {
    practiceCardsUids,
    practiceCardsData,
    displayCardCounts,
    fetchPracticeData: () => setRefetchTrigger((trigger) => !trigger),
  };
};

export default usePracticeCardsData;
