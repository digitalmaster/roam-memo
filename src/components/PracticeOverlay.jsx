import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as BlueprintSelect from '@blueprintjs/select';
import styled from '@emotion/styled';
import useBlockInfo from '~/hooks/useBlockInfo.jsx';
import * as domUtils from '~/utils/dom';
import * as asyncUtils from '~/utils/async';
import * as dateUtils from '~/utils/date';
import mediaQueries from '~/utils/mediaQueries';

import { getPracticeResultData } from '~/practice';
import Lottie from 'react-lottie';
import doneAnimationData from '~/lotties/done.json';
import Tooltip from '~/components/Tooltip.jsx';
import { Icon } from '@blueprintjs/core';

const PracticeOverlay = ({
  isOpen,
  tagsList,
  selectedTag,
  onCloseCallback,
  practiceCardUids,
  practiceCardsData,
  handleGradeClick,
  handleMemoTagChange,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showBreadcrumbs, setShowBreadcrumbs] = React.useState(false);
  const totalCardsCount = practiceCardUids.length;
  const hasCards = totalCardsCount > 0;
  const isDone = currentIndex > practiceCardUids.length - 1;

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

  const [showBlockChildren, setShowBlockChildren] = React.useState(false);
  const { data: blockInfo } = useBlockInfo({ refUid: currentCardRefUid });
  const hasBlockChildren = blockInfo.children && blockInfo.children.length;

  const onTagChange = async (tag) => {
    setShowBlockChildren(false);
    setCurrentIndex(0);
    handleMemoTagChange(tag);

    // To prevent 'space' key event from triggering dropdown
    await asyncUtils.sleep(200);
    document?.activeElement.blur();
  };

  const onGradeClick = React.useCallback(
    (props) => {
      if (isDone) return;

      handleGradeClick(props);
      setShowBlockChildren(false);
      setCurrentIndex(currentIndex + 1);
    },
    [currentIndex, handleGradeClick, isDone]
  );

  const onSkipClick = React.useCallback(() => {
    if (isDone) return;

    setShowBlockChildren(false);
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, isDone]);

  const lottieAnimationOption = {
    loop: false,
    autoplay: true,
    animationData: doneAnimationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
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
      />

      <DialogBody className="bp3-dialog-body overflow-y-scroll m-0 pt-6 pb-8 px-4">
        {currentCardRefUid ? (
          <CardBlock
            refUid={currentCardRefUid}
            showBlockChildren={showBlockChildren}
            breadcrumbs={blockInfo.breadcrumbs}
            showBreadcrumbs={showBreadcrumbs}
          />
        ) : (
          <div className="flex items-center flex-col">
            <Lottie options={lottieAnimationOption} width="auto" />
            <div>No cards left to review!</div>
          </div>
        )}
      </DialogBody>
      <Footer
        refUid={currentCardRefUid}
        onGradeClick={onGradeClick}
        onSkipClick={onSkipClick}
        hasBlockChildren={hasBlockChildren}
        setShowBlockChildren={setShowBlockChildren}
        showBlockChildren={showBlockChildren}
        isDone={isDone}
        hasCards={hasCards}
        onCloseCallback={onCloseCallback}
        currentCardData={currentCardData}
      />
    </Dialog>
  );
};

const BreadCrumbWrapper = styled.div`
  opacity: 0.7;
  margin-left: 8px !important;
  margin-top: -4px !important;

  &.rm-zoom-item {
    cursor: auto !important;
  }
`;

const Breadcrumbs = ({ breadcrumbs }) => {
  const items = breadcrumbs.map((breadcrumb, index) => ({
    current: index === breadcrumbs.length - 1,
    text: breadcrumb.title || breadcrumb.string, // root pages have title but no string
  }));
  return (
    <BreadCrumbWrapper className="rm-zoom zoom-path-view">
      {items.map((item, i) => (
        <div key={i} className="rm-zoom-item">
          <span className="rm-zoom-item-content">{item.text}</span>{' '}
          {i !== items.length - 1 && <Icon icon="chevron-right" />}
        </div>
      ))}
    </BreadCrumbWrapper>
  );
};

