import { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  useTheme,
} from "@mui/material";
import {
  Note as NoteIcon,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  InsertPhoto as ImageIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";


// Types
type FileType = "pdf" | "image" | "document" | "other";

interface Note {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FileAttachment {
  id: number;
  name: string;
  type: FileType;
  size: string;
  uploadedAt: string;
  url: string;
}

interface NotesAndFilesProps {
  notes?: Note[];
  files?: FileAttachment[];
  onAddNote?: (content: string) => void;
  onEditNote?: (id: number, content: string) => void;
  onDeleteNote?: (id: number) => void;
  onUploadFile?: (file: File) => void;
  onDeleteFile?: (id: number) => void;
}

export const NotesAndFiles = ({
  notes = [],
  files = [],
  onAddNote,
  onEditNote,
  onDeleteNote,
  onUploadFile,
  onDeleteFile,
}: NotesAndFilesProps) => {
  const theme = useTheme();
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle note operations
  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEdit = (id: number) => {
    if (editingNoteContent.trim() && onEditNote) {
      onEditNote(id, editingNoteContent.trim());
      setEditingNoteId(null);
    }
  };

  // Handle file operations
  const handleFileUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Helper functions
  const getFileIcon = (type: FileType) => {
    const icons = {
      pdf: <PdfIcon color="error" />,
      image: <ImageIcon color="primary" />,
      document: <DocumentIcon color="action" />,
      other: <AttachFileIcon color="action" />,
    };
    return icons[type] || icons.other;
  };

  // Tab panel component
  const TabPanel = ({
    children,
    index,
  }: {
    children: React.ReactNode;
    index: number;
  }) => (
    <div hidden={activeTab !== index} role="tabpanel">
      {activeTab === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );

  return (
    <Paper
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          "& .MuiTabs-indicator": { height: 3 },
        }}
      >
        <Tab label="Notes" icon={<NoteIcon />} iconPosition="start" />
        <Tab
          label={`Files (${files.length})`}
          icon={<AttachFileIcon />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel index={0}>
        {/* Notes Tab */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder={t('pets.addNewNotePlaceholder')}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              startIcon={<AddIcon />}
            >
              Add Note
            </Button>
          </Box>
        </Box>

        <List>
          {notes.length === 0 ? (
            <Box textAlign="center" py={4} color="text.secondary">
              <NoteIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>No notes yet. Add your first note above.</Typography>
            </Box>
          ) : (
            notes.map((note) => (
              <div key={note.id}>
                <ListItem>
                  <ListItemIcon>
                    <NoteIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      editingNoteId === note.id ? (
                        <TextField
                          fullWidth
                          multiline
                          value={editingNoteContent}
                          onChange={(e) =>
                            setEditingNoteContent(e.target.value)
                          }
                        />
                      ) : (
                        <Typography sx={{ whiteSpace: "pre-line" }}>
                          {note.content}
                        </Typography>
                      )
                    }
                    secondary={format(
                      new Date(note.updatedAt || note.createdAt),
                      "MMM d, yyyy h:mm a"
                    )}
                  />
                  <ListItemSecondaryAction>
                    {editingNoteId === note.id ? (
                      <>
                        <Button onClick={() => handleSaveEdit(note.id)}>
                          Save
                        </Button>
                        <Button onClick={() => setEditingNoteId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => handleEditNote(note)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => onDeleteNote?.(note.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </div>
            ))
          )}
        </List>
      </TabPanel>

      <TabPanel index={1}>
        {/* Files Tab */}
        <Box sx={{ mb: 2, textAlign: "right" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleFileUploadClick}
            disabled={!onUploadFile}
          >
            Upload File
          </Button>
        </Box>

        <List>
          {files.length === 0 ? (
            <Box textAlign="center" py={4} color="text.secondary">
              <AttachFileIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>No files uploaded yet.</Typography>
            </Box>
          ) : (
            files.map((file) => (
              <div key={file.id}>
                <ListItem>
                  <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${file.size} • ${format(new Date(file.uploadedAt), "MMM d, yyyy")}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => onDeleteFile?.(file.id)}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </div>
            ))
          )}
        </List>
      </TabPanel>
    </Paper>
  );
};

export default NotesAndFiles;
