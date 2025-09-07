import React from 'react';
import { Typography, Box } from '@mui/material';
import { Organization } from '../types/organization';

interface UserTooltipProps {
  username: string;
  roleJpn: string;
  orgInfo: Organization;
}

const UserTooltip: React.FC<UserTooltipProps> = ({ username, roleJpn, orgInfo }) => {
  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="body2">ユーザー名: {username || '-'}</Typography>
      <Typography variant="body2">組織名: {orgInfo.organization_name || '-'}</Typography>
      <Typography variant="body2">組織ID: {orgInfo.organization_id || '-'}</Typography>
      <Typography variant="body2">ロール: {roleJpn || '-'}</Typography>
    </Box>
  );
};

export default UserTooltip;
