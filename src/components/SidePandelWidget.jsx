import styled from '@emotion/styled';
import * as Blueprint from '@blueprintjs/core';

const Wrapper = styled.span`
  display: flex;
`;

const SidePandelWidget = ({ onClickCallback, displayCardCount }) => {
  return (
    <Wrapper className="w-full justify-between" onClick={onClickCallback}>
      <div>
        <div className="flex">
          <span className="bp3-icon bp3-icon-box icon bp3-icon-small flex items-center"></span>
          <div>Review</div>
        </div>
      </div>
      <div className="ml-2">
        <Blueprint.Tag active minimal intent="primary">
          {displayCardCount}
        </Blueprint.Tag>
      </div>
    </Wrapper>
  );
};

export default SidePandelWidget;
