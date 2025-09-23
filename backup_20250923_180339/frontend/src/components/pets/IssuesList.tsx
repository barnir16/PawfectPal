import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

interface IssuesListProps {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (issues: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export const IssuesList = ({
  label,
  placeholder,
  value = [],
  onChange,
  disabled = false,
  error = false,
  helperText,
}: IssuesListProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddIssue = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const handleRemoveIssue = (issueToRemove: string) => {
    onChange(value.filter(issue => issue !== issueToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddIssue();
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleAddIssue}
                disabled={disabled || !inputValue.trim()}
                size="small"
                color="primary"
              >
                <AddIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {value.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((issue, index) => (
            <Chip
              key={index}
              label={issue}
              onDelete={() => handleRemoveIssue(issue)}
              deleteIcon={<DeleteIcon />}
              variant="outlined"
              size="small"
              disabled={disabled}
            />
          ))}
        </Box>
      )}
      
      {value.length === 0 && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 1, display: "block" }}
        >
          No {label.toLowerCase()} added yet. Type and press Enter or click + to add.
        </Typography>
      )}
    </Box>
  );
};

export default IssuesList;

