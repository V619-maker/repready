# RepReady

**Practice the hardest sales conversations before they happen live.**

RepReady is an AI-powered B2B sales negotiation simulator that helps sales professionals master objection handling and negotiation tactics in a zero-risk environment.

![RepReady Landing](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)

## Features

### 🎯 AI-Powered Personas
- **Richard** (VP Procurement) - 5-star difficulty, aggressive negotiator with 20 years of experience
- **Sandra** (IT Director) - 4-star difficulty, polite but always has blockers

### 📊 Real-Time Scoring
- Dynamic Deal Health Score (0-100) that evaluates YOUR negotiation tactics
- Score drops for bad behaviors (offering discounts early, apologizing for price)
- Score rises for good behaviors (discovery questions, holding firm on price)
- Instant feedback explaining what you did right or wrong

### 📝 Performance Scorecards
- AI-generated performance reviews after each session
- Strengths and areas for improvement
- Key learning moments highlighted

### 🏢 Enterprise Features
- Email-gated access with 3 free sessions
- Session history tracking
- Team access request system
- Privacy-compliant with GDPR, CCPA, and DPDP Act 2023

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes with streaming responses
- **AI**: Google Gemini 2.5 Flash via Vercel AI SDK
- **Database**: MongoDB
- **Styling**: Glass-morphism design, dark enterprise theme

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/V619-maker/repready.git
cd repready
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=repready
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*
```

4. Run the development server:
```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/negotiate` | POST | Stream AI negotiation responses |
| `/api/scorecard` | POST | Generate performance scorecard |
| `/api/register` | POST | Register user email |
| `/api/user` | GET | Get user data |
| `/api/user/session` | POST | Increment session count |
| `/api/sessions` | GET/POST | Manage session history |
| `/api/request-access` | POST | Request team access |

## Scoring Logic

The AI evaluates the **sales rep's behavior**, not the persona's responses:

### Score Drops (Bad Behavior)
- Offering discount before establishing value → 15-25
- Apologizing for price → 20-30
- Offering free implementation unprompted → -20 points
- Immediately agreeing to demands → -15 points

### Score Rises (Good Behavior)
- Asking discovery questions before pitching → 65-75
- Holding firm on price when challenged → 70-80
- Reframing conversation to value/ROI → +15 points
- Professional pushback on demands → +10 points

## License

MIT License - see LICENSE file for details.

## Contact

For support or inquiries: vrushalkitke123@gmail.com
