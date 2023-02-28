import { Tooltip as BluePrintTooltip } from '@blueprintjs/core';
import styled from '@emotion/styled';
interface Props {
  className?: string;
  children: JSX.Element;
  content: string | JSX.Element;
  placement: string;
}

const Wrapper = ({ className, ...restProps }: Props) => {
  // @ts-ignore
  return <BluePrintTooltip popoverClassName={className} {...restProps} />;
};

const Tooltip = styled(Wrapper)`
  &.bp3-tooltip .bp3-popover-content {
    font-size: 12px;
    padding: 2px 5px;
  }
`;

export default Tooltip;
