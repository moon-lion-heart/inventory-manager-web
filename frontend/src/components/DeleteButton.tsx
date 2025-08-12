import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

interface DeleteButtonProps {
  selectedIds: string[];
  onDelete: () => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ selectedIds, onDelete }) => (
  <Box
    sx={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1300,
    }}
  >
    <Button
      variant="contained"
      color={selectedIds.length > 0 ? 'error' : 'inherit'}
      onClick={onDelete}
    >
      選択行を削除する
    </Button>
  </Box>
);

export default DeleteButton;
