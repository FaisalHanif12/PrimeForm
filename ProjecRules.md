⚖️ Primeform Project Rules & Instructions

🎨 Design & Theme

Background: A very deep navy blue to black gradient.

Text/Accents: Golden gradient (from soft gold → bright yellow gold) giving a glowing elite vibe.

Input Fields & Buttons: Transparent / glassmorphism style with subtle navy overlays and glowing edges.

Extra Elements:

Logo & headers: Silver → White gradient (metallic).

Links (“Forgot Password?”): Golden text (not gradient, just flat gold).

⚡ In short → It’s Navy Blue + Black for background, with Golden gradient accents, mixed with a glassmorphism style for inputs/buttons.


Animations: Must be integrated in UI (React Native Reanimated + Lottie). Exercise demos always animated, not static.

🛠️ Technology

Frontend (Mobile App): React Native (Expo or bare).

Backend (API): Node.js + Express.js.

Database: MongoDB Atlas.

State Management: Redux Toolkit / Context API.

Animations: React Native Reanimated + Lottie.

📐 Development Rules

Always follow the Navy + Golden theme across all screens.

Keep frontend component-driven: reusable UI blocks, scalable pages, hooks/services for logic.

Backend must follow MVC principles:

Controllers handle logic.

Routes handle endpoints.

Schemas define data structure.

Middleware for authentication/validation.

Configurations always isolated (DB, env, constants).

Performance first → optimize queries, animations, API calls.

All exercise demonstrations must be delivered as animations or video loops.

🗂️ Project Directory Structure
📱 Frontend (React Native)
primeform-frontend/
│── assets/               # Images, fonts, animations (Lottie JSONs)
│── src/
│   ├── components/       # Reusable UI components (Buttons, Cards, Inputs)
│   │    ├── Button.js
│   │    ├── ExerciseCard.js
│   │    └── ProgressChart.js
│   │
│   ├── pages/            # Screens (Login, Home, Workout, Diet, Profile)
│   │    ├── HomeScreen.js
│   │    ├── WorkoutScreen.js
│   │    ├── DietScreen.js
│   │    └── ProfileScreen.js
│   │
│   ├── services/         # API calls (Axios/fetch)
│   │    ├── authService.js
│   │    ├── workoutService.js
│   │    └── dietService.js
│   │
│   ├── hooks/            # Custom hooks (useAuth, useWorkout, useTheme)
│   │    └── useAuth.js
│   │
│   ├── store/            # Redux setup (slices, actions)
│   │    ├── index.js
│   │    └── userSlice.js
│   │
│   ├── navigation/       # React Navigation setup
│   │    ├── AppNavigator.js
│   │    └── BottomTabs.js
│   │
│   ├── theme/            # Theme constants (colors, fonts, spacing)
│   │    └── colors.js
│   │
│   └── App.js            # Main entry file
│
└── package.json

🌐 Backend (Node.js + Express.js + MongoDB)
primeform-backend/
│── config/
│   └── db.config.js        # MongoDB connection
│
│── controllers/            # Route logic
│   ├── authController.js
│   ├── workoutController.js
│   └── dietController.js
│
│── routes/                 # API endpoints
│   ├── authRoutes.js
│   ├── workoutRoutes.js
│   └── dietRoutes.js
│
│── models/                 # MongoDB schemas
│   ├── User.js
│   ├── Workout.js
│   └── Diet.js
│
│── middleware/             # Auth, validation, error handling
│   ├── authMiddleware.js
│   └── errorMiddleware.js
│
│── utils/                  # Helpers (token generator, validators)
│   └── token.js
│
│── server.js               # Express server entry
│── .env                    # Environment variables
└── package.json



Design Approach

Use animations wherever possible to make UI dynamic and modern.

For exercise demonstrations, always use animated demos or motion graphics (Lottie/3D models/videos).

Keep navigation smooth & intuitive (bottom tabs, stack navigators).

Stick to minimalist UI with elite feel → no clutter, big spacing, glowing effects.