import { Box, ToggleButton, ToggleButtonGroup, Button, Tooltip } from "@mui/material";
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface TasksToolbarProps {
  view: "list" | "grid";
  onViewChange: (
    event: React.MouseEvent<HTMLElement>,
    newView: "list" | "grid" | null
  ) => void;
  onAddTask: () => void;
  onExportTasks?: () => void;
  onSyncWithGoogleCalendar?: () => void;
  children?: React.ReactNode;
}

export const TasksToolbar = ({
  view,
  onViewChange,
  onAddTask,
  onExportTasks,
  onSyncWithGoogleCalendar,
  children,
}: TasksToolbarProps) => {
  const { t } = useLocalization();
  
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddTask}
        >
          {t('tasks.addTask')}
        </Button>
        
        {onExportTasks && (
          <Tooltip title={t('tasks.exportToICal')}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExportTasks}
            >
              {t('tasks.export')}
            </Button>
          </Tooltip>
        )}
        
        {onSyncWithGoogleCalendar && (
          <Tooltip title={t('tasks.syncWithGoogleCalendar')}>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={onSyncWithGoogleCalendar}
            >
              {t('tasks.syncCalendar')}
            </Button>
          </Tooltip>
        )}
        
        {children}
      </Box>

      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={onViewChange}
        aria-label="task view"
        size="small"
      >
        <ToggleButton value="list" aria-label={t('tasks.listView')}>
          <ViewListIcon />
        </ToggleButton>
        <ToggleButton value="grid" aria-label={t('tasks.gridView')}>
          <ViewModuleIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