const CardBlock = ({ refUid, showBlockChildren, breadcrumbs, showBreadcrumbs }) => {
  const ref = React.useRef();

  React.useEffect(() => {
    const asyncFn = async () => {
      await window.roamAlphaAPI.ui.components.unmountNode({ el: ref.current });
      await window.roamAlphaAPI.ui.components.renderBlock({ uid: refUid, el: ref.current });

      // Ensure block is not collapsed (so we can reveal children programatically)
      const roamBlockElm = ref.current.querySelector('.rm-block');
      const isCollapsed = roamBlockElm.classList.contains('rm-block--closed');
      if (isCollapsed) {
        // Currently no Roam API to toggle block collapse, so had to find this hacky
        // way to do it by simulating click
        const expandControlBtn = ref.current.querySelector('.block-expand .rm-caret');
        await asyncUtils.sleep(100);
        domUtils.simulateMouseClick(expandControlBtn);
        await asyncUtils.sleep(100);
        domUtils.simulateMouseClick(expandControlBtn);
      }
    };
    asyncFn();
  }, [ref, refUid]);

  return (
    <div>
      {breadcrumbs && showBreadcrumbs && <Breadcrumbs breadcrumbs={breadcrumbs} />}
      <ContentWrapper ref={ref} showBlockChildren={showBlockChildren}></ContentWrapper>
    </div>
  );
};

const ContentWrapper = styled.div`
  // To align bullet on the left + ref count on the right correctly
  position: relative;
  left: -14px;
  width: calc(100% + 19px);

  & .rm-block-children {
    display: ${(props) => (props.showBlockChildren ? 'flex' : 'none')};
  }

  & .rm-block-separator {
    min-width: unset; // Keeping roam block from expanding 100
  }
`;

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

const TagSelectorItemWrapper = styled.div`
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

const StatusBadge = ({ status, nextDueDate }) => {
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
        <div onClick={() => setShowBreadcrumbs(!showBreadcrumbs)} className="px-1 cursor-pointer">
          <Tooltip content={`${showBreadcrumbs ? 'Hide' : 'Show'} Breadcrumbs`} placement="left">
            <Icon
              icon={showBreadcrumbs ? 'eye-open' : 'eye-off'}
              className={showBreadcrumbs ? 'opacity-100' : 'opacity-60'}
            />
          </Tooltip>
        </div>
        <StatusBadge status={status} nextDueDate={nextDueDate} />
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

const ButtonTags = styled.span`
  background-color: rgba(138, 155, 168, 0.1);
  color: #abbbc9;
  text-transform: uppercase;
  font-size: 9px;
  padding: 1px 2px;
  border-radius: 2px;
`;

const ControlButtonWrapper = styled(Blueprint.Button)`
  background: ${(props) => (props.active ? 'inherit' : 'white !important')};
`;

const ControlButton = ({ tooltipText, ...props }) => {
  return (
    <Tooltip content={tooltipText} placement="top">
      <ControlButtonWrapper {...props} />
    </Tooltip>
  );
};

const Footer = ({
  hasBlockChildren,
  setShowBlockChildren,
  showBlockChildren,
  refUid,
  onGradeClick,
  onSkipClick,
  isDone,
  hasCards,
  onCloseCallback,
  currentCardData,
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
    return () => setShowBlockChildren(true);
  }, [setShowBlockChildren]);
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
          if (hasBlockChildren && !showBlockChildren) {
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
    [skipFn, hasBlockChildren, showBlockChildren, showAnswerFn, gradeFn]
  );
  const { handleKeyDown, handleKeyUp } = Blueprint.useHotkeys(hotkeys);

  const [intervalEstimates, setIntervalEstimates] = React.useState({});
  React.useEffect(() => {
    if (!currentCardData) return;

    const grades = [0, 1, 2, 3, 4, 5];
    const { interval, repetitions, eFactor } = currentCardData;
    const estimates = {};

    for (const grade of grades) {
      const practiceResultData = getPracticeResultData({ grade, interval, repetitions, eFactor });
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
          <ControlButton
            className="text-base font-medium py-1"
            intent="none"
            onClick={onCloseCallback}
            outlined
          >
            Close
          </ControlButton>
        ) : hasBlockChildren && !showBlockChildren ? (
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
