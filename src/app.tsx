import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/overlay/PracticeOverlay';
import SidePannelWidget from '~/components/SidePanelWidget';
import practice from '~/practice';
import usePracticeData from '~/hooks/usePracticeData';
import useTags from '~/hooks/useTags';
import useSettings from '~/hooks/useSettings';
import useCollapseReferenceList from '~/hooks/useCollapseReferenceList';
import useOnBlockInteract from '~/hooks/useOnBlockInteract';
import useCommandPaletteAction from '~/hooks/useCommandPaletteAction';
import useCachedData from '~/hooks/useCachedData';
import useOnVisibilityStateChange from '~/hooks/useOnVisibilityStateChange';
import { IntervalMultiplierType, ReviewModes } from '~/models/session';

export interface handlePracticeProps {
  refUid: string;
  grade: number;
  reviewMode: ReviewModes;
  intervalMultiplier: number;
  intervalMultiplierType: IntervalMultiplierType;
}

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const [isCramming, setIsCramming] = React.useState(false);

  const { tagsListString, dataPageTitle, dailyLimit, rtlEnabled, shuffleCards } = useSettings();
  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { fetchCacheData } = useCachedData({ dataPageTitle, selectedTag });

  const { practiceData, today, fetchPracticeData } = usePracticeData({
    tagsList,
    selectedTag,
    dataPageTitle,
    isCramming,
    dailyLimit,
    shuffleCards,
  });

  const handlePracticeClick = async ({ refUid, ...cardData }: handlePracticeProps) => {
    if (!refUid) {
      console.error('HandlePracticeFn Error: No refUid provided');
      return;
    }

    try {
      await practice({
        ...cardData,
        dataPageTitle,
        dateCreated: new Date(),
        refUid,
        isCramming,
      });
    } catch (error) {
      console.error('Error Saving Practice Data', error);
    }
  };

  const refreshData = () => {
    fetchCacheData();
    fetchPracticeData();
  };

  useOnVisibilityStateChange(() => {
    if (showPracticeOverlay) return;
    refreshData();
  });

  const onShowPracticeOverlay = () => {
    refreshData();
    setShowPracticeOverlay(true);
    setIsCramming(false);
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    setIsCramming(false);
    refreshData();
  };

  const handleMemoTagChange = (tag) => {
    setSelectedTag(tag);
  };

  const handleReviewMoreClick = async () => {
    // @TODOZ: Handle this case.
    refreshData();
  };

  useCollapseReferenceList({ dataPageTitle });

  // Keep counters in sync as you add/remove tags from blocks
  const [tagsOnEnter, setTagsOnEnter] = React.useState([]);
  const onBlockEnterHandler = (elm: HTMLTextAreaElement) => {
    const tags = tagsList.filter((tag) => elm.value.includes(tag));
    setTagsOnEnter(tags);
  };
  const onBlockLeaveHandler = (elm: HTMLTextAreaElement) => {
    const tags = tagsList.filter((tag) => elm.value.includes(tag));

    if (tagsOnEnter.length !== tags.length) {
      fetchPracticeData();
    }
  };

  useOnBlockInteract({
    onEnterCallback: onBlockEnterHandler,
    onLeaveCallback: onBlockLeaveHandler,
  });

  useCommandPaletteAction({ onShowPracticeOverlay });

  return (
    <Blueprint.HotkeysProvider>
      <>
        <SidePannelWidget onClickCallback={onShowPracticeOverlay} today={today} />
        {showPracticeOverlay && (
          <PracticeOverlay
            isOpen={true}
            practiceData={practiceData}
            handlePracticeClick={handlePracticeClick}
            onCloseCallback={onClosePracticeOverlayCallback}
            handleMemoTagChange={handleMemoTagChange}
            handleReviewMoreClick={handleReviewMoreClick}
            tagsList={tagsList}
            selectedTag={selectedTag}
            isCramming={isCramming}
            setIsCramming={setIsCramming}
            rtlEnabled={rtlEnabled}
            today={today}
          />
        )}
      </>
    </Blueprint.HotkeysProvider>
  );
};

export default App;
