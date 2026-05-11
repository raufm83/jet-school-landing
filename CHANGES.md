# Team Multilingual Fields Migration

This document summarizes all changes made to migrate Team model fields (name, surname, fullName) from single-language strings to multilingual (MultilingualText) format.

## Date
2024

## Overview
Migrated Team model's `name`, `surname`, and `fullName` fields from `String` to `MultilingualText` type to support both Azerbaijani (AZ) and Russian (RU) languages.

## Backend Changes

### 1. Prisma Schema (`api/prisma/schema.prisma`)
- Changed `Team.name` from `String` to `MultilingualText`
- Changed `Team.surname` from `String` to `MultilingualText`
- Changed `Team.fullName` from `String` to `MultilingualText`

### 2. Team Service (`api/src/team/team.service.ts`)

#### Create Method
- Updated to construct `fullName` as multilingual object:
  ```typescript
  const fullName = {
    az: `${createTeamDto.name.az} ${createTeamDto.surname.az}`,
    ru: `${createTeamDto.name.ru} ${createTeamDto.surname.ru}`,
  };
  ```

#### Update Method
- Fixed `fullName` construction to properly handle multilingual fields:
  ```typescript
  if (rest.name || rest.surname) {
    const name = rest.name || existingTeam.name;
    const surname = rest.surname || existingTeam.surname;
    const nameAz = typeof name === 'string' ? name : name.az;
    const nameRu = typeof name === 'string' ? name : name.ru;
    const surnameAz = typeof surname === 'string' ? surname : surname.az;
    const surnameRu = typeof surname === 'string' ? surname : surname.ru;
    updateData.fullName = {
      az: `${nameAz} ${surnameAz}`,
      ru: `${nameRu} ${surnameRu}`,
    };
  }
  ```

### 3. DTOs (`api/src/team/dto/`)
- `CreateTeamDto`: Already updated to accept `name` and `surname` as objects
- `UpdateTeamDto`: Inherits from `CreateTeamDto` (PartialType)

## Frontend Changes

### 1. Type Definitions (`client/src/types/team.ts`)

#### Added MultilingualText Interface
```typescript
interface MultilingualText {
  az: string;
  ru: string;
}
```

#### Updated Interfaces
- **TeamMember**: Changed `name`, `surname`, and `fullName` from `string` to `MultilingualText`
- **TeamMemberFormInputs**: Changed `name` and `surname` from `string` to `MultilingualText`
- **CourseTeacherAsMember**: Updated `fullName` to `MultilingualText`
- **CourseTeacherRole.courses[].teacher**: Updated `fullName` to `MultilingualText`

### 2. Form Component (`client/src/components/views/dashboard/team/team-member-form.tsx`)

#### Changes
- Replaced single `name` input with two inputs:
  - `name.az` (Ad AZ)
  - `name.ru` (Ad RU)
- Replaced single `surname` input with two inputs:
  - `surname.az` (Soyad AZ)
  - `surname.ru` (Soyad RU)
- Updated validation to use nested field paths (`name.az`, `name.ru`, etc.)
- Updated error handling to display errors for each language field

### 3. Create Page (`client/src/app/dashboard/team/create/page.tsx`)

#### Changes
- Updated FormData construction to use bracket notation:
  ```typescript
  formData.append("name[az]", data.name.az);
  formData.append("name[ru]", data.name.ru);
  formData.append("surname[az]", data.surname.az);
  formData.append("surname[ru]", data.surname.ru);
  ```
- Removed manual `fullName` construction (now handled by backend)

### 4. Edit Page (`client/src/app/dashboard/team/edit/[id]/page.tsx`)

#### Changes
- Updated FormData construction to use bracket notation (same as create page)
- Removed manual `fullName` construction (now handled by backend)

### 5. Display Components

#### Team Member Card (`client/src/components/views/landing/about/team-member-card.tsx`)
- Updated to handle multilingual `fullName`:
  ```typescript
  const fullNameObj = "teacher" in member ? member.teacher.fullName : member.fullName;
  const fullName = typeof fullNameObj === 'string' ? fullNameObj : fullNameObj[locale];
  ```
- Displays name based on current locale

#### Team Section (`client/src/components/views/landing/about/team-section.tsx`)
- Changed key from `teamMember.fullName` to `teamMember.id` (since fullName is now an object)

#### Teachers Modal (`client/src/components/views/dashboard/courses/teachers-modal.tsx`)
- Updated to display `fullName.az` in dashboard:
  ```typescript
  <p className="font-medium">{typeof member.fullName === 'string' ? member.fullName : member.fullName.az}</p>
  ```

#### Team Dashboard Page (`client/src/app/dashboard/team/page.tsx`)
- Updated `renderCell` function to display `fullName.az`:
  - Image alt text: Uses `fullName.az`
  - FullName cell: Displays `fullName.az`

#### Teacher Roles Page (`client/src/app/dashboard/teacher-roles/page.tsx`)
- Updated to display `fullName.az`:
  ```typescript
  {typeof assignment.teacher.fullName === 'string' ? assignment.teacher.fullName : assignment.teacher.fullName.az}
  ```

## Migration Notes

### Backward Compatibility
- The update method includes type checking to handle both string (legacy) and object (new) formats
- Display components check if `fullName` is a string or object before accessing properties

### FormData Format
- Multilingual fields are sent using bracket notation: `field[az]`, `field[ru]`
- This matches the pattern used in other multilingual forms (courses, posts, etc.)

### Database Migration
- Existing records in the database will need to be migrated
- The Prisma schema change requires a migration to update existing data structure
- Consider creating a migration script to convert existing string values to MultilingualText format

## Testing Checklist

- [ ] Create new team member with both AZ and RU names
- [ ] Edit existing team member and update names
- [ ] Verify fullName is correctly constructed on backend
- [ ] Check team member display on landing page (locale-based)
- [ ] Verify dashboard displays show AZ version correctly
- [ ] Test form validation for all language fields
- [ ] Verify image upload still works correctly

## Files Modified

### Backend
- `api/prisma/schema.prisma`
- `api/src/team/team.service.ts`
- `api/src/team/dto/create-team.dto.ts` (already updated by user)
- `api/src/team/dto/update-team.dto.ts` (already updated by user)

### Frontend
- `client/src/types/team.ts`
- `client/src/components/views/dashboard/team/team-member-form.tsx`
- `client/src/app/dashboard/team/create/page.tsx`
- `client/src/app/dashboard/team/edit/[id]/page.tsx`
- `client/src/components/views/landing/about/team-member-card.tsx`
- `client/src/components/views/landing/about/team-section.tsx`
- `client/src/components/views/dashboard/courses/teachers-modal.tsx`
- `client/src/app/dashboard/team/page.tsx`
- `client/src/app/dashboard/teacher-roles/page.tsx`

## Notes
- All changes maintain backward compatibility where possible
- Dashboard views default to Azerbaijani (AZ) language
- Landing page views use locale-based selection
- Form validation ensures both language fields are required

