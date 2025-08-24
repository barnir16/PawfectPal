import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  IconButton,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

// Import our new components
import { PetHeader } from "../../../../components/pet-detail/PetHeader";
import { PetStats } from "../../../../components/pet-detail/PetStats";
import { MedicalRecords } from "../../../../components/pet-detail/MedicalRecords";
import { Appointments } from "../../../../components/pet-detail/Appointments";
import { NotesAndFiles } from "../../../../components/pet-detail/NotesAndFiles";
import { ActionButtons } from "../../../../components/pet-detail/ActionButtons";
import { BreedInfoCard } from "../../../../components/pets/BreedInfoCard";
import { VaccineTracker } from "../../../../components/pets/VaccineTracker";
import type { Task } from "../../../../components/pet-detail/Appointments";
import type { FileAttachment } from "../../../../components/pet-detail/NotesAndFiles";
import { getPet, deletePet } from "../../../../services/pets/petService";
import type { Pet } from "../../../../types/pets/pet";
// Mock data - replace with API calls in a real app
const mockPet = {
  id: "1",
  name: "Max",
  type: "Dog",
  breed: "Golden Retriever",
  gender: "male",
  birthDate: "2020-05-15T00:00:00.000Z",
  weight: 28.5,
  weightUnit: "kg",
  color: "Golden",
  microchipNumber: "123456789012345",
  isNeutered: true,
  notes: "Loves to play fetch and swim",
  image: "/placeholder-dog.jpg",
  lastVetVisit: "2023-10-10",
  nextVaccination: "2024-04-15",
};

const mockMedicalHistory = [
  {
    id: 1,
    date: "2023-10-10",
    type: "Vaccination",
    title: "Annual Vaccination",
    description: "Rabies, DHPP, Bordetella",
    vet: "Dr. Smith",
    notes: "Pet was well-behaved during the visit.",
  },
  {
    id: 2,
    date: "2023-07-15",
    type: "Check-up",
    title: "Annual Check-up",
    description: "Routine physical examination",
    vet: "Dr. Johnson",
    notes: "Healthy weight, good dental health.",
  },
];

const mockUpcomingTasks: Task[] = [
  {
    id: 1,
    title: "Vet Appointment",
    type: "Vet Visit",
    dueDate: "2024-04-15T14:30:00.000Z",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Flea Treatment",
    type: "Medication",
    dueDate: "2024-04-20T00:00:00.000Z",
    status: "upcoming",
  },
];

const mockNotes = [
  {
    id: 1,
    content:
      "Max has been scratching more than usual. Monitor for any skin irritation.",
    createdAt: "2024-03-15T10:30:00.000Z",
    updatedAt: "2024-03-15T10:30:00.000Z",
  },
];

const mockFiles: FileAttachment[] = [
  {
    id: 1,
    name: "vaccination_record.pdf",
    type: "pdf",
    size: "2.5 MB",
    uploadedAt: "2024-01-10T14:22:00.000Z",
    url: "#",
  },
];

interface TabPanelProps {
  readonly children?: React.ReactNode;
  readonly index: number;
  readonly value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export const PetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pet data by ID
  useEffect(() => {
    const fetchPet = async () => {
      if (!id) {
        setError("Pet ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('🔍 Fetching pet with ID:', id);
        const petData = await getPet(parseInt(id));
        console.log('🔍 Pet data fetched:', petData);
        console.log('🔍 Pet type:', petData.type);
        console.log('🔍 Pet breedType:', petData.breedType);
        console.log('🔍 Pet breed:', petData.breed);
        setPet(petData);
      } catch (error) {
        console.error("Error fetching pet:", error);
        setError("Failed to load pet details. Pet may not exist.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    console.log('🔍 Tab changed from', tabValue, 'to', newValue);
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/pets/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!pet?.id) return;
    
    if (
      window.confirm(
        `Are you sure you want to delete ${pet.name}? This action cannot be undone.`
      )
    ) {
      try {
        await deletePet(pet.id);
        navigate("/pets");
      } catch (error) {
        console.error("Error deleting pet:", error);
        alert("Failed to delete pet. Please try again.");
      }
    }
  };

  const handleAddMedicalRecord = () => {
    console.log("Add medical record clicked");
    // Open medical record form/modal
  };

  const handleScheduleAppointment = () => {
    console.log("Schedule appointment clicked");
    // Open appointment scheduling
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography>Loading pet details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !pet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || "Pet not found"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The pet you're looking for doesn't exist or has been removed.
          </Typography>
          <IconButton onClick={() => navigate('/pets')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Pet Details
            </Typography>
          </Box>

          <ActionButtons
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddMedicalRecord={handleAddMedicalRecord}
            onScheduleAppointment={handleScheduleAppointment}
          />
        </Box>

        <PetHeader pet={pet} onEdit={handleEdit} />
        <PetStats pet={pet} />
      </Box>

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="pet detail tabs"
          >
            <Tab label="Medical Records" {...a11yProps(0)} />
            <Tab label="Appointments" {...a11yProps(1)} />
            <Tab label="Notes & Files" {...a11yProps(2)} />
            <Tab label="Breed Info" {...a11yProps(3)} />
            <Tab label="Vaccines" {...a11yProps(4)} />
          </Tabs>
          {/* Test if tabs are visible */}
          <Box sx={{ p: 1, bgcolor: '#f0f0f0', fontSize: '12px' }}>
            Debug: Tab {tabValue} selected (0=Medical, 1=Appointments, 2=Notes, 3=Breed Info, 4=Vaccines)
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <MedicalRecords
            records={mockMedicalHistory}
            onAddRecord={handleAddMedicalRecord}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Appointments
            tasks={mockUpcomingTasks}
            onAddTask={handleScheduleAppointment}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <NotesAndFiles
            notes={mockNotes}
            files={mockFiles}
            onAddNote={(content) => console.log("Add note:", content)}
            onEditNote={(id, content) => console.log("Edit note:", id, content)}
            onDeleteNote={(id) => console.log("Delete note:", id)}
            onUploadFile={(file) => console.log("Upload file:", file)}
            onDeleteFile={(id) => console.log("Delete file:", id)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* CRITICAL TEST: Simple display to verify tab content renders */}
          <Box sx={{ p: 2, border: '3px solid red', borderRadius: 1, mb: 2, bgcolor: '#ffebee' }}>
            <Typography variant="h4" color="error">🚨 CRITICAL TEST 🚨</Typography>
            <Typography variant="h6">If you see this red box, the tab content is rendering!</Typography>
            <Typography>Tab Value: {tabValue}</Typography>
            <Typography>Pet Name: {pet?.name}</Typography>
            <Typography>Pet Type: {pet?.type}</Typography>
            <Typography>Pet Breed: {pet?.breed}</Typography>
          </Box>
          
          <BreedInfoCard
            petType={pet.type || pet.breedType || 'unknown'}
            breedName={pet.breed}
            currentWeight={pet.weightKg || pet.weight_kg}
            weightUnit={pet.weightUnit}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <VaccineTracker pet={pet} />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default PetDetail;
