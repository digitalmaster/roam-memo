import * as Blueprint from '@blueprintjs/core';
import styled from '@emotion/styled';
import Tooltip from '~/components/Tooltip';
import { CompletionStatus, Today } from '~/models/practice';

const Wrapper = styled.span`
  display: flex;
`;

const Tag = styled(Blueprint.Tag)`
  &.bp3-tag {
    padding: 1px 3px;
    min-height: auto;
    min-width: auto;
  }
`;

interface SidePanelWidgetProps {
  onClickCallback: () => void;
  today: Today;
}
const SidePandelWidget = ({ onClickCallback, today }: SidePanelWidgetProps) => {
  const allDoneToday = today.combinedToday.status === CompletionStatus.Finished;
  const combinedCounts = today.combinedToday;

  const iconClass = allDoneToday ? 'bp3-icon-confirm' : 'bp3-icon-box';

  return (
    <Wrapper
      data-testid="side-panel-wrapper"
      className="w-full justify-between"
      onClick={onClickCallback}
    >
      <div>
        <div className="flex">
          <span className={`bp3-icon ${iconClass} icon bp3-icon-small flex items-center`}></span>
          <div>Review</div>
        </div>
      </div>
      <div className="ml-2">
        {combinedCounts.due > 0 && (
          // @ts-ignore
          <Tooltip content="Due" placement="top">
            <Tag active minimal intent="primary" className="text-center" data-testid="due-tag">
              {combinedCounts.due}
            </Tag>
          </Tooltip>
        )}
        {combinedCounts.new > 0 && (
          // @ts-ignore
          <Tooltip content="New" placement="top">
            <Tag active minimal intent="success" className="text-center ml-2" data-testid="new-tag">
              {combinedCounts.new}
            </Tag>
          </Tooltip>
        )}
      </div>
    </Wrapper>
  );
};

export default SidePandelWidget;
