import { keyframes } from "@emotion/react"; // or use styled-components or pure CSS
import { Typography } from "@mui/material";

const wave = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(25deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(25deg); }
  100% { transform: rotate(0deg); }
`;

export function HelloWave() {
  return (
    <Typography
      component="span"
      sx={{
        display: "inline-block",
        fontSize: 28,
        lineHeight: "32px",
        mt: "-6px",
        animation: `${wave} 1.2s ease-in-out 4`,
        transformOrigin: "70% 70%",
        userSelect: "none",
      }}
    >
      👋
    </Typography>
  );
}
