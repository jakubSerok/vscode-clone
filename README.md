# VS Code Clone

A modern, web-based code editor inspired by Visual Studio Code, built with Next.js and TypeScript. This project provides a VS Code-like experience directly in your browser with features like file management, syntax highlighting, and more.

![VS Code Clone Screenshot](public/vscode-clone-screenshot.png)

## ✨ Features

- 🚀 Modern, responsive UI with VS Code-like interface
- 💾 Real-time code editing and file management
- 🌈 Syntax highlighting for multiple programming languages
- 🔍 File explorer and search functionality
- 📁 Multiple project templates to get started quickly
- 🔒 User authentication and project management
- ⚡ Built with Next.js 14 and TypeScript
- 🎨 Customizable theme (light/dark mode)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jakubSerok/vscode-clone.git
   cd vscode-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your environment variables:
   ```env
   DATABASE_URL=your_database_url
   NEXTAUTH_SECRET=your_nextauth_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: Prisma with PostgreSQL
- **Code Editor**: Monaco Editor
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **UI Components**: Radix UI

## 📁 Project Structure

```
.
├── app/                    # App router pages and layouts
├── components/             # Reusable UI components
├── modules/                # Feature-based modules
├── prisma/                 # Database schema and migrations
├── public/                 # Static files
└── vsclone-starters/       # Project templates
```

## 🚀 Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fvscode-clone)

1. Push your code to a GitHub repository
2. Import the project on Vercel
3. Add your environment variables
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [VS Code](https://code.visualstudio.com/) for the inspiration
- [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/) for the amazing framework and hosting
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
