import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as BlueprintSelect from '@blueprintjs/select';
import styled from '@emotion/styled';
import useBlockInfo from '~/hooks/useBlockInfo';
import * as asyncUtils from '~/utils/async';
import * as dateUtils from '~/utils/date';
import { generatePracticeData } from '~/practice';
import Lottie from 'react-lottie';
import doneAnimationData from '~/lotties/done.json';
import Tooltip from '~/components/Tooltip';
import mediaQueries from '~/utils/mediaQueries';

import CardBlock from '~/components/overlay/CardBlock';

const PracticeOverlay = ({
  isOpen,
  tagsList,
  selectedTag,
  onCloseCallback,
  practiceCardUids,
  practiceCardsData,
  handleGradeClick,
  handleMemoTagChange,
  isCramming,
  setIsCramming,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const totalCardsCount = practiceCardUids.length;
  const hasCards = totalCardsCount > 0;
  const isDone = currentIndex > practiceCardUids.length - 1;
  const isFirst = currentIndex === 0;

  const currentCardRefUid = practiceCardUids[currentIndex];
  const currentCardData = practiceCardsData[currentCardRefUid];

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

  React.useEffect(() => {
    if (isDone && isCramming) {
      setIsCramming(false);
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
            <div>No cards left to review!</div>
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
          <span>{totalCardsCount === 0 ? 0 : isDone ? currentIndex : currentIndex + 1}</span>
          <span className="opacity-50 mx-1">/</span>
          <span className="opacity-50">{totalCardsCount}</span>
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

const FooterWrapper = styled.div`
  background-color: #f6f9fd;
  min-height: 50px;
  border-top: 1px solid rgba(16, 22, 26, 0.1);

  & .bp3-button-text {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const ButtonTags = styled.span<{ kind?: 'light' }>`
  background-color: ${({ kind }) =>
    kind === 'light' ? 'rgba(138, 155, 168, 0.2)' : 'rgba(138, 155, 168, 0.1)'};
  color: #abbbc9;
  text-transform: uppercase;
  font-size: 9px;
  padding: 1px 2px;
  border-radius: 2px;
  position: relative;
  top: -0.5px;
`;

const ControlButtonWrapper = styled(Blueprint.Button)`
  background: ${(props) => (props.active ? 'inherit' : 'white !important')};
`;

const ControlButton = ({ tooltipText, ...props }) => {
  return (
    // @ts-ignore
    <Tooltip content={tooltipText} placement="top">
      <ControlButtonWrapper {...props} />
    </Tooltip>
  );
};

const Footer = ({
  hasBlockChildren,
  setShowAnswers,
  showAnswers,
  refUid,
  onGradeClick,
  onSkipClick,
  onPrevClick,
  isDone,
  hasCards,
  onCloseCallback,
  currentCardData,
  onStartCrammingClick,
}) => {
  // So we can flash the activated button when using keyboard shortcuts before transitioning
  const [activeButtonKey, setActiveButtonKey] = React.useState(null);
  const activateButtonFn = async (key, callbackFn) => {
    setActiveButtonKey(key);
    await asyncUtils.sleep(150);
    callbackFn();
    setActiveButtonKey(null);
  };

  const showAnswerFn = React.useMemo(() => {
    return () => setShowAnswers(true);
  }, [setShowAnswers]);
  const gradeFn = React.useMemo(
    () => (grade) => {
      let key;
      switch (grade) {
        case 0:
          key = 'forgot-button';
          break;
        case 2:
          key = 'hard-button';
          break;
        case 4:
          key = 'good-button';
          break;
        case 5:
          key = 'perfect-button';
          break;

        default:
          break;
      }
      activateButtonFn(key, () => onGradeClick({ grade, refUid: refUid }));
    },
    [onGradeClick, refUid]
  );
  const skipFn = React.useMemo(
    () => () => {
      let key = 'skip-button';
      activateButtonFn(key, () => onSkipClick());
    },
    [onSkipClick]
  );

  const hotkeys = React.useMemo(
    () => [
      {
        combo: 'space',
        global: true,
        label: 'Show Block Children',
        onKeyDown: () => {
          if (!showAnswers) {
            activateButtonFn('space-button', showAnswerFn);
          } else {
            gradeFn(5);
          }
        },
      },
      {
        combo: 'S',
        global: true,
        label: 'Skip',
        onKeyDown: skipFn,
      },
      {
        combo: 'right',
        global: true,
        label: 'Skip',
        onKeyDown: skipFn,
      },
      {
        combo: 'left',
        global: true,
        label: 'Previous',
        onKeyDown: onPrevClick,
      },
      {
        combo: 'F',
        global: true,
        label: 'Grade 0',
        onKeyDown: () => gradeFn(0),
      },
      {
        combo: 'H',
        global: true,
        label: 'Grade 2',
        onKeyDown: () => gradeFn(2),
      },
      {
        combo: 'G',
        global: true,
        label: 'Grade 4',
        onKeyDown: () => gradeFn(4),
      },
    ],
    [skipFn, hasBlockChildren, showAnswers, showAnswerFn, gradeFn]
  );
  const { handleKeyDown, handleKeyUp } = Blueprint.useHotkeys(hotkeys);

  const [intervalEstimates, setIntervalEstimates] = React.useState({});
  React.useEffect(() => {
    if (!currentCardData) return;

    const grades = [0, 1, 2, 3, 4, 5];
    const { interval, repetitions, eFactor } = currentCardData;
    const estimates = {};

    for (const grade of grades) {
      const practiceResultData = generatePracticeData({
        grade,
        interval,
        repetitions,
        eFactor,
        dateCreated: new Date(),
      });
      estimates[grade] = practiceResultData;
    }

    setIntervalEstimates(estimates);
  }, [currentCardData]);

  return (
    <FooterWrapper
      className="bp3-multistep-dialog-footer flex items-center justify-center rounded-b-md p-0"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <FooterActionsWrapper className="bp3-dialog-footer-actions flex-wrap gap-4 justify-evenly w-full mx-3  my-3">
        {isDone || !hasCards ? (
          <>
            <Blueprint.Button onClick={onStartCrammingClick}>Continue Cramming</Blueprint.Button>
            {/*@ts-ignore*/}
            <ControlButton
              className="text-base font-medium py-1"
              intent="none"
              onClick={onCloseCallback}
              outlined
            >
              Close
            </ControlButton>
          </>
        ) : !showAnswers ? (
          // @ts-ignore
          <ControlButton
            className="text-base font-medium py-1"
            intent="none"
            onClick={() => {
              activateButtonFn('space-button', showAnswerFn);
            }}
            active={activeButtonKey === 'space-button'}
            outlined
          >
            Show Answer{' '}
            <span className="ml-2">
              <ButtonTags>SPACE</ButtonTags>
            </span>
          </ControlButton>
        ) : (
          <>
            <ControlButton
              key="forget-button"
              className="text-base font-medium py-1"
              tooltipText={`Skip for now`}
              onClick={() => skipFn()}
              active={activeButtonKey === 'skip-button'}
              outlined
            >
              Skip{' '}
              <span className="ml-2">
                <ButtonTags>S</ButtonTags>
              </span>
            </ControlButton>
            <ControlButton
              key="forget-button"
              className="text-base font-medium py-1"
              intent="danger"
              tooltipText={`Review ${intervalEstimates[0]?.nextDueDateFromNow}`}
              onClick={() => gradeFn(0)}
              active={activeButtonKey === 'forgot-button'}
              outlined
            >
              Forgot{' '}
              <span className="ml-2">
                <ButtonTags>F</ButtonTags>
              </span>
            </ControlButton>
            <ControlButton
              className="text-base font-medium py-1"
              intent="warning"
              onClick={() => gradeFn(2)}
              tooltipText={`Review ${intervalEstimates[2]?.nextDueDateFromNow}`}
              active={activeButtonKey === 'hard-button'}
              outlined
            >
              Hard{' '}
              <span className="ml-2">
                <ButtonTags>H</ButtonTags>
              </span>
            </ControlButton>
            <ControlButton
              className="text-base font-medium py-1"
              intent="primary"
              onClick={() => gradeFn(4)}
              tooltipText={`Review ${intervalEstimates[4]?.nextDueDateFromNow}`}
              active={activeButtonKey === 'good-button'}
              outlined
            >
              Good{' '}
              <span className="ml-2">
                <ButtonTags>G</ButtonTags>
              </span>
            </ControlButton>
            <ControlButton
              className="text-base font-medium py-1"
              intent="success"
              onClick={() => gradeFn(5)}
              tooltipText={`Review ${intervalEstimates[5]?.nextDueDateFromNow}`}
              active={activeButtonKey === 'perfect-button'}
              outlined
            >
              Perfect{' '}
              <span className="ml-2">
                <ButtonTags>SPACE</ButtonTags>
              </span>
            </ControlButton>
          </>
        )}
      </FooterActionsWrapper>
    </FooterWrapper>
  );
};

const FooterActionsWrapper = styled.div`
  &.bp3-dialog-footer-actions .bp3-button {
    margin-left: 0;
  }
`;
export default PracticeOverlay;
