import * as React from 'react';
import PracticeOverlay from './components/PracticeOverlay.jsx';
import SidePandelWidget from './components/SidePandelWidget.jsx';
import { practice } from './practice.js';
import * as queries from './queries.js';

const config = {
  tag: '🐘',
  pluginPageTitle: 'roam/sr',
};

const App = () => {
  const [cardData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);

  const [dueCardUids, setDueCardUids] = React.useState([]);

  React.useEffect(() => {
    const fn = async () => {
      // Get all card data
      const { cardData, dueCardUids } = await queries.getCardData({
        tag: config.tag,
        pluginPageTitle: config.pluginPageTitle,
      });

      setCardData(cardData);
      setDueCardUids(dueCardUids);
    };

    fn();
  }, []);

  const handleGradeClick = async (practiceProps) => {
    await practice(practiceProps);
  };

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);
  const handlePracticeClick = async () => {
    setPracticeCardUids(dueCardUids);
    setShowPracticeOverlay(true);
  };

  return (
    <>
      <SidePandelWidget onClickCallback={handlePracticeClick} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          onClose={() => setShowPracticeOverlay(false)}
          cardData={cardData}
          practiceCardUids={practiceCardUids}
          onGradeClick={handleGradeClick}
        />
      )}
    </>
  );
};

export default App;
