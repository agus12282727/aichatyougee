# Z-5 X AI Chat

A modern, real-time AI chat application built with Next.js 15, TypeScript, and Tailwind CSS. Features streaming responses powered by the Z-5 X AI API.

## ✨ Features

- 🚀 **Real-time Streaming Responses** - Get instant AI responses as they're generated
- 💬 **Chat History Management** - Persistent chat sessions with localStorage
- 📱 **Mobile Responsive Design** - Works perfectly on all device sizes
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- ⚡ **Fast Performance** - Optimized for production with Next.js 15
- 🔧 **Session Management** - Reset sessions and regenerate responses
- 📋 **Message Actions** - Copy messages and regenerate responses

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **AI Integration**: Z-5 X API with streaming support

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/agus12282727/aichatyougee.git
   cd aichatyougee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Vercel will automatically detect the Next.js framework and deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 Configuration

The application uses the following configuration files:

- `vercel.json` - Vercel deployment settings
- `src/settings.json` - Application settings
- `next.config.ts` - Next.js configuration

## 📁 Project Structure

```
src/
├── app/
│   ├── api/ai-z5/        # AI API endpoint with streaming
│   ├── page.tsx          # Main chat interface
│   ├── layout.tsx        # App layout
│   ├── error.tsx         # Error page
│   └── not-found.tsx     # 404 page
├── components/ui/        # shadcn/ui components
└── settings.json         # App configuration
```

## 🤖 AI Integration

The app integrates with the Z-5 X AI API to provide:

- Real-time streaming responses
- Session-based conversations
- Context-aware responses
- Indonesian language support

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors during deployment:

1. Ensure you're using the latest commit
2. Check that all dependencies are installed
3. Verify the Node.js version (18+ recommended)

### Common Issues

- **Streaming not working**: Check API endpoint configuration
- **Chat history not saving**: Ensure localStorage is enabled
- **Mobile responsiveness**: Clear browser cache if needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js and Z-5 X AI**