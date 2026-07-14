import { useState, useEffect, type ChangeEvent } from "react";
import { Box, Button, Typography, IconButton } from "@mui/material";
import {
  AddAPhoto as AddPhotoIcon,
  Delete as DeleteIcon,
  Pets as PawIcon,
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

  useEffect(() => {
    setPreview(imageUrl || null);
  }, [imageUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
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
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {/* Photo display / upload zone */}
      <input
        accept="image/*"
        style={{ display: "none" }}
        id="pet-photo-upload"
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <label htmlFor="pet-photo-upload" style={{ cursor: disabled ? "default" : "pointer", width: "100%" }}>
        <Box
          sx={{
            width: "100%",
            aspectRatio: "1",
            maxWidth: 180,
            mx: "auto",
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            border: "3px solid",
            borderColor: preview ? "transparent" : "rgba(244,162,97,0.35)",
            background: preview
              ? "transparent"
              : "linear-gradient(135deg, rgba(244,162,97,0.15) 0%, rgba(42,157,143,0.12) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: preview
              ? "0 4px 20px rgba(0,0,0,0.15)"
              : "0 2px 10px rgba(244,162,97,0.15)",
            "&:hover": disabled ? {} : {
              borderColor: "primary.main",
              boxShadow: "0 4px 20px rgba(244,162,97,0.3)",
            },
          }}
        >
          {preview ? (
            <Box
              component="img"
              src={preview}
              alt="Pet"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box sx={{ textAlign: "center", p: 2 }}>
              <PawIcon sx={{ fontSize: 44, color: "primary.main", opacity: 0.6, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                {t("pets.addPhoto")}
              </Typography>
            </Box>
          )}

          {/* Hover overlay when there's a photo */}
          {preview && !disabled && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
                "&:hover": { opacity: 1 },
              }}
            >
              <AddPhotoIcon sx={{ color: "white", fontSize: 32 }} />
            </Box>
          )}
        </Box>
      </label>

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <label htmlFor="pet-photo-upload">
          <Button
            component="span"
            variant="outlined"
            size="small"
            startIcon={<AddPhotoIcon fontSize="small" />}
            disabled={disabled}
            sx={{ borderRadius: 3, fontWeight: 600, px: 2 }}
          >
            {preview ? t("pets.changePhoto") : t("pets.uploadPhoto")}
          </Button>
        </label>

        {preview && onRemove && (
          <Button
            variant="text"
            size="small"
            color="error"
            startIcon={<DeleteIcon fontSize="small" />}
            onClick={handleRemove}
            disabled={disabled}
            sx={{ borderRadius: 3, opacity: 0.75, "&:hover": { opacity: 1 } }}
          >
            {t("common.remove")}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PetImageUpload;
