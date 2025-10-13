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
  provider_services?: number[];
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

  const getInitialFormData = (user: any): ProfileFormData => ({
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
    provider_services: user?.is_provider
      ? user.provider_services?.map((s: any) => s.id) || []
      : [],
    provider_bio: user?.is_provider ? user.provider_bio || "" : "",
    provider_hourly_rate: user?.is_provider
      ? user.provider_hourly_rate?.toString() || ""
      : "",
    provider_rating: user?.is_provider
      ? user.provider_rating?.toString() || ""
      : "",
  });

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
  >([
    { id: 1, name: "Dog Walking" },
    { id: 2, name: "Pet Sitting" },
    { id: 3, name: "Grooming" },
  ]);

  if (!user)
    return <Typography>Please log in to view your profile.</Typography>;

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

      const updatedPayload: Partial<ProfileFormData> = {};
      const initial = getInitialFormData(user);
      (Object.keys(formData) as (keyof ProfileFormData)[]).forEach((key) => {
        if (formData[key] !== initial[key]) {
          (updatedPayload as any)[key] = formData[key];
        }
      });
      if (newImageUrl !== user.profile_image)
        updatedPayload.profile_image = newImageUrl;

      if (Object.keys(updatedPayload).length > 0) {
        const profileUpdateResponse = await fetch(`${getBaseUrl()}/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedPayload),
        });
        if (!profileUpdateResponse.ok)
          throw new Error("Failed to update profile.");
        const profileData = await profileUpdateResponse.json();
        updatedUserData = { ...updatedUserData, ...profileData };
      }

      setUser(updatedUserData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
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

  const renderTextField = (label: string, key: keyof ProfileFormData) => (
    <TextField
      fullWidth
      label={label}
      name={key}
      value={formData[key] || ""}
      onChange={handleChange}
      variant="outlined"
      sx={{ mb: 2 }}
    />
  );

  return (
    <Box sx={{ p: 4, maxWidth: "lg", mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Avatar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Profile Picture"
              avatar={
                <Avatar src={getAvatarSrc()} sx={{ width: 56, height: 56 }} />
              }
            />
            <CardContent sx={{ textAlign: "center" }}>
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
                  >
                    Change Photo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Info */}
        <Grid size={{ xs: 12 }}>
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
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12 }}>
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
        </Grid>

        {/* Provider Info (if applicable) */}
        {user.is_provider && (
          <Grid size={{ xs: 12 }}>
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
                        provider_services: e.target.value as number[],
                      })
                    }
                    renderValue={(selected) =>
                      serviceOptions
                        .filter((opt) => selected.includes(opt.id))
                        .map((opt) => opt.name)
                        .join(", ")
                    }
                  >
                    {serviceOptions.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        <Checkbox
                          checked={(formData.provider_services ?? []).includes(
                            service.id
                          )}
                        />
                        <ListItemText primary={service.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {renderTextField("Bio", "provider_bio")}
                {renderTextField("Hourly Rate", "provider_hourly_rate")}
                {renderTextField("Rating", "provider_rating")}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Save / Cancel */}
        {isEditing && (
          <Grid size={{ xs: 12 }}>
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
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

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
