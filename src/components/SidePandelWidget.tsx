import styled from '@emotion/styled';
import * as Blueprint from '@blueprintjs/core';
import Tooltip from '~/components/Tooltip';

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

const SidePandelWidget = ({ onClickCallback, displayCardCounts }) => {
  return (
    <Wrapper className="w-full justify-between" onClick={onClickCallback}>
      <div>
        <div className="flex">
          <span className="bp3-icon bp3-icon-box icon bp3-icon-small flex items-center"></span>
          <div>Review</div>
        </div>
      </div>
      <div className="ml-2">
        {displayCardCounts.due > 0 && (
          // @ts-ignore
          <Tooltip content="Due" placement="top">
            <Tag active minimal intent="primary" className="text-center">
              {displayCardCounts.due}
            </Tag>
          </Tooltip>
        )}
        {displayCardCounts.new > 0 && (
          // @ts-ignore
          <Tooltip content="New" placement="top">
            <Tag active minimal intent="success" className="text-center ml-2">
              {displayCardCounts.new}
            </Tag>
          </Tooltip>
        )}
      </div>
    </Wrapper>
  );
};

export default SidePandelWidget;
