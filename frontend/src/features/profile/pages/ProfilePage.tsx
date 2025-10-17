import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { getBaseUrl, getToken } from "../../../services";
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  Snackbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Pets as PetsIcon,
} from "@mui/icons-material";
import { getFullImageUrl } from "../../../utils/image";

interface ProfileFormData {
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  profile_image?: string;
  google_id?: string;
  profile_picture_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  provider_services?: string[];
  provider_bio?: string;
  provider_hourly_rate?: string;
  provider_rating?: string;
}

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getInitialFormData = (user: any): ProfileFormData => {
    // Log the user object to debug
    console.log("User data in getInitialFormData:", user);

    return {
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      full_name: user?.full_name || "",
      profile_image: user?.profile_image || "",
      google_id: user?.google_id || "",
      profile_picture_url: user?.profile_picture_url || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      country: user?.country || "",
      postal_code: user?.postal_code || "",
      latitude: user?.latitude?.toString() || "",
      longitude: user?.longitude?.toString() || "",
      // Provider services are now service names, not IDs
      provider_services: user?.provider_services || [],
      provider_bio: user?.provider?.bio || user?.provider_bio || "",
      provider_hourly_rate:
        user?.provider?.hourly_rate?.toString() ||
        user?.provider_hourly_rate?.toString() ||
        "",
      provider_rating:
        user?.provider?.rating?.toString() ||
        user?.provider_rating?.toString() ||
        "",
    };
  };

  const [formData, setFormData] = useState<ProfileFormData>(
    getInitialFormData(user)
  );

  useEffect(() => {
    if (user) {
      setFormData(getInitialFormData(user));
      setPreviewImage(user.profile_image || user.profile_picture_url || null);
    }
  }, [user]);

  const [serviceOptions, setServiceOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>(
    getInitialFormData(user)
  );

  // Load services and initial form data
  useEffect(() => {
    const loadServices = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.warn('No authentication token found');
          useFallbackServices();
          return;
        }

        const response = await fetch(`${getBaseUrl()}/service_booking/types/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 401) {
          console.warn('Authentication failed - using fallback services');
          useFallbackServices();
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Map the response to match the expected format
        const formattedServices = data.map((service: any) => ({
          id: service.id,
          name: service.name,
        }));
        setServiceOptions(formattedServices);
      } catch (error) {
        console.error("Failed to load services:", error);
        useFallbackServices();
      }
    };

    const useFallbackServices = () => {
      setServiceOptions([
        { id: 1, name: "Dog Walking" },
        { id: 2, name: "Pet Sitting" },
        { id: 3, name: "Grooming" },
        { id: 4, name: "Training" },
        { id: 5, name: "Veterinary" },
        { id: 6, name: "Boarding" },
        { id: 7, name: "Pet Taxi" },
        { id: 8, name: "Daycare" },
      ]);
    };

    loadServices();

    // Initialize form data when user changes
    if (user) {
      const data = getInitialFormData(user);
      setInitialFormData(data);
      setFormData(data);
      setPreviewImage(user.profile_image || user.profile_picture_url || null);
    }
  }, [user]);

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setPreviewImage(user?.profile_image || user?.profile_picture_url || null);
  };

  if (!user) {
    return <Typography>Please log in to view your profile.</Typography>;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const file = fileInputRef.current?.files?.[0];
      let updatedUserData = { ...user };
      let newImageUrl = user.profile_image;

      if (file) {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        const imageUploadResponse = await fetch(
          `${getBaseUrl()}/image_upload/profile-image`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataToSend,
          }
        );
        if (!imageUploadResponse.ok) throw new Error("Failed to upload image.");
        const imageData = await imageUploadResponse.json();
        newImageUrl = imageData.profile_image;
        updatedUserData.profile_image = newImageUrl;
      }

      // Prepare the update payload
      const updatedPayload: any = {};
      const initial = getInitialFormData(user);

      // Handle regular user fields
      (Object.keys(formData) as (keyof ProfileFormData)[]).forEach((key) => {
        if (
          formData[key] !== initial[key] &&
          !key.startsWith("provider_") &&
          key !== "provider_services"
        ) {
          updatedPayload[key] = formData[key];
        }
      });

      // Handle provider fields
      if (user.is_provider) {
        // Convert service names to service IDs for backend compatibility
        const serviceIds =
          (formData.provider_services || [])
            .map(
              (name) => serviceOptions.find((service) => service.name === name)?.id
            )
            .filter((id) => id !== undefined) as number[] || [];

        console.log("Form data provider fields:", {
          provider_services: formData.provider_services,
          provider_bio: formData.provider_bio,
          provider_hourly_rate: formData.provider_hourly_rate,
          serviceNames: formData.provider_services,
          serviceIds: serviceIds,
          serviceOptions: serviceOptions,
        });

        // Send provider fields at top level instead of nested under provider_info
        updatedPayload.provider_services = formData.provider_services;
        updatedPayload.provider_bio = formData.provider_bio;
        updatedPayload.provider_hourly_rate = parseFloat(
          formData.provider_hourly_rate || "0"
        );
      }

      console.log("Sending update payload:", updatedPayload);

      const profileUpdateResponse = await fetch(`${getBaseUrl()}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!profileUpdateResponse.ok) {
        const errorData = await profileUpdateResponse.json();
        console.error("Update error:", errorData);
        throw new Error(errorData.detail || "Failed to update profile.");
      }

      const profileData = await profileUpdateResponse.json();
      console.log("Update successful, response:", profileData);

      // Update the user data in context
      setUser((prev) => ({
        ...prev,
        ...profileData,
      }));

      // Re-initialize form data after successful save (same logic as when user changes)
      if (user) {
        const data = getInitialFormData(user);
        setInitialFormData(data);
        setFormData(data);
        setPreviewImage(user.profile_image || user.profile_picture_url || null);
      }

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error in handleSave:", err);
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = () => {
    if (previewImage)
      return previewImage.startsWith("blob:")
        ? previewImage
        : getFullImageUrl(previewImage);
    return getFullImageUrl(
      user.profile_image || user.profile_picture_url || null
    );
  };

  const renderTextField = (
    label: string,
    key: keyof ProfileFormData,
    disabled = false
  ) => (
    <TextField
      fullWidth
      label={label}
      name={key}
      value={formData[key] || ""}
      onChange={handleChange}
      variant="outlined"
      sx={{ mb: 2 }}
      disabled={!isEditing || disabled}
    />
  );

  return (
    <Box sx={{ p: 4, maxWidth: "lg", mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4">My Profile</Typography>
        {!isEditing && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minWidth: 250, // Set a minimum width
              width: "100%", // Take full width of the grid item
              maxWidth: 300, // Set a maximum width
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexGrow: 1,
                gap: 2,
                p: 3,
                width: "100%", // Ensure content takes full width
                boxSizing: "border-box", // Include padding in width calculation
              }}
            >
              <Avatar
                src={getAvatarSrc()}
                sx={{
                  width: 150, // Slightly larger avatar
                  height: 150, // Slightly larger avatar
                  mb: 2,
                  fontSize: "3rem", // Larger font for initials
                }}
              />
              {isEditing && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<EditIcon />}
                    disabled={!isEditing}
                    fullWidth
                  >
                    Change Photo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Basic Info */}
        <Card>
          <CardHeader
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PetsIcon color="primary" /> Basic Info
              </Box>
            }
          />
          <CardContent>
            {renderTextField("Username", "username")}
            {renderTextField("Full Name", "full_name")}
            {renderTextField("Email", "email")}
            {renderTextField("Phone", "phone")}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationIcon color="primary" /> Address
              </Box>
            }
          />
          <CardContent>
            {renderTextField("Address", "address")}
            {renderTextField("City", "city")}
            {renderTextField("State", "state")}
            {renderTextField("Country", "country")}
            {renderTextField("Postal Code", "postal_code")}
          </CardContent>
        </Card>

        {/* Provider Info (if applicable) */}
        {user.is_provider && (
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PetsIcon color="primary" /> Provider Info
                </Box>
              }
            />
            <CardContent>
              {/* Services */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Services</InputLabel>
                <Select
                  multiple
                  name="provider_services"
                  value={formData.provider_services ?? []}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      provider_services: e.target.value as string[],
                    })
                  }
                  disabled={!isEditing}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {serviceOptions.map((service) => (
                    <MenuItem key={service.id} value={service.name}>
                      <Checkbox
                        checked={(formData.provider_services ?? []).includes(
                          service.name
                        )}
                      />
                      <ListItemText primary={service.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {renderTextField("Bio", "provider_bio")}
              {renderTextField("Hourly Rate", "provider_hourly_rate")}
              <TextField
                fullWidth
                label="Rating"
                value={formData.provider_rating || ""}
                variant="outlined"
                sx={{ mb: 2 }}
                disabled={true}
                helperText="Rating is calculated based on user reviews"
              />
            </CardContent>
          </Card>
        )}

        {/* Save / Cancel */}
        {isEditing && (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={
                loading ? <CircularProgress size={20} /> : <SaveIcon />
              }
              disabled={loading}
            >
              Save
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="Profile saved successfully!"
      />
    </Box>
  );
};

export default ProfilePage;
