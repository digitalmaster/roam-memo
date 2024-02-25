import styled from '@emotion/styled';

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

export default ButtonTags;
