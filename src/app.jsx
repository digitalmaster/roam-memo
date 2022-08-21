import * as React from 'react';
import config from '~/config';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import * as queries from '~/queries.js';

const App = () => {
  const [cardsData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const [displayCardCount, setDisplayCardCount] = React.useState(0);

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);

  const init = async ({ launchPractice = false } = {}) => {
    // Get all card data
    const { cardsData, newCardsData, dueCardsUids } = await queries.getCardData({ ...config });
    const practiceCardUids = [...Object.keys(newCardsData), ...dueCardsUids];

    setCardData({ ...cardsData, ...newCardsData });
    setDisplayCardCount(practiceCardUids.length);

    if (launchPractice) {
      // Always practice new cards first
      setPracticeCardUids(practiceCardUids);
      setShowPracticeOverlay(true);
    }
  };

  React.useEffect(() => {
    init();
  }, []);

  const handleGradeClick = async ({ grade, refUid }) => {
    const cardData = cardsData[refUid];
    await practice({ ...cardData, grade, refUid });
  };

  const handlePracticeClick = () => {
    init({ launchPractice: true });
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    init();
  };

  return (
    <>
      <SidePandelWidget onClickCallback={handlePracticeClick} displayCardCount={displayCardCount} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          practiceCardUids={practiceCardUids}
          handleGradeClick={handleGradeClick}
          onCloseCallback={onClosePracticeOverlayCallback}
        />
      )}
    </>
  );
};

export default App;
