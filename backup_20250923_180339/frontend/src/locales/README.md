# PawfectPal Localization Files

This directory contains all localization files for the PawfectPal application, supporting both English (en) and Hebrew (he) languages.

## File Structure

### Main Localization Files
- **`en.ts`** - English localization (main language)
- **`he.ts`** - Hebrew localization (עברית)

### Specialized Localization Files
- **`breeds.ts`** - Pet breeds and types localization
- **`priorities.ts`** - Task priority levels and related terms
- **`taskEditing.ts`** - Task editing interface localization
- **`petEditing.ts`** - Pet editing interface localization
- **`index.ts`** - Main export file for all localizations

## Usage

### Basic Usage
```typescript
import { en, he } from '@/locales';

// Use English
const saveButton = en.common.save; // "Save"

// Use Hebrew
const saveButtonHe = he.common.save; // "שמור"
```

### Using Specialized Localizations
```typescript
import { breeds, priorities, taskEditing, petEditing } from '@/locales';

// Pet breeds
const labradorEn = breeds.en.dog.labrador; // "Labrador Retriever"
const labradorHe = breeds.he.dog.labrador; // "לברדור רטריבר"

// Task priorities
const highPriorityEn = priorities.en.high; // "High"
const highPriorityHe = priorities.he.high; // "גבוהה"

// Task editing
const editTaskEn = taskEditing.en.editTask; // "Edit Task"
const editTaskHe = taskEditing.he.editTask; // "ערוך משימה"

// Pet editing
const editPetEn = petEditing.en.editPet; // "Edit Pet"
const editPetHe = petEditing.he.editPet; // "ערוך חיית מחמד"
```

### Dynamic Language Selection
```typescript
import { en, he } from '@/locales';

const currentLanguage = 'he'; // or 'en'
const locales = { en, he };
const t = locales[currentLanguage];

const saveButton = t.common.save;
```

## Localization Structure

### Common Terms (`common`)
Basic UI elements used throughout the application:
- `save`, `cancel`, `delete`, `edit`, `add`
- `loading`, `error`, `success`, `warning`
- `search`, `filter`, `sort`, `view`

### Navigation (`navigation`)
Main navigation elements:
- `dashboard`, `pets`, `tasks`, `settings`
- `profile`, `logout`

### Pets (`pets`)
Pet-related terms:
- Basic info: `name`, `type`, `breed`, `age`, `weight`
- Medical: `healthIssues`, `behaviorIssues`
- Actions: `addPet`, `editPet`, `deletePet`

### Tasks (`tasks`)
Task management terms:
- Basic info: `title`, `description`, `dueDate`
- Status: `pending`, `completed`, `overdue`
- Priority: `low`, `medium`, `high`, `urgent`

### Breeds (`breeds`)
Comprehensive pet breed information:
- **Dogs**: Labrador, Golden Retriever, German Shepherd, etc.
- **Cats**: Persian, Siamese, Maine Coon, etc.
- **Other animals**: Birds, rabbits, fish, reptiles, small animals
- Size categories and working groups

### Priorities (`priorities`)
Task priority system:
- Priority levels with descriptions
- UI elements (colors, icons)
- Management and filtering options
- Notification settings

### Task Editing (`taskEditing`)
Task editing interface:
- Form fields and validation
- Actions and messages
- Sections and options
- History and permissions

### Pet Editing (`petEditing`)
Pet editing interface:
- Form fields and validation
- Actions and messages
- Health and behavior sections
- Photo and document management

## Adding New Localizations

### 1. Add to Main Files
Add new keys to both `en.ts` and `he.ts`:

```typescript
// In en.ts
export const en = {
  // ... existing code ...
  newSection: {
    newKey: 'New Value',
  },
};

// In he.ts
export const he = {
  // ... existing code ...
  newSection: {
    newKey: 'ערך חדש',
  },
};
```

### 2. Create Specialized Files
For domain-specific terms, create new files:

```typescript
// newFeature.ts
export const newFeature = {
  en: {
    title: 'New Feature',
    description: 'Description in English',
  },
  he: {
    title: 'תכונה חדשה',
    description: 'תיאור בעברית',
  },
};

export default newFeature;
```

### 3. Update Index File
Add exports to `index.ts`:

```typescript
export { default as newFeature } from './newFeature';
export * from './newFeature';
```

## Best Practices

### 1. Consistent Naming
- Use camelCase for keys
- Group related terms in objects
- Use descriptive, clear names

### 2. Complete Coverage
- Always provide both English and Hebrew translations
- Include all UI elements, messages, and validation text
- Consider cultural differences and context

### 3. Maintainability
- Keep related terms together
- Use consistent structure across files
- Document any special formatting or variables

### 4. Testing
- Test both languages in the UI
- Verify text fits in UI components
- Check for missing translations

## Variables and Interpolation

For dynamic content, use placeholders:

```typescript
// In localization files
{
  welcomeMessage: 'Welcome, {name}!',
  petCount: 'You have {count} pets',
}

// In components
const message = t.welcomeMessage.replace('{name}', userName);
const petMessage = t.petCount.replace('{count}', petCount.toString());
```

## RTL Support

Hebrew is a right-to-left (RTL) language. The application automatically handles RTL layout when Hebrew is selected. Ensure all text and UI elements work correctly in both directions.

## Contributing

When adding new features or modifying existing ones:

1. **Update both languages** - Never add English without Hebrew
2. **Follow the structure** - Use existing patterns and organization
3. **Test thoroughly** - Verify translations work in the UI
4. **Document changes** - Update this README if needed

## Support

For questions about localization or adding new languages:
- Check existing files for patterns
- Ensure consistency with current structure
- Test both languages thoroughly
- Consider cultural context and appropriateness

