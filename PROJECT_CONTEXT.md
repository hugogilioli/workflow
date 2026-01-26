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


# WorkFlow — Restart Script (for a new chat) + Updated Project Context

Use this message to start a NEW chat and restore full context instantly.
Copy/paste everything below into the first message of the new chat.

---

## 0) What this project is

**WorkFlow** is an internal web system to create, manage, export, and delete **Material Requests** for field operations.
- No external approvals
- No pricing/money
- The system UI is **English (US)**
- We (chat) speak Portuguese, but app labels are English (US)

Goal: fast request creation from a **Material Catalog** (checkbox + qty), export **premium Excel** with logo, and simple auth + admin user management.

Repo: (add your GitHub URL here)

---

## 1) Current Stack (must keep)

- Next.js 16 (App Router / Server Components / Server Actions)
- Tailwind CSS + shadcn/ui
- Prisma v7 + SQLite (dev.db)
- Prisma client generated into `src/generated/prisma`
- Adapter: `@prisma/adapter-better-sqlite3` + `better-sqlite3`
- Excel exports via `exceljs`
- Seed execution via `tsx`
- Auth via NextAuth/Auth.js v5 + Credentials provider (email + password)
- Sessions: JWT strategy

---

## 2) Important decisions already made

- Use **Prisma v7 config**: datasource URL is in `prisma.config.ts` (not schema)
- Prisma client import is from `src/generated/prisma/client` (NOT `@prisma/client`)
- Export routes must run in **Node runtime** (`export const runtime = "nodejs"`)
- Materials deletion: **hard delete** allowed only if not used in any request items
- Requests deletion: hard delete request (cascade deletes items via request relation)
- Request items status updates to **COMPLETE** when Excel is generated
- UI style: “premium enterprise”, subtle green accent (not neon-heavy), badge green for COMPLETE
- Request header has subtle green underline under requestCode

---

## 3) Database Model (Prisma)

### Enums
```prisma
enum ItemStatus {
  PENDING
  PICKED_UP
  COMPLETE
}

enum UserRole {
  ADMIN
  USER
}
