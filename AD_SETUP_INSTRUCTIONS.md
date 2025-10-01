# AdMob Setup Instructions

## Overview
Your app now has AdMob integration with banner and interstitial ads. Here's what has been implemented:

### ✅ What's Done
1. **AdMob Configuration**: Added AdMob settings to `capacitor.config.ts` with test ad IDs
2. **Banner Ads**: Added to key pages (Games, Profile, History)
3. **Interstitial Ads**: Added to game session page (every 3 rounds + navigation)
4. **Ad Components**: Created reusable `AdBanner` and `InterstitialAd` components

### 📱 Ad Placement
- **Banner Ads**: Bottom of Games, Profile, and History pages
- **Interstitial Ads**: 
  - Every 3 rounds completed in game sessions
  - When navigating back from game sessions

### 🔧 Current Configuration
- **Test Mode**: Currently using Google's test ad IDs
- **Platforms**: Android and iOS support
- **Ad Types**: Banner and Interstitial ads

## 🚀 Next Steps for Production

### 1. Get Real AdMob Ad Unit IDs
1. Go to [Google AdMob Console](https://admob.google.com/)
2. Create a new app or select your existing app
3. Create ad units:
   - **Banner Ad Unit**: For banner ads
   - **Interstitial Ad Unit**: For full-screen ads
4. Replace test IDs in `capacitor.config.ts`:

```typescript
AdMob: {
  appId: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your real app ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX' // Your real app ID
  },
  banner: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your real banner ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' // Your real banner ID
  },
  interstitial: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your real interstitial ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' // Your real interstitial ID
  }
}
```

### 2. Update AdMob Component Settings
In `components/AdBanner.tsx` and `components/InterstitialAd.tsx`:
- Set `initializeForTesting: false` for production
- Set `isTesting: false` for production
- Remove or update `testingDevices` array

### 3. Test on Real Devices
```bash
# Build and test on Android
npm run mobile

# Or build for iOS
npm run mobile
```

### 4. Monitor Ad Performance
- Check AdMob console for ad performance
- Monitor revenue and fill rates
- Adjust ad frequency if needed

## 🧪 Testing

### Test Ads (Current Setup)
- Test ads will show with "Test Ad" label
- No revenue generated from test ads
- Safe to test without affecting real ad performance

### Production Ads
- Real ads will show actual advertisements
- Revenue will be generated based on user interactions
- Monitor performance in AdMob console

## 📊 Ad Frequency Settings

### Current Settings
- **Banner Ads**: Always visible on main pages
- **Interstitial Ads**: Every 3 rounds + navigation

### Customization Options
You can adjust ad frequency by modifying:
- `roundCount % 3 === 0` in game session (change 3 to desired frequency)
- Add more interstitial triggers in other pages
- Adjust banner ad placement

## 🔍 Troubleshooting

### Common Issues
1. **Ads not showing**: Check if you're on a real device (not simulator)
2. **Test ads not loading**: Ensure AdMob is properly initialized
3. **Build errors**: Make sure `@capacitor-community/admob` is installed

### Debug Steps
1. Check browser console for AdMob errors
2. Verify ad unit IDs are correct
3. Ensure app is built with latest Capacitor sync
4. Test on physical device, not simulator

## 📈 Revenue Optimization

### Best Practices
1. **Don't over-saturate**: Too many ads can hurt user experience
2. **Strategic placement**: Place ads at natural break points
3. **Monitor metrics**: Watch fill rates and user engagement
4. **A/B testing**: Test different ad frequencies

### Future Enhancements
- Add rewarded video ads for premium features
- Implement ad-free subscription option
- Add more strategic ad placements
- Implement ad mediation for better fill rates

## 🎯 Ad Placement Strategy

### Current Implementation
- **Banner Ads**: Non-intrusive, always visible
- **Interstitial Ads**: Natural break points (game completion)

### Recommended Additions
- Interstitial ads when switching between major sections
- Rewarded ads for unlocking premium features
- Native ads in content areas

Remember to test thoroughly before releasing to production!
