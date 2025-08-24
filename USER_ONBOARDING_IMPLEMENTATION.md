# 🚀 PrimeForm User Onboarding & Profile System

## 📋 Overview

This document outlines the complete implementation of the user onboarding and profile management system for PrimeForm. The system collects essential user information to provide personalized diet and workout plans.

## 🎯 User Flow

```
New User Signup → Dashboard → Onboarding Modal → User Info Collection → Profile Storage → Profile Display
```

### Detailed Flow:
1. **New User**: Signs up and navigates to dashboard
2. **Dashboard Modal**: Shows "Are you ready for AI driven questions to personalize your diet and exercise?"
3. **User Choice**:
   - **Start**: Opens UserInfoModal to collect information
   - **Cancel**: Modal won't appear on dashboard again, but will appear on Workout/Diet pages
4. **Information Collection**: 4-step form collecting user details
5. **Profile Storage**: Data saved to AsyncStorage (frontend) and database (backend)
6. **Profile Access**: Users can view/edit profile via sidebar menu

## 🏗️ Architecture

### Frontend Components
- **OnboardingModal**: Initial permission request modal
- **UserInfoModal**: Multi-step information collection form
- **ProfilePage**: Profile display and editing interface
- **Sidebar**: Navigation menu with profile access

### Backend Components
- **UserProfile Model**: MongoDB schema for user profile data
- **UserProfile Controller**: API endpoints for CRUD operations
- **UserProfile Routes**: RESTful API routing

## 📱 Frontend Implementation

### 1. OnboardingModal Component
**Location**: `Frontend/PrimeForm/src/components/OnboardingModal.tsx`

**Features**:
- Beautiful glassmorphism design with PrimeForm branding
- Animated entrance with spring animations
- "Start" and "Cancel" buttons with custom styling
- Responsive design with proper spacing

**Usage**:
```tsx
<OnboardingModal
  visible={showOnboarding}
  onStart={handleStartOnboarding}
  onCancel={handleCancelOnboarding}
  title={t('onboarding.title')}
  description={t('onboarding.description')}
/>
```

### 2. UserInfoModal Component
**Location**: `Frontend/PrimeForm/src/components/UserInfoModal.tsx`

**Features**:
- 4-step progressive form
- Step-by-step navigation with progress bar
- Form validation for required fields
- Beautiful input styling with pickers and text inputs

**Steps**:
1. **Basic Information**: Country, Age, Gender
2. **Physical Information**: Height, Weight, Goals
3. **Lifestyle & Health**: Medical conditions, Occupation, Equipment
4. **Diet Preferences**: Vegetarian/Non-vegetarian options

**Data Fields**:
```typescript
interface UserInfo {
  country: string;           // Required
  age: string;              // Required
  gender: string;           // Required
  height: string;           // Required
  currentWeight: string;    // Required
  goalWeight: string;       // Optional
  bodyGoal: string;         // Required
  medicalConditions: string; // Optional
  occupationType: string;   // Optional
  availableEquipment: string; // Optional
  dietPreference: string;   // Optional
}
```

### 3. ProfilePage Component
**Location**: `Frontend/PrimeForm/src/components/ProfilePage.tsx`

**Features**:
- Display all collected user information
- Edit mode for updating profile data
- Sectioned layout (Basic, Physical, Lifestyle, Diet)
- Empty state with "Complete Profile" button

**Usage**:
```tsx
<ProfilePage
  visible={showProfilePage}
  onClose={() => setShowProfilePage(false)}
  userInfo={userInfo}
  onUpdateUserInfo={handleUpdateUserInfo}
/>
```

### 4. Integration Points

#### Dashboard Integration
- **Location**: `Frontend/PrimeForm/app/(dashboard)/index.tsx`
- **Features**:
  - Shows onboarding modal for new users
  - Integrates UserInfoModal for data collection
  - Integrates ProfilePage for profile access
  - Handles sidebar menu actions

#### Workout Page Integration
- **Location**: `Frontend/PrimeForm/app/(dashboard)/workout.tsx`
- **Features**:
  - Shows onboarding modal if dashboard was cancelled
  - Integrates UserInfoModal for data collection
  - Loads existing user info from storage

#### Diet Page Integration
- **Location**: `Frontend/PrimeForm/app/(dashboard)/diet.tsx`
- **Features**:
  - Shows onboarding modal if dashboard was cancelled
  - Integrates UserInfoModal for data collection
  - Loads existing user info from storage

## 🔧 Backend Implementation

### 1. UserProfile Model
**Location**: `Backend/models/UserProfile.js`

**Schema**:
```javascript
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  country: { type: String, required: true },
  age: { type: Number, required: true, min: 13, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  height: { type: String, required: true },
  currentWeight: { type: String, required: true },
  goalWeight: { type: String },
  bodyGoal: { type: String, enum: ['Lose Fat', 'Gain Muscle', 'Maintain Weight', 'General Training', 'Improve Fitness'], required: true },
  medicalConditions: { type: String, default: '' },
  occupationType: { type: String, enum: ['Sedentary Desk Job', 'Active Job', 'Shift Worker', 'Student', 'Retired', 'Other'] },
  availableEquipment: { type: String, enum: ['None', 'Basic Dumbbells', 'Resistance Bands', 'Home Gym', 'Full Gym Access'] },
  dietPreference: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Flexitarian', 'Pescatarian'] },
  isProfileComplete: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });
```

