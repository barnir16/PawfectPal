import { useState } from "react";
import { Box, Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  MedicalServices as MedicalIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  onAddMedicalRecord?: () => void;
  onScheduleAppointment?: () => void;
  showMoreOptions?: boolean;
}

export const ActionButtons = ({
  onEdit,
  onDelete,
  onAddMedicalRecord,
  onScheduleAppointment,
  showMoreOptions = true,
}: ActionButtonsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
      <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
        Edit
      </Button>

      {onAddMedicalRecord && (
        <Button
          variant="outlined"
          startIcon={<MedicalIcon />}
          onClick={onAddMedicalRecord}
        >
          Add Record
        </Button>
      )}

      {onScheduleAppointment && (
        <Button
          variant="outlined"
          startIcon={<CalendarIcon />}
          onClick={onScheduleAppointment}
        >
          Schedule
        </Button>
      )}

      {showMoreOptions && (
        <>
          <Button
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleMenu}
          >
            <MoreVertIcon />
          </Button>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={onDelete}>
              <ListItemIcon>
                <DeleteIcon color="error" />
              </ListItemIcon>
              Delete Pet
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};

export default ActionButtons;
