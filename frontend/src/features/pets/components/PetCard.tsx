import { useState } from "react";
import {
  Avatar,
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  FavoriteBorder as HealthIcon,
} from "@mui/icons-material";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { formatPetAge } from "../../../utils/petAge";

interface PetCardProps {
  pet: Pet;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Warm gradient per species — each card feels distinct at a glance
const speciesColors: Record<string, { bg: string; accent: string }> = {
  dog:    { bg: "linear-gradient(135deg, #F4A261 0%, #E9864A 100%)", accent: "#E9864A" },
  cat:    { bg: "linear-gradient(135deg, #2A9D8F 0%, #1D7A6E 100%)", accent: "#2A9D8F" },
  bird:   { bg: "linear-gradient(135deg, #74C69D 0%, #52B788 100%)", accent: "#52B788" },
  rabbit: { bg: "linear-gradient(135deg, #E9C46A 0%, #D4A843 100%)", accent: "#D4A843" },
  other:  { bg: "linear-gradient(135deg, #9B8EA8 0%, #7A6D8A 100%)", accent: "#9B8EA8" },
};

export const PetCard = ({ pet, onEdit, onDelete }: PetCardProps) => {
  const { t } = useLocalization();
  const [hovered, setHovered] = useState(false);

  const petType = (pet.type || "other").toLowerCase();
  const colors = speciesColors[petType] ?? speciesColors.other;

  const displayAge = formatPetAge(pet, {
    months: t("pets.months"),
    years: t("pets.years"),
    unknownAge: t("pets.unknownAge"),
    futureBirthdate: t("pets.futureBirthdate"),
  });

  const formatWeight = () => {
    if (!pet.weightKg) return null;
    const unit = pet.weightUnit || "kg";
    return `${pet.weightKg} ${unit === "kg" ? t("pets.kg") : t("pets.pounds")}`;
  };

  const weight = formatWeight();

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
        },
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onClick={() => pet.id && onEdit(pet.id)}
    >
      {/* ── Colored header strip ──────────────────────────────── */}
      <Box
        sx={{
          background: colors.bg,
          height: 88,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          px: 2,
        }}
      >
        {/* Action buttons — appear on hover */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 0.5,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={t("pets.edit")}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); pet.id && onEdit(pet.id); }}
              sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "text.primary", width: 28, height: 28, "&:hover": { bgcolor: "#fff" } }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("pets.delete")}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); pet.id && onDelete(pet.id); }}
              sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "error.main", width: 28, height: 28, "&:hover": { bgcolor: "#fff" } }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Avatar sits half below header */}
        <Avatar
          src={pet.imageUrl}
          alt={pet.name}
          sx={{
            width: 62,
            height: 62,
            bgcolor: "rgba(255,255,255,0.28)",
            border: "3px solid #fff",
            mb: "-31px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
          }}
        >
          <PetsIcon sx={{ color: "#fff", fontSize: 28 }} />
        </Avatar>
      </Box>

      {/* ── Card body ─────────────────────────────────────────── */}
      <Box sx={{ pt: "38px", px: 2, pb: 2, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Name + species */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.2 }}>
              {pet.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[pet.breed, pet.gender].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <Chip
            label={t(`pets.${petType}`)}
            size="small"
            sx={{
              bgcolor: `${colors.accent}20`,
              color: colors.accent,
              fontWeight: 700,
              fontSize: "0.68rem",
              border: "none",
              mt: 0.25,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* Age / Weight row */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Age</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayAge}</Typography>
          </Box>
          {weight && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Weight</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{weight}</Typography>
            </Box>
          )}
        </Stack>

        {/* Health status badge */}
        <Box sx={{ mt: "auto" }}>
          {pet.lastVetVisit ? (
            <Chip
              icon={<HealthIcon sx={{ fontSize: "13px !important" }} />}
              label="Vet visited"
              size="small"
              sx={{
                bgcolor: "rgba(82,183,136,0.1)",
                color: "success.dark",
                fontSize: "0.7rem",
                height: 22,
                fontWeight: 500,
                "& .MuiChip-icon": { ml: "6px" },
              }}
            />
          ) : (
            <Chip
              label="No vet visit recorded"
              size="small"
              sx={{ bgcolor: "rgba(0,0,0,0.05)", color: "text.secondary", fontSize: "0.7rem", height: 22 }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default PetCard;
