import { CircularProgress, Box, Typography } from '@mui/material';

type Props = {
  message?: string;
};

export const LoadingOverlay = ({ message }: Props) => {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgcolor="rgba(255, 255, 255, 0.7)" // 半透明背景
      zIndex={9999} // 他の要素より上に表示
    >
      <CircularProgress size={48} />
      {message && (
        <Typography variant="body1" mt={2}>
          {message}
        </Typography>
      )}
    </Box>
  );
};
