import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Avatar,
  Badge,
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Pets as PetIcon,
  Cake as CakeIcon,
  Scale as ScaleIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Event as EventIcon,
  LocalHospital as HospitalIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridCellParams } from "@mui/x-data-grid";

// Mock data - replace with real data from your API
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
  {
    id: 3,
    date: "2023-03-22",
    type: "Treatment",
    title: "Ear Infection",
    description: "Prescribed ear drops",
    vet: "Dr. Smith",
    notes: "Follow up in 2 weeks if symptoms persist.",
  },
];

const mockUpcomingTasks = [
  {
    id: 1,
    title: "Vet Appointment",
    type: "Vet Visit",
    dueDate: "2024-04-15T14:30:00.000Z",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Monthly Flea Treatment",
    type: "Medication",
    dueDate: "2023-12-01T09:00:00.000Z",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Grooming",
    type: "Grooming",
    dueDate: "2023-12-10T10:00:00.000Z",
    status: "upcoming",
  },
];

const getColor = (type: string) => {
  if (type === "Vaccination") return "primary";
  if (type === "Check-up") return "success";
  return "secondary";
};

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
      id={`pet-tabpanel-${index}`}
      aria-labelledby={`pet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `pet-tab-${index}`,
    "aria-controls": `pet-tabpanel-${index}`,
  };
}

const PetDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tasksPagination, setTasksPagination] = useState({
    page: 0,
    pageSize: 5,
  });

  const [medicalHistoryPagination, setMedicalHistoryPagination] = useState({
    page: 0,
    pageSize: 5,
  });
  // Load pet data
  useEffect(() => {
    const fetchPet = async () => {
      try {
        // In a real app, you would fetch the pet data from your API
        // const response = await fetch(`/api/pets/${id}`);
        // const data = await response.json();

        // Mock data for demo
        setPet(mockPet);
        setLoading(false);
      } catch (error) {
        console.error("Error loading pet:", error);
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/pets/${id}/edit`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getAge = (birthDate: string) => {
    const years = differenceInYears(new Date(), new Date(birthDate));
    const months = differenceInMonths(new Date(), new Date(birthDate)) % 12;

    if (years === 0) {
      return `${months} ${months === 1 ? "month" : "months"}`;
    } else if (months === 0) {
      return `${years} ${years === 1 ? "year" : "years"}`;
    } else {
      return `${years} ${years === 1 ? "year" : "years"} and ${months} ${months === 1 ? "month" : "months"}`;
    }
  };

  const medicalHistoryColumns: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueFormatter: (params: GridCellParams) =>
        format(new Date(params.value as string), "MMM d, yyyy"),
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getColor(params.value)}
        />
      ),
    },
    { field: "title", headerName: "Title", flex: 1 },
    {
      field: "vet",
      headerName: "Vet",
      width: 150,
      renderCell: (params) => `Dr. ${params.value}`,
    },
  ];

  const tasksColumns: GridColDef[] = [
    {
      field: "title",
      headerName: "Task",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <EventIcon color="action" sx={{ mr: 1 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 160,
      valueFormatter: (params: GridCellParams) =>
        format(new Date(params.value as string), "MMM d, yyyy h:mm a"),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value === "completed" ? "Completed" : "Upcoming"}
          size="small"
          color={params.value === "completed" ? "success" : "warning"}
        />
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!pet) {
    return <div>Pet not found</div>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {pet.name}'s Profile
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Pet
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box
          sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 250,
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.palette.background.paper}`,
                    bgcolor:
                      pet.gender === "male" ? "primary.main" : "secondary.main",
                  }}
                >
                  {pet.gender === "male" ? <MaleIcon /> : <FemaleIcon />}
                </Avatar>
              }
            >
              <Avatar
                src={pet.image}
                alt={pet.name}
                sx={{
                  width: 150,
                  height: 150,
                  bgcolor: "primary.light",
                  "& .MuiSvgIcon-root": {
                    fontSize: 60,
                  },
                }}
              >
                <PetIcon />
              </Avatar>
            </Badge>
            <Typography variant="h5" sx={{ mt: 2 }}>
              {pet.name}
            </Typography>
            <Typography color="text.secondary">{pet.breed}</Typography>
            <Chip
              label={pet.type}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CakeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Age"
                      secondary={getAge(pet.birthDate)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CakeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Birth Date"
                      secondary={format(
                        new Date(pet.birthDate),
                        "MMMM d, yyyy"
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScaleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Weight"
                      secondary={`${pet.weight} ${pet.weightUnit}`}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Color/Markings"
                      secondary={pet.color || "N/A"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Microchip"
                      secondary={pet.microchipNumber || "Not chipped"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Spayed/Neutered"
                      secondary={pet.isNeutered ? "Yes" : "No"}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardHeader
                    title="Health Summary"
                    titleTypographyProps={{
                      variant: "subtitle1",
                      fontWeight: "bold",
                    }}
                    sx={{ bgcolor: "action.hover", py: 1 }}
                  />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Vet Visit"
                          secondary={
                            pet.lastVetVisit
                              ? format(
                                  new Date(pet.lastVetVisit),
                                  "MMMM d, yyyy"
                                )
                              : "No records"
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Next Vaccination"
                          secondary={
                            pet.nextVaccination
                              ? format(
                                  new Date(pet.nextVaccination),
                                  "MMMM d, yyyy"
                                )
                              : "No upcoming vaccinations"
                          }
                          secondaryTypographyProps={{
                            color:
                              pet.nextVaccination &&
                              new Date(pet.nextVaccination) < new Date()
                                ? "error"
                                : "textSecondary",
                          }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Card>

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="pet details tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Medical History"
              icon={<HospitalIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Upcoming Tasks"
              icon={<EventIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              label="Notes"
              icon={<NotesIcon />}
              iconPosition="start"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={mockMedicalHistory}
              columns={medicalHistoryColumns}
              pagination
              paginationModel={medicalHistoryPagination}
              onPaginationModelChange={setMedicalHistoryPagination}
              disableRowSelectionOnClick
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={mockUpcomingTasks}
              columns={tasksColumns}
              pagination
              paginationModel={tasksPagination}
              onPaginationModelChange={setTasksPagination}
              disableRowSelectionOnClick
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            {pet.notes ? (
              <Typography>{pet.notes}</Typography>
            ) : (
              <Typography color="textSecondary" fontStyle="italic">
                No notes available for {pet.name}.
              </Typography>
            )}
          </Paper>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PetDetail;
