import * as React from 'react';
import config from '~/config';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import * as queries from '~/queries.js';

const App = () => {
  const [cardsData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);

  const init = async ({ launchPractice = false } = {}) => {
    // Get all card data
    const { cardsData, newCardsData, dueCardsUids } = await queries.getCardData({ ...config });

    setCardData({ ...cardsData, ...newCardsData });

    if (launchPractice) {
      // Always practice new cards first
      setPracticeCardUids([...Object.keys(newCardsData), ...dueCardsUids]);
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

  return (
    <>
      <SidePandelWidget onClickCallback={handlePracticeClick} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          setShowPracticeOverlay={setShowPracticeOverlay}
          practiceCardUids={practiceCardUids}
          handleGradeClick={handleGradeClick}
        />
      )}
    </>
  );
};

export default App;
