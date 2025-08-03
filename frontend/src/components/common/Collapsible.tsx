import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type CollapsibleProps = {
  title: string;
  children: React.ReactNode;
};

export const Collapsible = ({ title, children }: CollapsibleProps) => {
  const theme = useTheme();

  return (
    <Accordion
      sx={{
        boxShadow: "none",
        "&:before": { display: "none" },
        bgcolor: "transparent",
      }}
      disableGutters
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />
        }
        sx={{
          paddingLeft: 0,
          paddingRight: 0,
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "rotate(90deg)",
          },
          "& .MuiAccordionSummary-content": {
            marginLeft: 0,
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight="600">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ paddingLeft: 3, paddingTop: 0 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default Collapsible;
