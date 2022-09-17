import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import usePracticeCardsData from '~/hooks/usePracticeCardsData.jsx';
import useTags from '~/hooks/useTags.jsx';
import useSettings from '~/hooks/useSettings';
import * as asyncUtils from '~/utils/async';
import * as domUtils from '~/utils/dom';

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const { tagsListString, pluginPageTitle } = useSettings();

  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { practiceCardsUids, practiceCardsData, displayCardCounts, fetchPracticeData } =
    usePracticeCardsData({
      selectedTag,
      pluginPageTitle,
    });

  const handleGradeClick = async ({ grade, refUid }) => {
    if (!refUid) return;

    const cardData = practiceCardsData[refUid];
    await practice({ ...cardData, grade, refUid, pluginPageTitle });
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

  // Collapse memo data block ref by default (to keep things less noisy)
  // @TODO: Maybe make this configurable
  React.useEffect(() => {
    const collapseDataReferenceBlock = async () => {
      await asyncUtils.sleep(100);
      const elm = [...document.querySelectorAll('.rm-ref-page-view .rm-ref-page-view-title')].find(
        (elm) => elm.textContent === pluginPageTitle
      );

      const collapseControlBtn = elm?.parentNode.querySelector('.rm-caret-open');
      collapseControlBtn && domUtils.simulateMouseClick(collapseControlBtn);
    };
    collapseDataReferenceBlock(); // trigger on page load
    const onRouteChange = () => {
      collapseDataReferenceBlock();
    };
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
    };
  }, [pluginPageTitle]);

  return (
    <Blueprint.HotkeysProvider>
      <SidePandelWidget
        onClickCallback={handlePracticeClick}
        displayCardCounts={displayCardCounts}
      />
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
