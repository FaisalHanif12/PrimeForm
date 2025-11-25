⚖️ Primeform Project Rules & Instructions


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

