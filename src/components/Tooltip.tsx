import { Tooltip as BluePrintTooltip } from '@blueprintjs/core';
import styled from '@emotion/styled';

const Wrapper = ({ className, ...restProps }) => {
  return <BluePrintTooltip popoverClassName={className} {...restProps} />;
};

const Tooltip = styled(Wrapper)`
  &.bp3-tooltip .bp3-popover-content {
    font-size: 12px;
    padding: 2px 5px;
  }
`;

export default Tooltip;
