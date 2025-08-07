import { Box, Typography, Avatar, IconButton, Chip } from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Pets as PetIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface PetHeaderProps {
  pet: {
    id: string;
    name: string;
    type: string;
    breed: string;
    gender: string;
    image?: string;
    color?: string;
    isNeutered?: boolean;
  };
  onEdit: () => void;
}

export const PetHeader = ({ pet, onEdit }: PetHeaderProps) => {
  const navigate = useNavigate();
  const { name, type, breed, gender, image, color, isNeutered } = pet;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        mb: 4,
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            position: "absolute",
            left: -60,
            top: "50%",
            transform: "translateY(-50%)",
            display: { xs: "none", md: "flex" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Avatar
          src={image}
          alt={name}
          sx={{
            width: 120,
            height: 120,
            bgcolor: "primary.light",
            "& .MuiSvgIcon-root": {
              fontSize: 60,
            },
          }}
        >
          <PetIcon />
        </Avatar>
      </Box>

      <Box sx={{ flexGrow: 1, textAlign: { xs: "center", md: "left" } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="h4" component="h1">
            {name}
          </Typography>
          {gender === "male" ? (
            <MaleIcon color="primary" />
          ) : (
            <FemaleIcon color="secondary" />
          )}
          {isNeutered && (
            <Chip
              label="Neutered"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {breed} • {type}
        </Typography>

        {color && (
          <Typography variant="body2" color="text.secondary">
            Color: {color}
          </Typography>
        )}
      </Box>

      <Box>
        <IconButton
          onClick={onEdit}
          size="large"
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <EditIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default PetHeader;
