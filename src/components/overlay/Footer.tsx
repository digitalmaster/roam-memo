import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import styled from '@emotion/styled';
import * as asyncUtils from '~/utils/async';
import { generatePracticeData } from '~/practice';
import Tooltip from '~/components/Tooltip';
import ButtonTags from '~/components/ButtonTags';
import { IntervalMultiplierType, ReviewModes } from '~/models/session';
import { MainContext } from '~/components/overlay/PracticeOverlay';

interface IntervalEstimate {
  reviewMode: string;
  grade: number;
  repetitions: number;
  interval: number;
  eFactor: number;
  dateCreated: string;
  nextDueDate: string;
  nextDueDateFromNow: string;
}

type IntervalEstimates =
  | undefined
  | {
      [key: number]: IntervalEstimate;
    };
const Footer = ({
  setShowAnswers,
  showAnswers,
  refUid,
  onPracticeClick,
  onSkipClick,
  onPrevClick,
  isDone,
  hasCards,
  onCloseCallback,
  currentCardData,
  onStartCrammingClick,
}) => {
  const { reviewMode, intervalMultiplier, intervalMultiplierType } = React.useContext(MainContext);

  const [isIntervalEditorOpen, setIsIntervalEditorOpen] = React.useState(false);

  const toggleIntervalEditorOpen = () => setIsIntervalEditorOpen((prev) => !prev);
  // So we can flash the activated button when using keyboard shortcuts before transitioning
  const [activeButtonKey, setActiveButtonKey] = React.useState(null);
  const activateButtonFn = async (key, callbackFn) => {
    setActiveButtonKey(key);
    await asyncUtils.sleep(150);
    callbackFn();
    setActiveButtonKey(null);
  };

  const showAnswerFn = React.useMemo(() => {
    return () => {
      setShowAnswers(true);
    };
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
      activateButtonFn(key, () => onPracticeClick({ grade, refUid: refUid }));
    },
    [onPracticeClick, refUid]
  );

  const intervalPractice = React.useMemo(
    () => () => {
      activateButtonFn('next-button', () => onPracticeClick({ refUid: refUid }));
    },
    [onPracticeClick, refUid]
  );
  const skipFn = React.useMemo(
    () => () => {
      const key = 'skip-button';
      activateButtonFn(key, () => onSkipClick());
    },
    [onSkipClick]
  );

  const hotkeys = React.useMemo(
    () => [
      {
        combo: 'space',
        global: true,
        label: 'Primary Action Trigger',
        onKeyDown: () => {
          if (!showAnswers) {
            activateButtonFn('space-button', showAnswerFn);
          } else {
            if (reviewMode === ReviewModes.FixedInterval) {
              intervalPractice();
            } else {
              gradeFn(5);
            }
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
        disabled: reviewMode === ReviewModes.FixedInterval,
      },
      {
        combo: 'H',
        global: true,
        label: 'Grade 2',
        onKeyDown: () => gradeFn(2),
        disabled: reviewMode === ReviewModes.FixedInterval,
      },
      {
        combo: 'G',
        global: true,
        label: 'Grade 4',
        onKeyDown: () => gradeFn(4),
        disabled: reviewMode !== ReviewModes.DefaultSpacedInterval,
      },
      {
        combo: 'E',
        global: true,
        label: 'Edit Interval',
        onKeyDown: toggleIntervalEditorOpen,
        disabled: reviewMode !== ReviewModes.FixedInterval,
      },
    ],
    [skipFn, onPrevClick, reviewMode, showAnswers, showAnswerFn, intervalPractice, gradeFn]
  );
  const { handleKeyDown, handleKeyUp } = Blueprint.useHotkeys(hotkeys);

  const intervalEstimates: IntervalEstimates = React.useMemo(() => {
    if (!currentCardData) return;

    if (!reviewMode) {
      console.error('Review mode not set');
      return;
    }
    const grades = [0, 1, 2, 3, 4, 5];
    const { interval, repetitions, eFactor } = currentCardData;
    const estimates = {};

    const iterateCount = reviewMode === ReviewModes.FixedInterval ? 1 : grades.length;
    for (let i = 0; i < iterateCount; i++) {
      const grade = grades[i];
      const practiceResultData = generatePracticeData({
        grade,
        interval,
        repetitions,
        eFactor,
        dateCreated: new Date(),
        reviewMode,
        intervalMultiplier,
        intervalMultiplierType,
      });
      estimates[grade] = practiceResultData;
    }
    return estimates;
  }, [currentCardData, intervalMultiplier, intervalMultiplierType, reviewMode]);

  return (
    <FooterWrapper
      className="bp3-multistep-dialog-footer flex items-center justify-center rounded-b-md p-0"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <FooterActionsWrapper
        className="bp3-dialog-footer-actions flex-wrap gap-4 justify-center sm:justify-evenly w-full mx-5  my-3"
        data-testid="footer-actions-wrapper"
      >
        {isDone || !hasCards ? (
          <FinishedControls
            onStartCrammingClick={onStartCrammingClick}
            onCloseCallback={onCloseCallback}
          />
        ) : !showAnswers ? (
          <AnswerHiddenControls
            activateButtonFn={activateButtonFn}
            showAnswerFn={showAnswerFn}
            activeButtonKey={activeButtonKey}
          />
        ) : (
          <GradingControlsWrapper
            activateButtonFn={activateButtonFn}
            activeButtonKey={activeButtonKey}
            skipFn={skipFn}
            gradeFn={gradeFn}
            intervalEstimates={intervalEstimates}
            intervalPractice={intervalPractice}
            isIntervalEditorOpen={isIntervalEditorOpen}
            toggleIntervalEditorOpen={toggleIntervalEditorOpen}
          />
        )}
      </FooterActionsWrapper>
    </FooterWrapper>
  );
};

const AnswerHiddenControls = ({ activateButtonFn, showAnswerFn, activeButtonKey }) => (
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
);

const FinishedControls = ({ onStartCrammingClick, onCloseCallback }) => {
  return (
    <>
      <Tooltip content="Review all cards without waiting for scheduling" placement="top">
        <Blueprint.Button
          className="text-base font-medium py-1"
          intent="none"
          onClick={onStartCrammingClick}
          outlined
        >
          Continue Cramming
        </Blueprint.Button>
      </Tooltip>
      <Blueprint.Button
        className="text-base font-medium py-1"
        intent="primary"
        onClick={onCloseCallback}
        outlined
      >
        Close
      </Blueprint.Button>
    </>
  );
};

const GradingControlsWrapper = ({
  activateButtonFn,
  activeButtonKey,
  skipFn,
  gradeFn,
  intervalEstimates,
  intervalPractice,
  isIntervalEditorOpen,
  toggleIntervalEditorOpen,
}) => {
  const { reviewMode, setReviewModeOverride } = React.useContext(MainContext);

  const toggleReviewMode = () => {
    if (setReviewModeOverride === undefined) return;

    setReviewModeOverride((prev: ReviewModes | undefined) => {
      const isOverrideSet = prev !== undefined;

      if (isOverrideSet) {
        // If set we clear it
        return undefined;
      }

      // Toggle Review Mode
      return reviewMode === ReviewModes.DefaultSpacedInterval
        ? ReviewModes.FixedInterval
        : ReviewModes.DefaultSpacedInterval;
    });
  };

  const isFixedIntervalMode = reviewMode === ReviewModes.FixedInterval;
  return (
    <>
      <ControlButton
        key="skip-button"
        className="text-base font-medium py-1"
        wrapperClassName={`${isFixedIntervalMode ? 'sm:mr-auto' : ''}`}
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
      {isFixedIntervalMode ? (
        <FixedIntervalModeControls
          activeButtonKey={activeButtonKey}
          intervalPractice={intervalPractice}
          isIntervalEditorOpen={isIntervalEditorOpen}
          toggleIntervalEditorOpen={toggleIntervalEditorOpen}
          intervalEstimates={intervalEstimates}
        />
      ) : (
        <SpacedIntervalModeControls
          activeButtonKey={activeButtonKey}
          gradeFn={gradeFn}
          intervalEstimates={intervalEstimates}
        />
      )}
      <SetIntervalToggleWrapper className={`${isFixedIntervalMode ? 'sm:ml-auto' : ''}`}>
        {/* @ts-ignore */}
        <ControlButton
          icon={isFixedIntervalMode ? 'calendar' : 'history'}
          className="text-base font-medium py-1"
          intent="none"
          tooltipText={isFixedIntervalMode ? 'Spaced Interval Mode' : 'Fixed Interval Mode'}
          onClick={() => {
            activateButtonFn('space-button', toggleReviewMode);
          }}
          data-testid="review-mode-button"
          active={activeButtonKey === 'space-button'}
          outlined
        ></ControlButton>
      </SetIntervalToggleWrapper>
    </>
  );
};

const FixedIntervalEditor = () => {
  const {
    intervalMultiplier,
    intervalMultiplierType,
    setIntervalMultiplier,
    setIntervalMultiplierType,
  } = React.useContext(MainContext);
  const handleInputValueChange = (numericValue) => {
    if (isNaN(numericValue)) return;
    setIntervalMultiplier(numericValue);
  };

  const intervalMultiplierTypes = [
    { value: IntervalMultiplierType.Days, label: 'Days' },
    { value: IntervalMultiplierType.Weeks, label: 'Weeks' },
    { value: IntervalMultiplierType.Months, label: 'Months' },
    { value: IntervalMultiplierType.Years, label: 'Years' },
  ];

  return (
    <div className="flex p-2 items-center w-80 justify-evenly">
      <div className="">Every</div>
      <div className="w-24">
        <Blueprint.NumericInput
          min={1}
          max={365}
          stepSize={1}
          majorStepSize={30}
          minorStepSize={1}
          value={intervalMultiplier}
          onValueChange={handleInputValueChange}
          fill
        />
      </div>
      <div className="bp3-html-select">
        <select
          value={intervalMultiplierType}
          onChange={(e) =>
            setIntervalMultiplierType(e.currentTarget.value as IntervalMultiplierType)
          }
        >
          {intervalMultiplierTypes.map((option) => (
            <option
              key={option.value}
              value={option.value}
              selected={option.value === intervalMultiplierType}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="bp3-icon bp3-icon-double-caret-vertical"></span>
      </div>
    </div>
  );
};

const IntervalString = ({ intervalMultiplier, intervalMultiplierType }) => {
  let singularString = '';
  if (intervalMultiplier === 1) {
    switch (intervalMultiplierType) {
      case IntervalMultiplierType.Weeks:
        singularString += 'Weekly';
        break;
      case IntervalMultiplierType.Months:
        singularString += 'Monthly';
        break;
      case IntervalMultiplierType.Years:
        singularString += 'Yearly';
        break;
      default:
        singularString += 'Daily';
        break;
    }
  }

  return (
    <>
      Review{' '}
      <span className="font-medium mr-3">
        {singularString ? (
          singularString
        ) : (
          <>
            Every {intervalMultiplier} {intervalMultiplierType}
          </>
        )}
      </span>
    </>
  );
};

const FixedIntervalModeControls = ({
  activeButtonKey,
  intervalPractice,
  isIntervalEditorOpen,
  toggleIntervalEditorOpen,
  intervalEstimates,
}: {
  activeButtonKey: string;
  intervalPractice: () => void;
  isIntervalEditorOpen: boolean;
  toggleIntervalEditorOpen: () => void;
  intervalEstimates: IntervalEstimates;
}): JSX.Element | undefined => {
  const { intervalMultiplier, intervalMultiplierType } = React.useContext(MainContext);
  const onInteractionhandler = (nextState) => {
    if (!nextState && isIntervalEditorOpen) toggleIntervalEditorOpen();
  };
  if (!intervalEstimates) {
    console.error('Interval estimates not set');
    return;
  }

  return (
    <>
      <Blueprint.Popover isOpen={isIntervalEditorOpen} onInteraction={onInteractionhandler}>
        <ControlButton
          icon="time"
          className="text-base font-normal py-1"
          intent="default"
          onClick={toggleIntervalEditorOpen}
          tooltipText={`Change Interval`}
          active={activeButtonKey === 'change-interval-button'}
          outlined
        >
          <span className="ml-2">
            <IntervalString
              intervalMultiplier={intervalMultiplier}
              intervalMultiplierType={intervalMultiplierType}
            />
            <ButtonTags>E</ButtonTags>
          </span>
        </ControlButton>
        <FixedIntervalEditor />
      </Blueprint.Popover>
      <ControlButton
        icon="tick"
        className="text-base font-medium py-1"
        intent="success"
        onClick={() => intervalPractice()}
        tooltipText={`Review ${intervalEstimates[0].nextDueDateFromNow}`}
        active={activeButtonKey === 'next-button'}
        outlined
      >
        Next{' '}
        <span className="ml-2">
          <ButtonTags>SPACE</ButtonTags>
        </span>
      </ControlButton>
    </>
  );
};

const SpacedIntervalModeControls = ({
  activeButtonKey,
  gradeFn,
  intervalEstimates,
}: {
  activeButtonKey: string;
  gradeFn: (grade: number) => void;
  intervalEstimates: IntervalEstimates;
}) => {
  if (!intervalEstimates) {
    console.error('Interval estimates not set');
    return;
  }

  return (
    <>
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

const FooterActionsWrapper = styled.div`
  &.bp3-dialog-footer-actions .bp3-button {
    margin-left: 0;
  }
`;

const SetIntervalToggleWrapper = styled.div``;

const ControlButtonWrapper = styled(Blueprint.Button)``;

const ControlButton = ({ tooltipText, wrapperClassName = '', ...props }) => {
  return (
    // @ts-ignore
    <Tooltip content={tooltipText} placement="top" wrapperClassName={wrapperClassName}>
      <ControlButtonWrapper {...props} />
    </Tooltip>
  );
};

export default Footer;
