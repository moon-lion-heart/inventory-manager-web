import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import { ActionMode } from '../pages/MainPage';
import InventoryFilter, { InventoryFilterProps } from '../features/Inventory/InventoryFilter';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import UserTooltip from './UserTooltip';

const roleLabels: Record<string, string> = {
  admin: '管理者',
  editor: '編集者',
  viewer: '閲覧者',
};

interface HeaderBarProps {
  onLogout: () => void;
  onModeChange: (mode: ActionMode) => void;
  onToggleDeleteMode: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  filterProps: InventoryFilterProps;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  onLogout,
  onModeChange,
  onToggleDeleteMode,
  onToggleSidebar,
  isSidebarOpen,
  filterProps,
}) => {
  const navigate = useNavigate();
  const userInfo = useAuth();
  const { username = '', role = '' } = userInfo.userInfo || {};
  const userInitial = username.charAt(0).toUpperCase() || '?';
  const roleJpn = roleLabels[role] || '?';
  const canEdit = ['admin', 'editor'].includes(role);
  const organizationInfo = useOrganization();
  const orgInfo = organizationInfo.orgInfo || { organization_name: '', organization_id: '' };

  const handleSignOut = async () => {
    await onLogout();
    navigate('/auth');
  };

  return (
    // AppBarを使って画面上部に固定ヘッダーを作成
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* ハンバーガーアイコンとツールチップ */}
        <Tooltip title={isSidebarOpen ? 'メニューを閉じる' : 'メニューを開く'} placement="right">
          <IconButton
            color="inherit" // AppBarのテキスト色に合わせる
            aria-label={isSidebarOpen ? 'close drawer' : 'open drawer'}
            onClick={onToggleSidebar} // サイドバーの開閉関数を呼び出す
            edge="start" // 左端に配置
            sx={{ mr: 2 }} // 右にマージン
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h6" noWrap component="div" sx={{ flexShrink: 0, mr: 3 }}>
          在庫管理アプリ
        </Typography>

        <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <InventoryFilter {...filterProps} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
          {canEdit && (
            <>
              <Tooltip title="在庫追加">
                <IconButton
                  color="inherit"
                  aria-label="add item"
                  onClick={() => {
                    onModeChange('add');
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="在庫削除">
                <IconButton
                  color="inherit"
                  aria-label="delete item"
                  onClick={() => {
                    onModeChange('delete');
                    onToggleDeleteMode();
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Tooltip title="ログアウト">
            <IconButton color="inherit" aria-label="logout" onClick={handleSignOut}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={<UserTooltip username={username} roleJpn={roleJpn} orgInfo={orgInfo} />}
            placement="bottom"
          >
            <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.light' }}>
              {userInitial}
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;
