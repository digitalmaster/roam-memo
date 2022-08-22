import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import settingsPanelConfig from '~/settingsPanelConfig.js';
import getSettings from '~/getSettings';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import * as queries from '~/queries.js';

const App = () => {
  const [cardsData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const [displayCardCount, setDisplayCardCount] = React.useState(0);
  const [tagsList, setTagsList] = React.useState([]);
  const [selectedTag, setSelectedTag] = React.useState();

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);

  const init = async ({ launchPractice = false, tag } = {}) => {
    console.log('Roam Memo initializing state...');
    const settings = getSettings();
    const tagsList = settings.tagsList.split(',').map((tag) => tag.trim());
    const selectedTag = tag || tagsList[0];

    // Get all card data
    const { cardsData, newCardsData, dueCardsUids } = await queries.getCardData({
      tag: selectedTag,
      pluginPageTitle: settings.pluginPageTitle,
    });
    const practiceCardUids = [...Object.keys(newCardsData), ...dueCardsUids];

    setCardData({ ...cardsData, ...newCardsData });
    setDisplayCardCount(practiceCardUids.length);

    if (launchPractice) {
      setTagsList(tagsList);
      setSelectedTag(selectedTag);
      // Always practice new cards first
      setPracticeCardUids(practiceCardUids);
      setShowPracticeOverlay(true);
    }
  };

  React.useEffect(() => {
    extensionAPI.settings.panel.create(settingsPanelConfig({ initFn: init }));
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

  const handleMemoTagChange = (tag) => {
    init({ tag, launchPractice: true });
  };

  return (
    <Blueprint.HotkeysProvider>
      <SidePandelWidget onClickCallback={handlePracticeClick} displayCardCount={displayCardCount} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          practiceCardUids={practiceCardUids}
          handleGradeClick={handleGradeClick}
          onCloseCallback={onClosePracticeOverlayCallback}
          handleMemoTagChange={handleMemoTagChange}
          tagsList={tagsList}
          selectedTag={selectedTag}
        />
      )}
    </Blueprint.HotkeysProvider>
  );
};

export default App;
