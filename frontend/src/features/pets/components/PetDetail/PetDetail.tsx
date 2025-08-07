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
import type { Task } from "../../../../components/pet-detail/Appointments";
import type { FileAttachment } from "../../../../components/pet-detail/NotesAndFiles";
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
  const [pet, setPet] = useState(mockPet);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, fetch pet data by ID
  useEffect(() => {
    const fetchPet = async () => {
      try {
        // Simulate API call
        // const response = await api.get(`/pets/${id}`);
        // setPet(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching pet:", error);
        // Handle error (e.g., show error message, redirect, etc.)
      }
    };

    if (id) {
      fetchPet();
    }
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/pets/${id}/edit`);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      // Handle delete logic
      console.log("Deleting pet:", id);
      navigate("/pets");
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
    return <div>Loading...</div>; // Replace with a proper loading component
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
          </Tabs>
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
      </Box>
    </Container>
  );
};

export default PetDetail;
