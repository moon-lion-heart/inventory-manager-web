import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import List from '@mui/material/List';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => (
  // DrawerはAppBarのすぐ下から始まるようにToolbarでオフセット
  <Drawer anchor="left" open={isOpen} onClose={onClose}>
    <Toolbar />
    <Box sx={{ width: 250, p: 2 }}>
      <List>{/* TODO: メニュー項目追加 */}</List>
    </Box>
  </Drawer>
);

export default Sidebar;
