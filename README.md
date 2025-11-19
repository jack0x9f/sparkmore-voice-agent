# 🎙️ Sparkmore AI Voice Agent

A conversational AI voice agent built with Vapi.ai that can send emails and WhatsApp messages through natural voice interaction.

## ✨ Features

- **🎤 Voice Interaction**: Natural conversational AI powered by GPT-4 and Vapi.ai
- **📧 Email Automation**: Send emails through voice commands
- **💬 WhatsApp Integration**: Send WhatsApp messages via n8n workflows
- **🔐 Secure Access**: Protected demo routes with rotating access codes
- **📊 Action Logging**: Real-time tracking of all AI actions
- **💾 Supabase Backend**: Database and Edge Functions for processing
- **🎨 Modern UI**: Built with React, TypeScript, and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Vapi.ai account
- n8n instance (for email/WhatsApp workflows)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jack0x9f/sparkmore-voice-agent.git
   cd sparkmore-voice-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the project root:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Vapi Configuration
   VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
   ```

4. **Set up the database:**
   
   Run the SQL script in your Supabase SQL Editor:
   ```bash
   # Copy the contents of COMBINED_MIGRATIONS.sql
   # Paste and execute in Supabase Dashboard → SQL Editor
   ```

5. **Configure Supabase Edge Function secrets:**
   ```bash
   # In your Supabase project dashboard:
   # Settings → Edge Functions → Secrets
   
   OPENAI_API_KEY=your-openai-api-key
   N8N_EMAIL_WEBHOOK=your-n8n-email-webhook-url
   N8N_WHATSAPP_WEBHOOK=your-n8n-whatsapp-webhook-url
   ```

6. **Deploy the Edge Function:**
   ```bash
   npx supabase functions deploy ai-agent
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

8. **Access the application:**
   - Landing page: `http://localhost:8080/`
   - Demo login: `http://localhost:8080/demo-login`
   - Voice agent: `http://localhost:8080/voice-agent` (requires login)

## 📖 Usage

### For End Users

1. Go to `/demo-login`
2. Enter access code (e.g., `TEST123`)
3. Click the green "AI" button
4. Click "Start Voice Call"
5. Allow microphone access
6. Start talking to the AI!

**Example commands:**
- "Send an email to john@example.com"
- "Send a WhatsApp message to +1234567890"

### For Developers

See detailed setup guides:
- **[SETUP_VAPI_KEY.md](./SETUP_VAPI_KEY.md)** - Configure Vapi public key
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to production
- **[n8n-workflows/README.md](./n8n-workflows/README.md)** - Set up automation workflows

## 🏗️ Project Structure

```
sparkmore-voice-agent/
├── src/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── DemoLogin.tsx          # Access code login
│   │   ├── Demo.tsx               # Demo page with AI button
│   │   ├── VoiceAgentDemo.tsx     # Voice agent interface
│   │   └── ...
│   ├── components/
│   │   ├── VapiVoiceAssistant.tsx # Vapi integration
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/
│   │   └── useDemoSession.ts      # Session management
│   └── integrations/
│       └── supabase/              # Supabase client
├── supabase/
│   ├── functions/
│   │   └── ai-agent/              # Edge Function for AI logic
│   └── migrations/                # Database migrations
├── n8n-workflows/                 # Email & WhatsApp workflows
└── public/                        # Static assets
```

## 🔑 Access Codes

Generate access codes in Supabase SQL Editor:

```sql
SELECT public.generate_rotating_access_code();
```

Default test codes:
- `TEST123`
- `DEMO`

## 🌐 Deployment

### Deploy to Vercel (Recommended)

```bash
npm run build
npm install -g vercel
vercel --prod
```

Then add environment variables in Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPI_PUBLIC_KEY`

### Deploy to Netlify

```bash
npm run build
npm install -g netlify-cli
netlify deploy --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Voice AI**: Vapi.ai, OpenAI GPT-4
- **Backend**: Supabase (Database + Edge Functions)
- **Automation**: n8n (Email & WhatsApp workflows)
- **Deployment**: Vercel, Netlify, or custom VPS

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_VAPI_PUBLIC_KEY` | Vapi public API key | Yes |

## 🔒 Security

- ✅ Environment variables never committed to git
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Access code validation for demo routes
- ✅ Secure session management
- ✅ API keys stored in Supabase secrets

## 🐛 Troubleshooting

### "Missing Authorization Header" error
- Make sure `VITE_VAPI_PUBLIC_KEY` is set in `.env.local`
- Restart the dev server after changing environment variables

### "Access verification failed"
- Ensure database migrations are applied
- Check that `validate_rotating_access_code_secure` function exists

### Voice agent WebSocket fails
- Check if VPN is blocking WebSocket connections
- Try disabling VPN or adding `*.vapi.ai` and `*.daily.co` to exceptions

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

- [Vapi.ai](https://vapi.ai) - Voice AI platform
- [Supabase](https://supabase.com) - Backend infrastructure
- [n8n](https://n8n.io) - Workflow automation
- [shadcn/ui](https://ui.shadcn.com) - UI components

## 📧 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ for Sparkmore AI**
