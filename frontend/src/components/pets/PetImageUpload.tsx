import { useState, type ChangeEvent } from "react";
import { Avatar, Box, Button } from "@mui/material";
import {
  AddAPhoto as AddPhotoIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useLocalization } from "../../contexts/LocalizationContext";

interface PetImageUploadProps {
  imageUrl?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export const PetImageUpload = ({
  imageUrl,
  onChange,
  onRemove,
  disabled = false,
}: PetImageUploadProps) => {
  const { t } = useLocalization();
  const [preview, setPreview] = useState<string | null>(imageUrl || null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    onRemove?.();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <Avatar
        src={preview || undefined}
        alt="Pet"
        sx={{
          width: 150,
          height: 150,
          mb: 2,
          bgcolor: "primary.light",
          "& .MuiSvgIcon-root": {
            fontSize: 60,
          },
        }}
      >
        <AddPhotoIcon />
      </Avatar>

      <input
        accept="image/*"
        style={{ display: "none" }}
        id="pet-photo-upload"
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <label htmlFor="pet-photo-upload">
          <Button
            component="span"
            variant="outlined"
            startIcon={<AddPhotoIcon />}
            disabled={disabled}
          >
            {preview ? t('pets.changePhoto') : t('pets.addPhoto')}
          </Button>
        </label>

        {preview && onRemove && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
            disabled={disabled}
          >
            {t('common.delete')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PetImageUpload;
