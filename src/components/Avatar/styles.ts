import styled from 'styled-components/native';
import {StyledProps} from '@interfaces';

export const AvatarWrapper = styled.View`
  margin-left: 20px;
  align-items: center;
`;

export const Avatar = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 50px;
  border-width: 2px;
  border-color: ${({theme}: StyledProps) => theme.colors.bg.quaternary};
`;
