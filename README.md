# Todo Task Management Application

## Overview

A modern, full-featured Todo/Task Management Application built with Next.js 16, TypeScript, and SQLite. This application provides users with a powerful and intuitive way to organize tasks, manage deadlines, and track productivity with a clean, responsive interface.

## Key Features

- **Task Management**: Create, edit, delete, and organize tasks with rich metadata including descriptions, due dates, priorities, and time estimates
- **Lists Organization**: Organize tasks into customizable lists with colors and emojis
- **Labels System**: Categorize tasks with multiple color-coded labels
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Recurring Tasks**: Set up tasks that repeat on configurable schedules
- **Reminders**: Track task reminders with triggered status
- **Activity Logging**: Complete audit trail of all task changes and interactions
- **Multiple Views**: Today, Week, Upcoming, and All Tasks views
- **Search**: Fast command-palette search for tasks and lists
- **Dark Mode**: Full theme support with light and dark modes
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Database**: SQLite (better-sqlite3)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI + Tailwind CSS 4
- **Animations**: Framer Motion
- **Runtime**: Bun
- **Testing**: Vitest + React Testing Library

## Prerequisites

- **Bun** v1.0 or higher (https://bun.sh)
- **Node.js** v18 or higher (for development tools)
- **macOS, Linux, or Windows** with WSL

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-minimax-m2-1
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up the database**
   ```bash
   # The database will be automatically created at data/todo.db
   # No additional setup required
   ```

4. **Configure environment variables (optional)**
   ```bash
   # Create a .env.local file if you need to override defaults
   DATABASE_PATH=./data/todo.db
   ```

5. **Start the development server**
   ```bash
   bun dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start the development server |
| `bun build` | Build the application for production |
| `bun start` | Start the production server |
| `bun lint` | Run ESLint for code quality |
| `bun test` | Run component tests |
| `bun test:db` | Run database operation tests |
| `bun type-check` | Check TypeScript types |

## Project Structure

```
todo-minimax-m2-1/
├── .github/
│   └── workflows/          # CI/CD configuration
├── data/                   # SQLite database files
├── public/                 # Static assets (images, icons)
├── scripts/                # Utility scripts
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── actions/        # Server actions for data mutations
│   │   ├── api/            # API routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   ├── lists/          # List management components
│   │   ├── tasks/          # Task-related components
│   │   ├── ui/             # Reusable UI components
│   │   ├── views/          # View-specific components
│   │   └── __tests__/      # Component tests
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core libraries and utilities
│   │   ├── constants/      # Application constants
│   │   ├── db/             # Database schema and operations
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── validators/     # Form validation schemas
│   ├── store/              # Zustand state stores
│   └── styles/             # Global styles
├── bunfig.toml            # Bun configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Project dependencies
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Database Schema

The application uses SQLite with the following main tables:

- **lists** - Task lists with colors and emojis
- **tasks** - Task items with full metadata
- **labels** - Categorical labels for tasks
- **task_labels** - Many-to-many relationship between tasks and labels
- **subtasks** - Hierarchical subtasks
- **task_reminders** - Reminder scheduling
- **task_logs** - Activity audit trail

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request`

For major changes, please open an issue first to discuss what you would like to change.

## Issues

Found a bug or have a feature request? Please open an issue on the repository:

1. Check if the issue already exists
2. Create a new issue with a clear description
3. Include steps to reproduce (for bugs)
4. Add screenshots if applicable

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) - Fast SQLite3 binding
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

Built with ❤️ using Next.js, TypeScript, and Bun
