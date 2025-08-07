import { useState, useEffect } from "react";

import type { Task } from "./types/tasks";
import type { Pet } from "./types/pets";
import type { Vaccine } from "./types/vaccines";
import { createTask, getPets, getVaccines } from "./api";

type TaskFormData = {
  title: string;
  description: string;
  dateTime: string;
  repeatInterval: string;
  repeatUnit: "day" | "week" | "month" | "year" | "";
  selectedPetIds: number[];
};

interface TaskFormProps {
  readonly task?: Task; // For editing existing task
  readonly onTaskCreated?: () => void;
  readonly onTaskUpdated?: () => void;
}

export default function TaskForm({
  task,
  onTaskCreated,
  onTaskUpdated,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || "",
    description: task?.description || "",
    dateTime: task?.dateTime || new Date().toISOString().slice(0, 16),
    repeatInterval: task?.repeatInterval?.toString() || "",
    repeatUnit: (task?.repeatUnit as TaskFormData["repeatUnit"]) || "", // Cast to the correct type
    selectedPetIds: task?.petIds || [],
  });

  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVaccineSuggestions, setShowVaccineSuggestions] = useState(false);

  const repeatUnits = [
    { label: "Days", value: "day" },
    { label: "Weeks", value: "week" },
    { label: "Months", value: "month" },
    { label: "Years", value: "year" },
  ];

  useEffect(() => {
    fetchPets();
    fetchVaccines();
  }, []);

  const fetchPets = async () => {
    try {
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  const fetchVaccines = async () => {
    try {
      const fetchedVaccines = await getVaccines();
      setVaccines(fetchedVaccines);
    } catch (error) {
      console.error("Error fetching vaccines:", error);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      window.alert("Task title is required");
      return false;
    }
    if (!formData.description.trim()) {
      window.alert("Task description is required");
      return false;
    }
    if (!formData.dateTime) {
      window.alert("Date and time are required");
      return false;
    }
    if (formData.selectedPetIds.length === 0) {
      window.alert("Please select at least one pet");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const taskData: Omit<Task, "id"> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dateTime: formData.dateTime,
        repeatInterval: formData.repeatInterval
          ? parseInt(formData.repeatInterval)
          : undefined,
        repeatUnit: (formData.repeatUnit as Task["repeatUnit"]) || undefined,
        petIds: formData.selectedPetIds,
        attachments: [],

        // Add the missing required properties here with default values
        isCompleted: false, // Default to not completed
        priority: "medium", // Default to medium priority
        category: "other", // Default to a generic category
        isRecurring: formData.repeatInterval !== "", // Determine based on form input
        createdBy: 1, // Placeholder user ID
      };

      if (task?.id) {
        // Update logic
        window.alert("Task updated successfully!");
        onTaskUpdated?.();
      } else {
        // Create new task
        await createTask(taskData);
        window.alert("Task created successfully!");
        onTaskCreated?.();
      }
    } catch (error: any) {
      window.alert("Failed to save task: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const togglePetSelection = (petId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedPetIds: prev.selectedPetIds.includes(petId)
        ? prev.selectedPetIds.filter((id) => id !== petId)
        : [...prev.selectedPetIds, petId],
    }));
  };

  const getVaccineSuggestions = () => {
    const selectedPets = pets.filter((pet) =>
      formData.selectedPetIds.includes(pet.id!)
    );
    const suggestions: Vaccine[] = [];

    selectedPets.forEach((pet) => {
      vaccines.forEach((vaccine) => {
        if (
          vaccine.name
            .toLowerCase()
            .includes(pet.breedType?.toLowerCase() ?? "") ||
          vaccine.notes
            ?.toLowerCase()
            .includes(pet.breedType?.toLowerCase() ?? "")
        ) {
          suggestions.push(vaccine);
        }
      });
    });
    return suggestions.slice(0, 5);
  };

  const addVaccineToDescription = (vaccine: Vaccine) => {
    const currentDesc = formData.description;
    const vaccineText = `\n\nVaccine Suggestion: ${vaccine.name}\nNotes: ${vaccine.notes}`;
    setFormData((prev) => ({
      ...prev,
      description: currentDesc + vaccineText,
    }));
    setShowVaccineSuggestions(false);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: "center", color: "#333" }}>
        {task ? "Edit Task" : "Create New Task"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Task Title */}
        <label
          htmlFor="task-title"
          style={{ fontWeight: "600", color: "#333" }}
        >
          Task Title *
        </label>
        <input
          id="task-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
          style={{
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        {/* Task Description */}
        <label
          htmlFor="description"
          style={{ fontWeight: "600", color: "#333" }}
        >
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter task description"
          rows={4}
          style={{
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
            resize: "vertical",
          }}
        />

        {/* Date and Time */}
        <label
          htmlFor="Date-&-time"
          style={{ fontWeight: "600", color: "#333" }}
        >
          Date & Time *
        </label>
        <input
          id="Date-&-time"
          type="datetime-local"
          value={formData.dateTime}
          onChange={(e) =>
            setFormData({ ...formData, dateTime: e.target.value })
          }
          style={{
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        {/* Repeat Settings */}
        <label style={{ fontWeight: "600", color: "#333" }}>
          Repeat (Optional)
        </label>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="number"
            min={0}
            placeholder="Interval"
            value={formData.repeatInterval}
            onChange={(e) =>
              setFormData({ ...formData, repeatInterval: e.target.value })
            }
            style={{
              padding: 12,
              fontSize: 16,
              borderRadius: 8,
              border: "1px solid #ddd",
              width: 100,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {repeatUnits.map((unit) => (
              <button
                key={unit.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    repeatUnit: unit.value as TaskFormData["repeatUnit"],
                  })
                }
                type="button"
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  backgroundColor:
                    formData.repeatUnit === unit.value ? "#007AFF" : "white",
                  color: formData.repeatUnit === unit.value ? "white" : "#333",
                  cursor: "pointer",
                }}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pet Selection */}
        <label style={{ fontWeight: "600", color: "#333" }}>
          Select Pets *
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => togglePetSelection(pet.id!)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ddd",
                backgroundColor: formData.selectedPetIds.includes(pet.id!)
                  ? "#e3f2fd"
                  : "white",
                color: formData.selectedPetIds.includes(pet.id!)
                  ? "#2196f3"
                  : "#333",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {pet.name} ({pet.breed})
            </button>
          ))}
        </div>

        {/* Vaccine Suggestions */}
        {formData.selectedPetIds.length > 0 && (
          <div>
            <label style={{ fontWeight: "600", color: "#333" }}>
              Vaccine Suggestions
            </label>
            <button
              type="button"
              onClick={() => setShowVaccineSuggestions(!showVaccineSuggestions)}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#4CAF50",
                color: "white",
                fontWeight: "600",
                marginTop: 8,
                cursor: "pointer",
              }}
            >
              {showVaccineSuggestions ? "Hide" : "Show"} Vaccine Suggestions
            </button>

            {showVaccineSuggestions && (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  border: "1px solid #ddd",
                  marginTop: 8,
                }}
              >
                {getVaccineSuggestions().length === 0 ? (
                  <p
                    style={{
                      fontStyle: "italic",
                      color: "#666",
                      textAlign: "center",
                      padding: 16,
                    }}
                  >
                    No vaccine suggestions available
                  </p>
                ) : (
                  getVaccineSuggestions().map((vaccine, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addVaccineToDescription(vaccine)}
                      style={{
                        padding: 8,
                        borderBottom:
                          index < getVaccineSuggestions().length - 1
                            ? "1px solid #eee"
                            : "none",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ color: "#333" }}>{vaccine.name}</strong>
                      <p style={{ color: "#666", marginTop: 4 }}>
                        {vaccine.notes}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#007AFF",
            borderRadius: 8,
            padding: 15,
            color: "white",
            fontSize: 16,
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 20,
          }}
        >
          {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
        </button>
      </div>
    </div>
  );
}
