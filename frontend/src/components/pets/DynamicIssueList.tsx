import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Typography,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface DynamicIssueListProps {
  label: string;
  issues: string[];
  onIssuesChange: (issues: string[]) => void;
  placeholder?: string;
}

export const DynamicIssueList: React.FC<DynamicIssueListProps> = ({
  label,
  issues,
  onIssuesChange,
  placeholder = 'Enter issue...',
}) => {
  const [newIssue, setNewIssue] = useState('');

  const handleAddIssue = () => {
    if (newIssue.trim() && !issues.includes(newIssue.trim())) {
      onIssuesChange([...issues, newIssue.trim()]);
      setNewIssue('');
    }
  };

  const handleRemoveIssue = (issueToRemove: string) => {
    onIssuesChange(issues.filter(issue => issue !== issueToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddIssue();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          value={newIssue}
          onChange={(e) => setNewIssue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          sx={{ flexGrow: 1 }}
        />
        <IconButton
          onClick={handleAddIssue}
          disabled={!newIssue.trim()}
          color="primary"
          size="small"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {issues.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {issues.map((issue, index) => (
            <Chip
              key={index}
              label={issue}
              onDelete={() => handleRemoveIssue(issue)}
              deleteIcon={<DeleteIcon />}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

