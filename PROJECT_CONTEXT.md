# WorkFlow — Project Context

## 1. Project Overview

**System name:** WorkFlow  

**Purpose:**  
Internal web system for **creating, managing, exporting, and deleting Material Requests**, designed to **simplify operational workflows** for field teams when picking up materials.

**Key characteristics:**
- Not B2B
- No external approval workflow
- No financial values
- Internal / operational use
- Focused on speed, clarity, and reliability

**System language:** English (US)  
**Conversation language:** Portuguese (Brazil)

---

## 2. Technology Stack

### Frontend
- **Next.js 16 (App Router)**
- **React Server Components**
- **Tailwind CSS**
- **shadcn/ui**
- Clean, professional UI with future support for subtle neon accents

### Backend
- **Prisma ORM v7**
- **SQLite (development)**  
  > Planned migration to PostgreSQL for production

### Supporting Libraries
- **exceljs** — Excel file generation
- **tsx** — Prisma seed execution
- **Prisma Studio** — database inspection

---

## 3. Architecture Overview

- Next.js App Router (`src/app`)
- Server Components by default
- Client Components only when strictly required (e.g., confirmation dialogs)
- Server Actions for mutations
- Route Handlers (`route.ts`) for exports (Excel / future PDF)

---

## 4. Data Modeling (Prisma)

### Material
Base catalog of available materials.

Fields:
- `id`
- `sapPn` (SAP Part Number)
- `name`
- `description` (optional)
- `unit` (optional)
- `isActive` (boolean)

---

### MaterialRequest
Represents a material request.

Fields:
- `id`
- `requestCode` (e.g. WF-000001)
- `projectSite`
- `requestedBy`
- `teamId` (optional)
- `date`
- `createdAt`
- Relationship with `MaterialRequestItem`

---

### MaterialRequestItem
Individual items inside a request.

Fields:
- `id`
- `requestId`
- `materialId`
- `itemNumber`
- `quantity`
- `notes` (optional)
- `status`

**Enum `ItemStatus`:**
```prisma
PENDING
PICKED_UP
COMPLETE
