# Design Patterns Reference - Exercise Detail Page

## 🎨 Reusable Design Patterns

This document captures the design patterns used in the exercise detail page redesign. These patterns can be applied to other pages for consistency.

---

## 1. GLASSMORPHISM PATTERN

### Implementation
```typescript
// Card with glassmorphism
<LinearGradient
  colors={['rgba(26, 28, 36, 0.95)', 'rgba(18, 20, 26, 0.98)']}
  style={{
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadowStyle
  }}
>
  {/* Content */}
</LinearGradient>
```

### When to Use
- Premium cards that need depth
- Overlay elements
- Navigation components
- Modal backgrounds

### Key Properties
- **Background**: Semi-transparent dark gradient
- **Border**: White at 0.1 opacity
- **Shadow**: Platform-specific elevation
- **Blur**: Backdrop blur for glass effect

---

## 2. ICON CONTAINER PATTERN

### Implementation
```typescript
<View style={{
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
}}>
  <Ionicons name="icon-name" size={20} color={colors.primary} />
</View>
```

### Variants
- **Small**: 32x32 with 16px icon
- **Medium**: 36x36 with 20px icon
- **Large**: 40-56x56 with 24-32px icon
- **Hero**: 100x100 with 48px icon

### Color Schemes
- **Neutral**: White background at 0.05 opacity
- **Primary**: Green tint at 0.15 opacity
- **Warning**: Orange tint at 0.15 opacity
- **Danger**: Red tint at 0.15 opacity

---

## 3. GRADIENT PILL BADGE PATTERN

### Implementation
```typescript
<LinearGradient
  colors={['rgba(0, 201, 124, 0.2)', 'rgba(0, 201, 124, 0.05)']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  }}
>
  <View style={styles.dot} />
  <Text style={styles.text}>Label</Text>
  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
</LinearGradient>
```

### When to Use
- Tags and labels
- Status indicators
- Category badges
- Chip selections

### Elements
1. **Leading element**: Dot or icon
2. **Text**: Medium weight, 14px
3. **Trailing element**: Icon or count

---

## 4. STAT CARD PATTERN

### Implementation
```typescript
<LinearGradient
  colors={['rgba(0, 201, 124, 0.15)', 'rgba(0, 201, 124, 0.05)']}
  style={{
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
  }}
>
  {/* Icon Circle */}
  <View style={styles.iconBox}>
    <Ionicons name="time-outline" size={24} color={colors.primary} />
  </View>
  
  {/* Label */}
  <Text style={styles.label}>Duration</Text>
  
  {/* Value */}
  <Text style={styles.value}>10-15 min</Text>
</LinearGradient>
```

### Layout Structure
```
┌─────────────────┐
│   [Icon 40x40]  │
│                 │
│     LABEL       │
│                 │
│     VALUE       │
└─────────────────┘
```

### Color Variants
- **Primary**: Green tint for duration
- **Gold**: Orange tint for reps  
- **Danger**: Red tint for sets

---

## 5. SELECTION CARD PATTERN

### Implementation
```typescript
const isSelected = selectedItem === item.id;

<TouchableOpacity onPress={() => setSelectedItem(item.id)}>
  <LinearGradient
    colors={isSelected 
      ? [colors.primary, colors.primaryDark]
      : ['rgba(26, 28, 36, 0.8)', 'rgba(26, 28, 36, 0.6)']
    }
    style={styles.card}
  >
    {/* Glow Effect Layer (selected only) */}
    {isSelected && (
      <View style={[styles.glow, { backgroundColor: colors.primary }]} />
    )}
    
    {/* Content */}
    <View style={styles.content}>
      {/* ... */}
    </View>
    
    {/* Checkmark (selected only) */}
    {isSelected && (
      <Animated.View entering={ZoomIn}>
        <Ionicons name="checkmark-circle" size={28} color="white" />
      </Animated.View>
    )}
    
    {/* Accent Border (selected only) */}
    {isSelected && (
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
    )}
  </LinearGradient>
</TouchableOpacity>
```

### States
- **Unselected**: Dark glass background, muted colors
- **Selected**: Colored gradient, white text, checkmark, accent bar

