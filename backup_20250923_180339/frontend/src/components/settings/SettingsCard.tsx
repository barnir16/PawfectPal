import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
} from "@mui/material";

interface SettingsCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export const SettingsCard = ({
  title,
  subtitle,
  children,
  action,
}: SettingsCardProps) => {
  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        }
        subheader={subtitle}
        action={action}
        titleTypographyProps={{ variant: "h6" }}
      />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SettingsCard;
