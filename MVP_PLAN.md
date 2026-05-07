# 📜 Payslip Web App MVP Plan

This document outlines the technical specifications, architecture, and feature set for the Payslip Web App MVP.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **UI Components:** shadcn-vue
- **State Management:** Pinia
- **Routing:** Vue Router

### Backend (BaaS)
- **Auth:** Supabase Auth
- **Database:** Supabase Database (PostgreSQL)
- **Storage:** Supabase Storage (PDF Hosting)

---

## 🎯 MVP Goal
A role-based payroll system designed to streamline the distribution of payslips and management of employee concerns.

### Roles & Permissions

#### **HR (Admin)**
- **Auth:** Login/Logout.
- **Employee Management:** Add, edit, or disable employee accounts.
- **Payroll Management:** Upload Excel files to batch-generate payslips.
- **Payslip Oversight:** View all generated payslips.
- **Support:** Manage and resolve employee concerns/comments.

#### **Employee (User)**
- **Auth:** Login/Logout.
- **Access:** View own payslips only.
- **Download:** Get PDF versions of payslips.
- **Feedback:** Submit concerns or comments regarding specific payslips.

---

## 🚀 Key Features

### 1. Authentication
- Secure email/password login via **Supabase Auth**.
- Role-based route protection (Middleware) to prevent unauthorized access.

### 2. Employee Management (HR Only)
- Dashboard to list all employees.
- Create new employee profiles (linking to Supabase Auth).
- Toggle employee status (Active/Disabled).

### 3. Payroll Upload & Processing
- **Excel Parser:** HR uploads a standard Excel file.
- **Validation:** System matches `employee_no` with existing records.
- **PDF Generation:** Automatically generate payslips based on Excel data.
- **Storage:** Upload generated PDFs to Supabase Storage (`payslips` bucket).
- **Records:** Save metadata (salary, deductions, etc.) to the `payslips` table.

### 4. Payslip Viewing
- Responsive table for employees to browse their history.
- Filtering by **Month** and **Year**.
- Secure "Download PDF" button using signed URLs.

### 5. Concern System
- **Employee:** Simple form to report discrepancies.
- **HR:** Notification/Inbox to track "Pending" vs "Resolved" concerns.

---

## 📊 Database Schema

### `profiles`
*Stores user identity and roles.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key (references auth.users.id) |
| `employee_no` | text | Unique employee identifier |
| `full_name` | text | Name of the employee |
| `email` | text | Unique email address |
| `role` | text | `hr` or `employee` |
| `status` | text | `active` or `disabled` |
| `created_at` | timestamp | Creation date |

### `payslips`
*Stores payroll numbers and PDF links.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `employee_id` | uuid | References `profiles.id` |
| `month` | text | e.g., "January" |
| `year` | integer | e.g., 2024 |
| `basic_salary` | numeric | Base pay |
| `allowances` | numeric | Sum of all additions |
| `deductions` | numeric | Sum of all subtractions |
| `net_salary` | numeric | Final take-home pay |
| `pdf_url` | text | Path to the PDF in Supabase Storage |
| `created_at` | timestamp | Date generated |

### `concerns`
*Stores communication between employees and HR.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `payslip_id` | uuid | References `payslips.id` |
| `employee_id` | uuid | References `profiles.id` |
| `message` | text | Content of the concern |
| `status` | text | `pending` or `resolved` |
| `created_at` | timestamp | Submission date |

---

## 📂 Storage Architecture
**Supabase Bucket:** `payslips`
- **Security:** Private bucket.
- **Access:** Only owners (employees) can access their own files via Signed URLs (generated server-side or via RLS-checked client calls).

---

## 📈 Data Flow: Excel Upload
1. **Upload:** HR selects `.xlsx` file.
2. **Parsing:** Client-side parsing (e.g., using `xlsx` library).
3. **Loop:** For each row:
   - Validate if `employee_no` exists.
   - Calculate totals.
   - Generate PDF (using `jspdf` or `html2pdf`).
   - Upload PDF to `payslips/{year}/{month}/{employee_no}.pdf`.
   - Insert row into `payslips` table.

### Suggested Excel Columns
`employee_no`, `month`, `year`, `basic_salary`, `allowances`, `deductions`, `net_salary`

---

## 🗺 Sitemap & Routing

| Path | Access | Page Purpose |
| :--- | :--- | :--- |
| `/login` | Public | Credentials entry |
| **HR Routes** | | |
| `/hr/dashboard` | HR | Stats & Overview |
| `/hr/employees` | HR | Management List |
| `/hr/upload` | HR | Payroll Processing |
| `/hr/concerns` | HR | Support Inbox |
| **Employee Routes** | | |
| `/employee/dashboard`| Employee | Recent Payslip & Announcements |
| `/employee/payslips` | Employee | Full History & Downloads |
| `/employee/concerns` | Employee | Submission History |

---

## 🎨 UI/UX Layout Design

### **HR Interface**
- **Sidebar:** Navigation to Dashboard, Employees, Upload, and Concerns.
- **Topbar:** Search bar, Role indicator, and Profile dropdown.
- **Upload Form:** Drag-and-drop zone for Excel files with a progress bar.

### **Employee Interface**
- **Simplified Dashboard:** Large card showing the "Latest Payslip" with a quick download button.
- **Payslip Table:** Clean list with "View" and "Download" actions.
- **Concern Form:** Modal-based form triggered from the payslip list.

---

## 🔒 Security Policy
- **RLS (Row Level Security):** 
  - `profiles`: Users can read their own; HR can read/write all.
  - `payslips`: Users can read where `employee_id = auth.uid()`; HR can read all.
  - `concerns`: Users can create/read their own; HR can read/update all.
- **Bucket Policy:** Prevent public access to PDFs. Use `supabase.storage.createSignedUrl`.
