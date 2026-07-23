import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import { Phone as PhoneIcon, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const STORAGE_KEY = "pawfectPal_emergencyContacts";
// Settings.tsx used to store a fixed {primaryVet, emergencyVet, petSitter}
// shape under this key — read it once to migrate existing users' data into
// the new customizable list, then leave it alone (Settings.tsx no longer
// writes emergencyContacts here).
const LEGACY_PREFS_KEY = "pawfectPal_preferences";
const MAX_CONTACTS = 5;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadContacts(): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    /* fall through to migration */
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const ec = legacy?.emergencyContacts;
      if (ec) {
        const migrated: EmergencyContact[] = [];
        const addIfPresent = (entry: unknown, relationship: string) => {
          if (entry && typeof entry === "object") {
            const { name, phone } = entry as { name?: string; phone?: string };
            if (name || phone) {
              migrated.push({ id: makeId(), name: name || "", phone: phone || "", relationship });
            }
          }
        };
        addIfPresent(ec.primaryVet, "Veterinarian");
        addIfPresent(ec.emergencyVet, "Emergency Vet");
        addIfPresent(ec.petSitter, "Pet Caregiver");
        return migrated;
      }
    }
  } catch {
    /* ignore, start empty */
  }

  return [];
}

export const EmergencyContacts: React.FC = () => {
  const { t } = useLocalization();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    setContacts(loadContacts());
  }, []);

  const persist = (next: EmergencyContact[]) => {
    setContacts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateField = (id: string, field: keyof Omit<EmergencyContact, "id">, value: string) => {
    persist(contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addContact = () => {
    if (contacts.length >= MAX_CONTACTS) return;
    persist([...contacts, { id: makeId(), name: "", phone: "", relationship: "" }]);
  };

  const removeContact = (id: string) => {
    persist(contacts.filter((c) => c.id !== id));
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PhoneIcon color="primary" />
            <Typography variant="h6">{t("profile.emergencyContacts")}</Typography>
          </Box>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("profile.emergencyContactsSubtitle")}
        </Typography>

        {contacts.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
            {t("profile.noContactsYet")}
          </Typography>
        )}

        <Stack spacing={2}>
          {contacts.map((contact) => (
            <Box
              key={contact.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" },
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                size="small"
                label={t("profile.relationship")}
                value={contact.relationship}
                onChange={(e) => updateField(contact.id, "relationship", e.target.value)}
                placeholder={t("profile.relationshipPlaceholder")}
              />
              <TextField
                fullWidth
                size="small"
                label={t("settings.contactName")}
                value={contact.name}
                onChange={(e) => updateField(contact.id, "name", e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label={t("settings.contactPhone")}
                value={contact.phone}
                onChange={(e) => updateField(contact.id, "phone", e.target.value)}
                placeholder={t("settings.phonePlaceholder")}
              />
              <IconButton
                aria-label={t("profile.removeContact")}
                color="error"
                onClick={() => removeContact(contact.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addContact}
            disabled={contacts.length >= MAX_CONTACTS}
          >
            {t("profile.addContact")}
          </Button>
          {contacts.length >= MAX_CONTACTS && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
              {t("profile.maxContactsReached")}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmergencyContacts;
