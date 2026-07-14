import { type FieldErrors, Controller, type Control } from "react-hook-form";
import { TextField, Grid } from "@mui/material";
import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";
import { IssuesList } from "./IssuesList";
import { useLocalization } from "../../contexts/LocalizationContext";

interface PetMedicalInfoProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  isSubmitting?: boolean;
}

export const PetMedicalInfo = ({
  control,
  errors,
  isSubmitting = false,
}: PetMedicalInfoProps) => {
  const { t } = useLocalization();

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="healthIssues"
          control={control}
          render={({ field }) => (
            <IssuesList
              label={t('pets.healthIssues')}
              placeholder={t('pets.enterHealthIssue')}
              value={field.value || []}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={!!errors.healthIssues}
              helperText={errors.healthIssues?.message || t('pets.addHealthConditions')}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="behaviorIssues"
          control={control}
          render={({ field }) => (
            <IssuesList
              label={t('pets.behaviorIssues')}
              placeholder={t('pets.enterBehaviorIssue')}
              value={field.value || []}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={!!errors.behaviorIssues}
              helperText={errors.behaviorIssues?.message || t('pets.addBehavioralConcerns')}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={4}
              label={t('pets.additionalNotes')}
              placeholder={t('pets.anyOtherImportantInfo')}
              error={!!errors.notes}
              helperText={errors.notes?.message || t('pets.includeOtherRelevant')}
              disabled={isSubmitting}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PetMedicalInfo;
