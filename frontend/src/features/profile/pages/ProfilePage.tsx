import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { getBaseUrl, getToken } from "../../../services";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material";
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
  provider_services?: string;
  provider_bio?: string;
  provider_hourly_rate?: string;
  provider_rating?: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
}));

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to get the initial form data from the user object
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
      ? (user.provider_services || []).join(", ")
      : "",
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

  if (!user)
    return <Typography>Please log in to view your profile.</Typography>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const file = fileInputRef.current?.files?.[0];
      let updatedUserData = { ...user };
      let newImageUrl = user.profile_image;

      // 1. Upload new image if a file is selected
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

      // 2. Prepare and send profile data
      const updatedPayload: Partial<ProfileFormData> = {};
      const initial = getInitialFormData(user);

      Object.keys(formData).forEach((key) => {
        const k = key as keyof ProfileFormData;
        if (formData[k] !== initial[k]) {
          updatedPayload[k] = formData[k];
        }
      });

      // Update the profile_image in the payload if a new image was uploaded
      if (newImageUrl !== user.profile_image) {
        updatedPayload.profile_image = newImageUrl;
      }

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
          throw new Error("Failed to update profile data.");
        const profileData = await profileUpdateResponse.json();
        updatedUserData = { ...updatedUserData, ...profileData };
      }

      setUser(updatedUserData);
      console.log("Profile and/or image updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      // NOTE: Using a custom modal or snackbar is better than alert()
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = () => {
    if (previewImage) {
      // If it's a blob URL, return it directly
      if (previewImage.startsWith("blob:")) {
        return previewImage;
      }
      // Otherwise, treat it like a normal image path
      return getFullImageUrl(previewImage);
    }

    return getFullImageUrl(
      user.profile_image || user.profile_picture_url || null
    );
  };

  return (
    <Box sx={{ p: 4, maxWidth: "md", mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          My Profile
        </Typography>
        {!isEditing ? (
          <Button
            variant="contained"
            onClick={() => setIsEditing(true)}
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              Save
            </Button>
            <Button variant="outlined" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      <StyledPaper elevation={2}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ position: "relative", width: 128, height: 128 }}>
            <Avatar
              src={getAvatarSrc()}
              alt="Profile"
              sx={{ width: 128, height: 128 }}
            />
            {isEditing && (
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </Box>

        <Grid container spacing={3}>
          {Object.entries(formData).map(([key, value]) => {
            if (
              !user.is_provider &&
              ["services", "bio", "hourly_rate", "rating"].includes(key)
            )
              return null;
            if (
              ["profile_image", "google_id", "profile_picture_url"].includes(
                key
              )
            )
              return null;

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={key}>
                {isEditing ? (
                  <TextField
                    fullWidth
                    label={key.replace("_", " ").toUpperCase()}
                    name={key}
                    value={value}
                    onChange={handleChange}
                    variant="outlined"
                    multiline={key === "bio"}
                    rows={key === "bio" ? 4 : 1}
                  />
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase" }}
                    >
                      {key.replace("_", " ")}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {value || "Not set"}
                    </Typography>
                  </Box>
                )}
              </Grid>
            );
          })}
        </Grid>
      </StyledPaper>
    </Box>
  );
};

export default ProfilePage;
