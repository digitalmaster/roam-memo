import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import styled from '@emotion/styled';
import * as asyncUtils from '~/utils/async';
import { generatePracticeData } from '~/practice';
import Tooltip from '~/components/Tooltip';
import ButtonTags from '~/components/ButtonTags';

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
          <GradingControls
            activeButtonKey={activeButtonKey}
            skipFn={skipFn}
            gradeFn={gradeFn}
            intervalEstimates={intervalEstimates}
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

const GradingControls = ({ activeButtonKey, skipFn, gradeFn, intervalEstimates }) => (
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
);

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

export default Footer;