---

## 6. SECTION HEADER PATTERN

### Implementation
```typescript
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
}}>
  {/* Left: Icon + Title */}
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <View style={styles.iconBox}>
      <Ionicons name="icon" size={20} color={colors.primary} />
    </View>
    <Text style={styles.title}>Section Title</Text>
  </View>
  
  {/* Right: Badge or Action */}
  <View style={styles.badge}>
    <Text style={styles.badgeText}>3</Text>
  </View>
</View>
```

### Purpose
- Clearly label sections
- Provide context with icons
- Show counts or actions

---

## 7. FLOATING ACTION BUTTON PATTERN

### Implementation
```typescript
<Animated.View 
  entering={SlideInLeft.delay(800).springify()}
  style={{
    position: 'absolute',
    bottom: insets.bottom + 20,
    left: 20,
    right: 20,
    zIndex: 100,
  }}
>
  <TouchableOpacity>
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 28,
        borderRadius: 24,
        minHeight: 64,
      }}
    >
      {/* Left: Icon + Text */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Ionicons name="play-circle" size={28} color="white" />
        <Text style={styles.text}>Start Workout</Text>
      </View>
      
      {/* Right: Arrow Badge */}
      <View style={styles.arrowBadge}>
        <Ionicons name="arrow-forward" size={22} color="white" />
      </View>
    </LinearGradient>
  </TouchableOpacity>
</Animated.View>
```

### Best Practices
- Fixed at bottom above safe area
- Primary gradient background
- Strong shadow with color glow
- Min height 64px for easy tapping
- Animated entrance with delay

---

## 8. VIDEO PLAYER PATTERN

### Implementation
```typescript
<View style={styles.videoCard}>
  <LinearGradient
    colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)']}
    style={styles.container}
  >
    <Video
      source={{ uri: videoUrl }}
      style={styles.video}
      useNativeControls={isPlaying}
      isLooping
      shouldPlay={isPlaying}
    />
    
    {!isPlaying && (
      <TouchableOpacity style={styles.overlay} onPress={() => setIsPlaying(true)}>
        {/* Play Button */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.playButton}
        >
          <Ionicons name="play" size={40} color="white" />
        </LinearGradient>
        
        {/* HD Badge */}
        <View style={styles.hdBadge}>
          <Ionicons name="videocam" size={14} color="white" />
          <Text>HD</Text>
        </View>
      </TouchableOpacity>
    )}
    
    {/* Info Bar */}
    <View style={styles.infoBar}>
      <View style={styles.infoItem}>
        <Ionicons name="time-outline" size={14} color="white" />
        <Text>2:30</Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="eye-outline" size={14} color="white" />
        <Text>12.5K</Text>
      </View>
    </View>
  </LinearGradient>
</View>
```

### Features
- Dark overlay when paused
- Large gradient play button
- HD quality badge
- Info bar with metadata
- Smooth state transitions

---

## 9. TIP CARD PATTERN

### Implementation
```typescript
<Animated.View entering={SlideInRight.delay(50 * index).springify()}>
  <View style={{
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  }}>
    {/* Icon */}
    <View style={styles.iconContainer}>
      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
    </View>
    
    {/* Text */}
    <Text style={{
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 22,
      flex: 1,
    }}>
      {tipText}
    </Text>
  </View>
</Animated.View>
```

### When to Use
- Pro tips
- Instructions
- Features list
- Step-by-step guides

---

## 10. HERO CARD PATTERN

### Implementation
```typescript
<View style={styles.heroCard}>
  <LinearGradient
    colors={['rgba(26, 28, 36, 0.95)', 'rgba(18, 20, 26, 0.98)']}
    style={styles.gradient}
  >
    {/* Background Patterns */}
    <View style={styles.patterns}>
      <View style={[styles.circle, { top: -20, right: -20 }]} />
      <View style={[styles.circle, { bottom: -30, left: -30 }]} />
    </View>
    
    {/* Icon */}
    <View style={styles.iconContainer}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.iconGradient}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </LinearGradient>
    </View>
    
    {/* Title */}
    <Text style={styles.title}>{title}</Text>
    
    {/* Stats Row */}
    <View style={styles.statsRow}>
      {stats.map(stat => (
        <View style={styles.stat}>
          <Ionicons name={stat.icon} size={18} color={stat.color} />
          <Text>{stat.value}</Text>
        </View>
      ))}
    </View>
  </LinearGradient>
</View>
```

