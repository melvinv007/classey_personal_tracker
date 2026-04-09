# 🚀 Classey — Complete Setup Guide

This guide walks you through everything needed to run Classey from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js 20+** installed ([download](https://nodejs.org/))
- **pnpm** package manager (`npm install -g pnpm`)
- **Git** for version control
- A **Telegram account** (for notifications)
- 10-15 minutes of setup time

---

## Step 1: Clone & Install Dependencies

```bash
# Navigate to your project folder
cd C:\Melvin\Coding\Final-tracker-app\classey

# Install all dependencies (already done, but run if needed)
pnpm install
```

---

## Step 2: Configure Environment Variables

Open `.env.local` and update these values:

### 2.1 Set Your Password
```env
APP_PASSWORD=YourSecurePasswordHere
```
Choose a strong password — this protects your entire app.

### 2.2 Generate Auth Cookie Secret
Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it:
```env
AUTH_COOKIE_SECRET=paste_the_64_character_hex_here
```

### 2.3 Get Groq API Key (Free)
1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up / Log in
3. Go to **API Keys** → Create new key
4. Copy and paste:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

### 2.4 Get Google AI API Key (Free — Backup)
1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Sign in with Google
3. Click **Get API Key** → Create key
4. Copy and paste:
```env
GOOGLE_AI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.5 Create Telegram Bot (Optional — for notifications)
1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Choose a name (e.g., "Classey Notifications")
4. Choose a username (e.g., "classey_notify_bot")
5. Copy the token and paste:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
```

---

## Step 3: Verify Appwrite Setup

Your Appwrite is already configured. Verify the collections exist:

1. Go to [Appwrite Console](https://cloud.appwrite.io/)
2. Open project: **tracker-final-mvt**
3. Go to **Databases** → **tracker-1-mvt**
4. You should see 23 collections

If collections are missing, run:
```bash
npx tsx scripts/setup-appwrite.ts
```

---

## Step 4: Start the Development Server

```bash
pnpm dev
```

The app will start at: **http://localhost:3000**

---

## Step 5: First-Time Login

1. Open http://localhost:3000
2. You'll see the password screen
3. Enter the password you set in `APP_PASSWORD`
4. Click **Unlock** (or press Enter)
5. You're in! 🎉

---

## Step 6: Create Your First Semester

1. On the home page, click **"Create Semester"**
2. Fill in:
   - **Name**: e.g., "Semester 6"
   - **Status**: "Ongoing" (for current semester)
   - **Start/End Dates**: Your semester dates
   - **Color**: Pick your favorite accent color
3. Click **Create**

---

## Step 7: Add Subjects

1. Click on your semester card
2. Click **"Add Subject"**
3. Fill in:
   - **Name**: e.g., "Data Structures"
   - **Short Name**: e.g., "DSA"
   - **Credits**: Number of credits
   - **Type**: Theory / Lab / Elective
   - **Attendance Required**: e.g., 75%
4. Repeat for all subjects

---

## Step 8: Setup Telegram Notifications (Optional)

1. Go to **Settings** (gear icon in dock)
2. Click **Notifications** tab
3. **Get Your Chat ID**:
   - Message your bot on Telegram (say "hi")
   - Go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `"chat":{"id":123456789}` — that number is your Chat ID
4. Enter the Chat ID in Settings
5. Click **Verify** — you should receive a test message
6. Enable notification types you want (exams, tasks, etc.)

---

## Step 9: Explore Features

### 📚 Dashboard
- View all semesters
- Today's classes and attendance suggestions
- Quick stats

### 📅 Calendar (`/calendar`)
- Week/Month view of all classes, exams, events
- Click to mark attendance

### ✅ Tasks (`/tasks`)
- Create and manage to-dos
- Filter by priority, subject, status

### 📁 Files (`/files`)
- Upload study materials
- Link to subjects/exams
- View/download/delete

### 📊 Analytics
- `/analytics/cgpa` — CGPA tracker and what-if calculator
- `/tools/attendance-calculator` — Bunk planner

### 🤖 AI Chat
- Click the floating chat bubble (bottom-right)
- Ask about your schedule, attendance, study tips
- Create exams/tasks via natural language

### ⌨️ Global Search
- Press `Ctrl+K` or `Cmd+K` anywhere
- Search subjects, exams, tasks, files, notes

---

## Step 10: Deploy to Vercel (Production)

When ready to deploy:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com/)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy!

Update `.env.local` (or Vercel env vars):
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## 🔧 Troubleshooting

### "Password incorrect" but I'm sure it's right
- Check `.env.local` has no quotes around the password
- Restart the dev server after changing `.env.local`

### AI chat says "limit reached"
- Free tier: 50 requests/day
- Resets at midnight IST
- Wait or get a paid Groq account

### Files not uploading
- Check file size (max 10MB)
- Check file type (PDF, images, code files allowed)
- Verify Appwrite bucket exists

### Telegram not working
- Verify bot token is correct
- Make sure you messaged the bot first
- Check chat ID is numeric

---

## 📱 Using on Mobile

Classey is fully responsive:
1. Open the same URL on your phone browser
2. Add to home screen for app-like experience:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

---

## 🎉 You're All Set!

Start tracking your semester:
1. Add your subjects
2. Create your class schedule
3. Mark attendance daily
4. Add exams and tasks
5. Let Classey help you stay on track!

Need help? Check the AI chat or ask Copilot.

---

## 🔧 Optional: Advanced Features

These features require additional Appwrite Console configuration:

### Web Push Notifications
1. In Appwrite Console → Messaging → Enable
2. Configure VAPID keys for web push
3. Add service worker for push subscriptions
4. Users can then enable push in Settings

### Auto-Absent Marking (Scheduled)
1. In Appwrite Console → Functions → Create Function
2. Name: `auto-absent-marker`
3. Runtime: Node.js 20
4. Schedule: `0 * * * *` (every hour)
5. Code handles marking unattended classes as absent after 48h

### Realtime Updates
1. Enable Realtime in Appwrite Console
2. Configure collection permissions for realtime access
3. App will auto-subscribe for live UI updates

These are enhancements — the app works fully without them.
