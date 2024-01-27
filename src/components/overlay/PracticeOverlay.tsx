import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as BlueprintSelect from '@blueprintjs/select';
import styled from '@emotion/styled';
import useBlockInfo from '~/hooks/useBlockInfo';
import * as asyncUtils from '~/utils/async';
import * as dateUtils from '~/utils/date';
import * as stringUtils from '~/utils/string';
import Lottie from 'react-lottie';
import doneAnimationData from '~/lotties/done.json';
import Tooltip from '~/components/Tooltip';
import mediaQueries from '~/utils/mediaQueries';

import CardBlock from '~/components/overlay/CardBlock';
import Footer from '~/components/overlay/Footer';
import ButtonTags from '~/components/ButtonTags';

const PracticeOverlay = ({
  isOpen,
  tagsList,
  selectedTag,
  onCloseCallback,
  practiceCardUids,
  practiceData,
  handleGradeClick,
  handleMemoTagChange,
  handleReviewMoreClick,
  isCramming,
  setIsCramming,
  saveCacheData,
  lastCompletedDate,
  dailyLimit,
  completedTodayCount,
  remainingDueCardsCount,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const totalCardsCount = practiceCardUids.length;
  const hasCards = totalCardsCount > 0;
  const isDone = currentIndex > practiceCardUids.length - 1;
  const isLastCompleteDateToday = dateUtils.isSameDay(lastCompletedDate, new Date());
  const isFirst = currentIndex === 0;
  const reviewCountReset = completedTodayCount && !lastCompletedDate;

  const dailyLimitDelta =
    dailyLimit && completedTodayCount && !isDone && !reviewCountReset ? completedTodayCount : 0;

  const currentCardRefUid = practiceCardUids[currentIndex];
  const currentCardData = practiceData[currentCardRefUid];

  const isNew = currentCardData?.isNew;
  const nextDueDate = currentCardData?.nextDueDate;

  const isDueToday = dateUtils.daysBetween(nextDueDate, new Date()) === 0;
  const status = isNew
    ? 'new'
    : isDueToday
    ? 'dueToday'
    : currentCardData?.nextDueDate
    ? 'pastDue'
    : null;

  const { data: blockInfo } = useBlockInfo({ refUid: currentCardRefUid });
  const hasBlockChildren = !!blockInfo.children && !!blockInfo.children.length;
  const [showAnswers, setShowAnswers] = React.useState(false);
  const [hasCloze, setHasCloze] = React.useState(true);

  React.useEffect(() => {
    if (hasBlockChildren || hasCloze) {
      setShowAnswers(false);
    } else {
      setShowAnswers(true);
    }
  }, [hasBlockChildren, hasCloze, currentIndex, tagsList]);

  // On show "done" screen
  React.useEffect(() => {
    if (isDone) {
      if (isCramming) {
        setIsCramming(false);
      } else if (!isLastCompleteDateToday) {
        saveCacheData({ lastCompletedDate: new Date() });
      }
    }
  }, [isDone]);

  const onTagChange = async (tag) => {
    setCurrentIndex(0);
    handleMemoTagChange(tag);
    setIsCramming(false);

    // To prevent 'space' key event from triggering dropdown
    await asyncUtils.sleep(200);

    if (document.activeElement instanceof HTMLElement) {
      document?.activeElement.blur();
    }
  };

  const onGradeClick = React.useCallback(
    (props) => {
      if (isDone) return;
      handleGradeClick(props);
      setShowAnswers(false);
      setCurrentIndex(currentIndex + 1);
    },
    [currentIndex, handleGradeClick, isDone]
  );

  const onSkipClick = React.useCallback(() => {
    if (isDone) return;

    setShowAnswers(false);
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, isDone]);

  const onPrevClick = React.useCallback(() => {
    if (isFirst) return;

    setShowAnswers(false);
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex, isFirst]);

  const onStartCrammingClick = () => {
    setIsCramming(true);
    setCurrentIndex(0);
  };

  const lottieAnimationOption = {
    loop: true,
    autoplay: true,
    animationData: doneAnimationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };
  const lottieStyle = {
    height: 200,
    width: 'auto',
  };

  const [showBreadcrumbs, setShowBreadcrumbs] = React.useState(false);
  const hotkeys = React.useMemo(
    () => [
      {
        combo: 'B',
        global: true,
        label: 'Show BreadCrumbs',
        onKeyDown: () => setShowBreadcrumbs(!showBreadcrumbs),
      },
    ],
    [showBreadcrumbs]
  );
  Blueprint.useHotkeys(hotkeys);

  return (
    // @ts-ignore
    <Dialog
      isOpen={isOpen}
      onClose={onCloseCallback}
      className="pb-0 bg-white"
      canEscapeKeyClose={false}
    >
      <Header
        className="bp3-dialog-header outline-none focus:outline-none focus-visible:outline-none"
        tagsList={tagsList}
        selectedTag={selectedTag}
        currentIndex={currentIndex}
        totalCardsCount={totalCardsCount}
        onCloseCallback={onCloseCallback}
        onTagChange={onTagChange}
        status={status}
        isDone={isDone}
        nextDueDate={nextDueDate}
        showBreadcrumbs={showBreadcrumbs}
        setShowBreadcrumbs={setShowBreadcrumbs}
        isCramming={isCramming}
        dailyLimitDelta={dailyLimitDelta}
      />

      <DialogBody className="bp3-dialog-body overflow-y-scroll m-0 pt-6 pb-8 px-4">
        {currentCardRefUid ? (
          <CardBlock
            refUid={currentCardRefUid}
            showAnswers={showAnswers}
            setHasCloze={setHasCloze}
            breadcrumbs={blockInfo.breadcrumbs}
            showBreadcrumbs={showBreadcrumbs}
          />
        ) : (
          <div className="flex items-center flex-col">
            <Lottie options={lottieAnimationOption} style={lottieStyle} />
            {remainingDueCardsCount ? (
              <div>
                Reviewed {completedTodayCount}{' '}
                {stringUtils.pluralize(completedTodayCount, 'card', 'cards')} today.{' '}
                <a onClick={handleReviewMoreClick}>Review more</a>
              </div>
            ) : (
              <div>No cards left to review!</div>
            )}
          </div>
        )}
      </DialogBody>
      <Footer
        refUid={currentCardRefUid}
        onGradeClick={onGradeClick}
        onSkipClick={onSkipClick}
        onPrevClick={onPrevClick}
        hasBlockChildren={hasBlockChildren}
        setShowAnswers={setShowAnswers}
        showAnswers={showAnswers}
        isDone={isDone}
        hasCards={hasCards}
        onCloseCallback={onCloseCallback}
        currentCardData={currentCardData}
        onStartCrammingClick={onStartCrammingClick}
      />
    </Dialog>
  );
};

const Dialog = styled(Blueprint.Dialog)`
  display: grid;
  grid-template-rows: 50px 1fr auto;
  max-height: 80vh;
  width: 90vw;

  ${mediaQueries.lg} {
    width: 80vw;
  }

  ${mediaQueries.xl} {
    width: 70vw;
  }
`;

const DialogBody = styled.div`
  overflow-x: hidden; // because of tweaks we do in ContentWrapper container overflows
  min-height: 200px;
`;

const HeaderWrapper = styled.div`
  justify-content: space-between;
  color: #5c7080;
  background-color: #f6f9fd;
  box-shadow: 0 1px 0 rgb(16 22 26 / 10%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-wrap: normal;
  line-height: inherit;
  margin: 0;
  min-height: 50px;

  /* Shortcut way to tag selector color */
  & .bp3-button {
    color: #5c7080;
  }
`;

const TagSelector = ({ tagsList, selectedTag, onTagChange }) => {
  return (
    // @ts-ignore
    <BlueprintSelect.Select
      items={tagsList}
      activeItem={selectedTag}
      filterable={false}
      itemRenderer={(tag, { handleClick, modifiers }) => {
        return (
          <TagSelectorItem text={tag} active={modifiers.active} key={tag} onClick={handleClick} />
        );
      }}
      onItemSelect={(tag) => {
        onTagChange(tag);
      }}
      popoverProps={{ minimal: true }}
    >
      <Blueprint.Button text={selectedTag} rightIcon="caret-down" minimal />
    </BlueprintSelect.Select>
  );
};

const TagSelectorItemWrapper = styled.div<{ active: boolean }>`
  padding: 4px 6px;
  background-color: ${({ active }) => (active ? '#e8edf4' : 'white')};
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ active }) => (active ? '#e8edf4' : '#f6f9fd')};
  }
`;

const TagSelectorItem = ({ text, onClick, active, key }) => {
  return (
    <TagSelectorItemWrapper onClick={onClick} active={active} key={key} tabIndex={-1}>
      {text}
    </TagSelectorItemWrapper>
  );
};

const StatusBadge = ({ status, nextDueDate, isCramming }) => {
  if (isCramming) {
    return (
      <Tooltip content="Reviews don't affect scheduling" placement="left">
        <Blueprint.Tag intent="none">Cramming</Blueprint.Tag>
      </Tooltip>
    );
  }
  switch (status) {
    case 'new':
      return (
        <Blueprint.Tag intent="success" minimal>
          New
        </Blueprint.Tag>
      );

    case 'dueToday':
      return (
        <Blueprint.Tag intent="primary" minimal>
          Due Today
        </Blueprint.Tag>
      );

    case 'pastDue': {
      const timeAgo = dateUtils.customFromNow(nextDueDate);
      return (
        <Blueprint.Tag intent="warning" title={`Due ${timeAgo}`} minimal>
          Past Due
        </Blueprint.Tag>
      );
    }
    default:
      return null;
  }
};

const BoxIcon = styled(Blueprint.Icon)`
  margin-right: 5px !important;
`;

const BreadcrumbTooltipContent = ({ showBreadcrumbs }) => {
  return (
    <div className="flex align-center">
      {`${showBreadcrumbs ? 'Hide' : 'Show'} Breadcrumbs`}
      <span>
        <ButtonTags kind="light" className="mx-2">
          B
        </ButtonTags>
      </span>
    </div>
  );
};

const Header = ({
  tagsList,
  selectedTag,
  currentIndex,
  onCloseCallback,
  totalCardsCount,
  onTagChange,
  className,
  status,
  isDone,
  nextDueDate,
  showBreadcrumbs,
  setShowBreadcrumbs,
  isCramming,
  dailyLimitDelta,
}) => {
  return (
    <HeaderWrapper className={className} tabIndex={0}>
      <div className="flex items-center">
        <BoxIcon icon="box" size={14} />
        <div tabIndex={-1}>
          <TagSelector tagsList={tagsList} selectedTag={selectedTag} onTagChange={onTagChange} />
        </div>
      </div>
      <div className="flex items-center justify-end">
        {!isDone && (
          <div onClick={() => setShowBreadcrumbs(!showBreadcrumbs)} className="px-1 cursor-pointer">
            {/* @ts-ignore */}
            <Tooltip
              content={<BreadcrumbTooltipContent showBreadcrumbs={showBreadcrumbs} />}
              placement="left"
            >
              <Blueprint.Icon
                icon={showBreadcrumbs ? 'eye-open' : 'eye-off'}
                className={showBreadcrumbs ? 'opacity-100' : 'opacity-60'}
              />
            </Tooltip>
          </div>
        )}
        <StatusBadge status={status} nextDueDate={nextDueDate} isCramming={isCramming} />
        <span className="text-sm mx-2 font-medium">
          <span>
            {totalCardsCount === 0
              ? 0
              : isDone
              ? currentIndex + dailyLimitDelta
              : currentIndex + 1 + dailyLimitDelta}
          </span>
          <span className="opacity-50 mx-1">/</span>
          <span className="opacity-50">{totalCardsCount + dailyLimitDelta}</span>
        </span>
        <button
          aria-label="Close"
          className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"
          onClick={onCloseCallback}
        ></button>
      </div>
    </HeaderWrapper>
  );
};

export default PracticeOverlay;