### Purpose
- Feature primary content
- Draw immediate attention
- Provide quick overview
- Set visual tone

---

## 📐 SPACING STANDARDS

### Card Padding
```typescript
const cardPadding = {
  small: 12,    // Compact cards
  medium: 16,   // Standard cards
  large: 20,    // Section cards
  hero: 28,     // Hero/featured cards
};
```

### Gaps
```typescript
const gaps = {
  tight: 6,     // Related items (icon + text)
  close: 10,    // Pills, tags
  standard: 16, // Cards in grid
  relaxed: 20,  // Between sections
  spacious: 28, // Major sections
};
```

### Border Radius
```typescript
const borderRadius = {
  small: 8,     // Small elements
  medium: 12,   // Standard cards
  large: 16,    // Large cards
  extraLarge: 24, // Hero cards
  pill: 999,    // Fully rounded
};
```

---

## 🎨 COLOR APPLICATION

### Primary Actions
- **Background**: Gradient from primary to primaryDark
- **Text**: White
- **Border**: White at 0.2 opacity
- **Shadow**: Primary color with glow

### Secondary Elements
- **Background**: Dark glass `rgba(26, 28, 36, 0.8)`
- **Text**: Muted gray
- **Border**: White at 0.1 opacity
- **Shadow**: Black with elevation

### Status Colors
```typescript
const statusColors = {
  success: '#00C97C',   // Green
  warning: '#FFB800',   // Orange
  error: '#FF3B30',     // Red
  info: '#3B82F6',      // Blue
};
```

---

## 🎭 ANIMATION GUIDELINES

### Entrance Animations
```typescript
// Fade from direction
FadeInUp.delay(100).springify()
FadeInDown.delay(100).springify()
SlideInLeft.delay(100).springify()
SlideInRight.delay(100).springify()

// Scale
ZoomIn.delay(100).springify()

// Stagger timing
items.map((item, index) => (
  <Animated.View entering={FadeInUp.delay(100 + index * 50)}>
    {/* ... */}
  </Animated.View>
))
```

### Interactive Animations
```typescript
// Selection
ZoomIn.springify()

// State change
withSpring(value, {
  damping: 15,
  stiffness: 100,
})
```

### Timing
- **Fast**: 100-200ms (small elements)
- **Medium**: 300-400ms (cards)
- **Slow**: 500-800ms (major transitions)
- **Stagger**: 50-100ms per item

---

## 📱 RESPONSIVE CONSIDERATIONS

### Touch Targets
```typescript
const touchTargets = {
  minimum: 44,  // iOS standard
  comfortable: 56,
  large: 64,    // Primary actions
};
```

### Safe Areas
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

// Apply to fixed elements
{
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
}
```

### Platform-specific
```typescript
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  android: {
    elevation: 8,
  },
})
```

---

## ✅ CHECKLIST FOR NEW COMPONENTS

When creating new components following these patterns:

- [ ] Use glassmorphism for premium feel
- [ ] Include proper shadows/elevation
- [ ] Add entrance animations
- [ ] Support both light/dark modes (if applicable)
- [ ] Include interactive states (pressed, disabled)
- [ ] Follow spacing standards
- [ ] Use color system consistently
- [ ] Ensure 44px minimum touch targets
- [ ] Add platform-specific optimizations
- [ ] Test on multiple screen sizes
- [ ] Verify animations are smooth (60fps)
- [ ] Check safe area handling

---

## 🎯 USAGE SUMMARY

These patterns provide:
1. **Consistency**: Same look and feel across app
2. **Efficiency**: Copy-paste reusable code
3. **Quality**: Premium, tested designs
4. **Flexibility**: Easy to customize colors/sizes
5. **Performance**: Optimized for smooth animations

**Apply these patterns to create a cohesive, premium app experience!** 🚀

