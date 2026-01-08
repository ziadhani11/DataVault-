# DataVault AI Dashboard

A modern web-based data analytics platform that transforms your Excel and CSV files into beautiful, interactive dashboards powered by AI.

## ✨ Features

### 📊 Smart Data Visualization
- Upload Excel (.xlsx, .xls) and CSV files
- Automatic data parsing and analysis
- Multiple chart types: Bar, Line, Pie, and Area charts
- Interactive, responsive chart components

### 🤖 AI-Powered Chart Suggestions
- Intelligent analysis of your data structure
- Automatic dashboard generation based on data patterns
- AI recommends the most suitable chart types for your data
- One-click "Analyze Data" for manual AI suggestions

### 🎨 Modern UI/UX
- Clean, professional dark and light themes
- Glassmorphism design elements
- Smooth animations and transitions
- Fully responsive design for all devices

### 🔐 Secure & Private
- User authentication with email/password
- Row Level Security (RLS) on all data
- Each user can only access their own files and dashboards
- Secure file storage

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui components
- **Charts:** Recharts
- **Backend:** Supabase
- **AI:** Google Gemini for intelligent data analysis
- **File Parsing:** xlsx library

## 🚀 How It Works

1. **Sign Up / Sign In** - Create an account to get started
2. **Create a Dashboard** - Give your dashboard a name and optional description
3. **Upload Your Data** - Drop an Excel or CSV file into the upload zone
4. **AI Analysis** - The AI automatically analyzes your data and suggests optimal visualizations
5. **Customize** - Add, remove, or modify charts as needed
6. **Save & Share** - Your dashboards are saved automatically

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── CreateDashboardModal.tsx
│   ├── FileUploadZone.tsx
│   ├── ThemeToggle.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication logic
│   ├── useDashboards.ts # Dashboard CRUD operations
│   ├── useFileUpload.ts # File upload handling
│   └── useTheme.tsx    # Theme management
├── pages/              # Route components
│   ├── Auth.tsx        # Login/Signup page
│   ├── Dashboard.tsx   # Dashboard list view
│   ├── DashboardEditor.tsx # Dashboard editing view
│   └── Index.tsx       # Landing page
└── integrations/       # External service integrations
    └── supabase/       # Database client & types

supabase/
└── functions/
    └── suggest-charts/ # AI chart suggestion endpoint
```

## 🗄️ Database Schema

### Tables

- **profiles** - User profile information
- **dashboards** - Dashboard configurations with chart settings
- **uploaded_files** - Metadata for uploaded Excel/CSV files

### Storage

- **excel-files** - Secure bucket for uploaded spreadsheets

## 🎯 Key Features Explained

### AI Chart Suggestions
The platform uses Google Gemini to analyze your spreadsheet data:
- Examines column headers and data types
- Samples data rows to understand patterns
- Recommends appropriate chart types (bar for comparisons, line for trends, pie for proportions)
- Automatically maps data columns to chart axes

### Theme System
- Supports both dark and light modes
- Uses CSS custom properties for consistent theming
- Persists user preference in localStorage
- Smooth transitions between themes

## 📝 License

This project is private and proprietary.

---
<img width="1219" height="851" alt="image" src="https://github.com/user-attachments/assets/4c1339b2-bd56-4dae-9e5b-89e75f61ba59" />