**Features**:
- Automatic `isProfileComplete` calculation
- Age validation (13-120 years)
- Enum validation for categorical fields
- Timestamps for tracking changes

### 2. UserProfile Controller
**Location**: `Backend/controllers/userProfileController.js`

**Endpoints**:
- `getUserProfile()`: Retrieve user profile
- `createOrUpdateProfile()`: Create or update profile
- `updateProfileField()`: Update specific field
- `deleteProfile()`: Delete user profile
- `checkProfileCompletion()`: Check completion status

**Features**:
- Input validation for required fields
- Age conversion and validation
- Upsert functionality (create if not exists, update if exists)
- Error handling with meaningful messages

### 3. UserProfile Routes
**Location**: `Backend/routes/userProfileRoutes.js`

**API Endpoints**:
- `GET /api/user-profile`: Get user profile
- `POST /api/user-profile`: Create/update profile
- `PATCH /api/user-profile/field`: Update specific field
- `DELETE /api/user-profile`: Delete profile
- `GET /api/user-profile/completion`: Check completion status

**Security**:
- All routes protected by `authMiddleware`
- JWT token validation required
- User ID extracted from authenticated request

## 🗄️ Data Storage

### Frontend Storage (AsyncStorage)
**Keys**:
- `primeform_dashboard_onboarding_seen`: Tracks dashboard onboarding status
- `primeform_workout_onboarding_seen`: Tracks workout page onboarding status
- `primeform_diet_onboarding_seen`: Tracks diet page onboarding status
- `primeform_user_info`: Stores collected user information

**Status Values**:
- `'started'`: User clicked "Start"
- `'cancelled'`: User clicked "Cancel"
- `undefined/null`: User hasn't seen modal yet

### Backend Storage (MongoDB)
**Collection**: `userprofiles`
**Indexes**: 
- `userId` (unique, required)
- Automatic timestamps

## 🎨 UI/UX Features

### Design System
- **Colors**: Consistent with PrimeForm theme
- **Typography**: Custom font families for headings and body text
- **Spacing**: Systematic spacing scale
- **Animations**: Smooth transitions and micro-interactions

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Adaptive layouts**: Adjusts to different screen sizes
- **Touch-friendly**: Proper touch targets and spacing

### Accessibility
- **Screen reader support**: Proper labels and descriptions
- **Keyboard navigation**: Tab order and focus management
- **Color contrast**: WCAG compliant color combinations

## 🧪 Testing

### Frontend Testing
- Component rendering tests
- User interaction tests
- Form validation tests
- Navigation flow tests

### Backend Testing
**Test Script**: `Backend/test-user-profile.js`

**Test Coverage**:
- ✅ Create Profile
- ✅ Get Profile
- ✅ Update Profile Field
- ✅ Check Profile Completion
- ✅ Delete Profile

**Running Tests**:
```bash
cd Backend
node test-user-profile.js
```

## 🚀 Deployment

### Frontend
1. Build the React Native app
2. Deploy to app stores (iOS/Android)
3. Test onboarding flow on real devices

### Backend
1. Deploy to cloud platform (AWS, Heroku, etc.)
2. Set environment variables
3. Connect to production MongoDB instance
4. Test API endpoints

## 📊 Monitoring & Analytics

### Frontend Metrics
- Onboarding completion rates
- Step-by-step drop-off rates
- Profile completion rates
- User engagement with profile features

### Backend Metrics
- API endpoint usage
- Response times
- Error rates
- Database performance

## 🔮 Future Enhancements

### Planned Features
1. **AI Integration**: Use collected data for personalized recommendations
2. **Progress Tracking**: Monitor user progress over time
3. **Social Features**: Share goals and achievements
4. **Advanced Analytics**: Detailed insights and reporting

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Offline Support**: Better offline data handling
3. **Performance**: Lazy loading and optimization
4. **Security**: Enhanced authentication and authorization

## 🐛 Troubleshooting

### Common Issues

#### Frontend Issues
1. **Modal not showing**: Check AsyncStorage values and state
2. **Form validation errors**: Verify required field values
3. **Navigation issues**: Check route configuration

#### Backend Issues
1. **Authentication errors**: Verify JWT token and middleware
2. **Validation errors**: Check input data format
3. **Database errors**: Verify MongoDB connection and schema

### Debug Steps
1. Check browser/device console for errors
2. Verify API endpoint responses
3. Check database connection and data
4. Validate AsyncStorage values

## 📚 API Documentation

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

### Request/Response Formats
All endpoints return consistent JSON format:
```json
{
  "success": true/false,
  "data": {...},
  "message": "Success/error message"
}
```

### Error Handling
HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `500`: Internal Server Error

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run development servers
5. Test onboarding flow

### Code Standards
- Follow existing code style
- Add proper TypeScript types
- Include error handling
- Write comprehensive tests
- Update documentation

## 📞 Support

For technical support or questions:
- Check this documentation
- Review code comments
- Test with provided test scripts
- Create detailed issue reports

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: ✅ Complete & Ready for Production
