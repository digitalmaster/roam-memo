import styled from "@emotion/styled";

const Wrapper = styled.span`
  display: flex;
`;

const SidePandelWidget = ({ onClickCallback }) => {
  return (
    <Wrapper className="w-full justify-between px-2" onClick={onClickCallback}>
      <div>
        <div className="flex">
          <span className="bp3-icon bp3-icon-box icon bp3-icon-small flex items-center"></span>
          <div>Review</div>
        </div>
      </div>
      <div>
        <span className="mr-2">0</span>
        <span>1</span>
      </div>
    </Wrapper>
  );
};

export default SidePandelWidget;
