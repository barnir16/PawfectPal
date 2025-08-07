import { Avatar, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Pets as PetsIcon } from "@mui/icons-material";
import { format } from "date-fns";

interface PetCardProps {
  pet: {
    id: number;
    name: string;
    type: string;
    breed: string;
    birthDate: string;
    gender: string;
    weight: number;
    image: string;
    lastVetVisit: string;
    nextVaccination: string;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PetCard = ({ pet, onEdit, onDelete }: PetCardProps) => {
  let chipColor: "primary" | "secondary" | "default" = "default";
  if (pet.type === "Dog") chipColor = "primary";
  else if (pet.type === "Cat") chipColor = "secondary";

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        avatar={
          <Avatar
            src={pet.image}
            alt={pet.name}
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <PetsIcon fontSize="large" />
          </Avatar>
        }
        title={
          <Typography variant="h6" component="div">
            {pet.name}
            <Chip
              label={pet.type}
              size="small"
              sx={{ ml: 1, textTransform: "capitalize" }}
              color={chipColor}
            />
          </Typography>
        }
        subheader={`${pet.breed} • ${pet.gender}`}
        action={
          <Box>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => onEdit(pet.id)}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => onDelete(pet.id)}
                size="small"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            <strong>Age:</strong>{" "}
            {Math.floor(
              (new Date().getTime() - new Date(pet.birthDate).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )}{" "}
            years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Weight:</strong> {pet.weight} kg
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Last Vet Visit:</strong>{" "}
            {format(new Date(pet.lastVetVisit), "MMM d, yyyy")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Next Vaccination:</strong>{" "}
            {format(new Date(pet.nextVaccination), "MMM d, yyyy")}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ mt: "auto", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => onEdit(pet.id)}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PetCard;
