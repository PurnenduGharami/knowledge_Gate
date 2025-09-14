# **KNOWLEDGE GATE**

**“One gate, many minds. Organize, compare, and create without limits.”** 

KnowledgeGate is an open-source AI research assistant that unifies multiple models into one platform. It solves bias, subscription unfairness, and workflow chaos with a fair credit system and project-based organization.

### Demo Link: https://knowledgegate-2xy85.web.app/

#### Disclaimer: This is just a demo version. Many features available in the main app are not included here. In this demo, you can only use free AI models, and some of them may not work properly. To experience the full version, please download and install the complete app.
Note: There is a known bug — if the app doesn’t open right away, simply refresh the page and it should work.

## Table of Contents
- [My Story](#my-story)  
- [What is KnowledgeGate?](#what-is-knowledgegate)  
- [Technology Stack](#technology-stack)  
- [File Structure (Simplified Overview)](#file-structure-simplified-overview)  
- [Data Flow (How It Works)](#data-flow-how-it-works)  
- [Getting Started](#getting-started)  
- [Future Plans](#future-plans)  
- [License](#license)  
- [Final Thoughts](#final-thoughts)  

---

## My Story

After completing my HSC and before joining Sharda University, I had a few months of free time.  
During that period, I saw people building incredible things with AI. I’ve never respected the idea of *“vibe coding”*—writing code without purpose—but I’ve always respected AI as a tool. I believe AI won’t replace us, but *those who know how to use AI will*.  

I wanted to work on something real, not just tutorials. And I noticed a set of problems with how AI is used today:

- **Bias & Censorship**: Every AI is shaped by its training data, corporate policies, and even government restrictions. Depending on the model, you might get filtered or incomplete answers.  
- **Unfair Subscription Models**: Most platforms lock users into expensive monthly plans. But AI usage isn’t steady—some months you might use a lot, other months almost none. Paying the same regardless is not fair.  
- **Disorganized Workflows**: Most AI chat platforms give you one endless scroll of chats. For research or projects, this quickly becomes unmanageable.  
- **Vendor Lock-In**: If you want to try a new model, you usually have to pay extra or switch platforms. APIs are more flexible, but not everyone can use them.  

I first built a technical prototype called **VOS**, which solved some of these problems but was too complex for everyday users. That’s when I challenged myself to build something better—**a user-focused project that connects normal people with the world’s most powerful AI models in a fair and organized way.**

That project became **KnowledgeGate**.  

This was the most ambitious project I’ve ever done. I faced imposter syndrome (“is this even useful?”), countless bugs, and the fear that no one would care. But when I saw a celebrity later launch a product with a similar idea, I didn’t regret not releasing mine—I felt validated. It proved I wasn’t solving a “dumb problem.”  

Today, as a first-year CSE student at Sharda, I know I still have much to learn. But this project taught me more than any tutorial could. While I can’t keep developing it full-time, I don’t want it to collect dust. That’s why I’m releasing it as an **open-source foundation**. You can take the code, improve it, or use it as a base for solving these problems at scale.

---

## What is KnowledgeGate?

**KnowledgeGate** is a full-stack web application that acts as a “gateway” to multiple AI models. Instead of locking you into one provider, it lets you query, compare, and organize results across different models—all within structured, project-based workflows.  

✨ **Key Highlights**  
- 🔄 **Multi-Model Access** – Compare results from OpenAI, Anthropic, Google, and others via OpenRouter API.  
- 📊 **Advanced Modes** – Multi-Source, Summary, Conflict Check, Standard, and Custom modes for flexible research.  
- ⚡ **Chaos Sparks** – A fair pay-as-you-go credit system, calculated server-side.  
- 📁 **Project-Based Workflows** – Organize searches, chats, and results into persistent projects.  
- 🌐 **Offline-First + Firebase Sync** – Works offline for guests, with seamless migration when signing up.  
- 🛠 **Transparent Development** – Includes a detailed `JOURNEY.md` log documenting the entire build process.  

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (React, App Router)  
- **Language**: [TypeScript](https://www.typescriptlang.org/)  
- **AI Integration**: [Genkit for Firebase](https://firebase.google.com/docs/genkit) + Server Actions  
- **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore) & [Firebase Authentication](https://firebase.google.com/docs/auth)  
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)  
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)  
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)  

---

## File Structure (Simplified Overview)

- `src/app/` → Routing & pages (Next.js App Router)  
- `src/components/` → Reusable UI components (search, profile, history, projects, chat)  
- `src/hooks/` → Custom React hooks for chat, model selection, etc.  
- `src/ai/` → Server Actions & Genkit flows for AI queries  
- `src/contexts/` → Global AppContext (auth, projects, history, credits)  
- `src/firebase/` → Firebase setup & config  
- `src/utils/` → Helpers (credits calculation, OpenRouter fetch, export, localStorage)  

---

## Data Flow (How It Works)

1. User types a query & selects a mode.  
2. Models are selected via `getModelsForMode()`.  
3. Server Action securely calls OpenRouter API.  
4. Cost is calculated server-side into **Chaos Sparks**.  
5. Result is displayed & saved to history.  
6. Data persists in localStorage (guests) or Firestore (authenticated users).  

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/knowledgegate.git
cd knowledgegate
npm install
```
2. Environment Setup
```
Copy .env.example → .env

Add your Firebase & OpenRouter keys
```
3. Firestore Security Rules
```
Deploy the rules from firestore.rules using Firebase CLI or console.
```
4. Run Development Server
```
npm run dev
App runs at http://localhost:9002
```

## Future Plans
While I can’t actively continue development right now, KnowledgeGate could evolve into:

🔗 Collaborative Projects (multi-user research)

🖼 Multi-Modal Models (text, images, audio)

📈 Analytics Dashboard (usage + spending insights)

## License
This project is open-source under the MIT License.

## Final Thoughts
KnowledgeGate isn’t just code—it’s the story of how I used my curiosity, free time, and passion for solving problems to build something meaningful. It may not be perfect, but it represents the best work of my life so far, and I hope others can build on it.

### 👉 See the full development journey here: <a href="https://github.com/PurnenduGharami/knowledgeGate/blob/main/journey.md">Journey.md</a>
