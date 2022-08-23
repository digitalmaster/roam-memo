import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import settingsPanelConfig from '~/settingsPanelConfig.js';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import usePracticeCardsData from '~/hooks/usePracticeCardsData.jsx';
import useTags from '~/hooks/useTags.jsx';

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const { selectedTag, setSelectedTag, tagsList } = useTags();

  const { practiceCardsUids, practiceCardsData, displayCardCount, fetchPracticeData } =
    usePracticeCardsData({
      selectedTag,
    });

  React.useEffect(() => {
    extensionAPI.settings.panel.create(settingsPanelConfig({ fetchPracticeData }));
  }, []);

  const handleGradeClick = async ({ grade, refUid }) => {
    const cardData = practiceCardsData[refUid];
    await practice({ ...cardData, grade, refUid });
  };

  const handlePracticeClick = () => {
    fetchPracticeData();
    setShowPracticeOverlay(true);
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    fetchPracticeData();
  };

  const handleMemoTagChange = (tag) => {
    setSelectedTag(tag);
  };

  return (
    <Blueprint.HotkeysProvider>
      <SidePandelWidget onClickCallback={handlePracticeClick} displayCardCount={displayCardCount} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          practiceCardUids={practiceCardsUids}
          practiceCardsData={practiceCardsData}
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
