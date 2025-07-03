# Froww - Stock Trading App 📈

A modern React Native application for stock market tracking and portfolio management, built with Expo and TypeScript. This app provides real-time stock data, watchlist management, and comprehensive market analysis tools.

![Froww App](https://img.shields.io/badge/React%20Native-0.79.4-blue.svg)
![Expo](https://img.shields.io/badge/Expo-~53.0.15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-~5.8.3-blue.svg)
Project repository: [github.com/enggsatyamraj/froww](https://github.com/enggsatyamraj/froww)

## 🚀 Features

### Core Functionality
- **📊 Explore Screen**: Browse top gainers and losers with interactive grid cards
- **📋 Watchlist Management**: Create, rename, and manage multiple watchlists
- **📈 Stock Details**: Comprehensive stock information with interactive price charts
- **🔍 Real-time Data**: Live stock prices, charts, and market data via Alpha Vantage API
- **💾 Smart Caching**: Intelligent data caching for offline capability and improved performance

### Advanced Features
- **📱 Responsive Design**: Optimized for both Android and iOS devices
- **🌙 Modern UI**: Clean, intuitive interface with smooth animations
- **⚡ Performance Optimized**: Efficient data loading with fallback mechanisms
- **🔄 Pull-to-Refresh**: Easy data refreshing across all screens
- **📊 Interactive Charts**: Multiple timeframe views (1D, 1W, 1M, 3M, 1Y)
- **🎯 Error Handling**: Comprehensive error states and network connectivity management

## 📱 Try the App

### 🚀 Quick Demo
**Download and test the app immediately:**

📱 **APK Download**: [Get Froww APK](https://expo.dev/accounts/enggsatyamraj/projects/froww/builds/8e239028-dcf9-4f29-9d89-03be257733f0)

> **Note**: This is an Expo development build. For Android devices, enable "Install from unknown sources" in your device settings.

### 🎯 What to Expect
- Real-time stock data from Alpha Vantage API
- Interactive stock charts with multiple timeframes
- Create and manage multiple watchlists
- Offline caching for seamless experience
- Modern, intuitive UI design

---

## 📱 Screenshots
### Main Screens
|----------------|-----------|---------------|
| Top gainers and losers with market trends | Organized watchlists with stock counts | Detailed stock info with charts |

### Additional Features
| Chart View | Watchlist Management | Empty States |
|------------|---------------------|--------------|
| Interactive price charts | Create and manage watchlists | User-friendly empty states |

## 🛠️ Tech Stack

### Frontend
- **React Native**: 0.79.4
- **Expo**: ~53.0.15
- **TypeScript**: ~5.8.3
- **Expo Router**: File-based navigation system

### UI Components & Libraries
- **@expo/vector-icons**: Icon system
- **react-native-chart-kit**: Interactive charts
- **react-native-actions-sheet**: Bottom sheets
- **react-native-svg**: SVG support for charts

### Data & Storage
- **@react-native-async-storage/async-storage**: Local data persistence
- **Alpha Vantage API**: Real-time stock market data
- **Custom Cache Manager**: Intelligent data caching system

### Development Tools
- **ESLint**: Code linting
- **Expo CLI**: Development and build tools

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **Alpha Vantage API Key** (free from [alphavantage.co](https://www.alphavantage.co))

## 📥 Quick Start

### Clone and Setup
### 💻 Run from Source
```bash
# Clone the repository
git clone https://github.com/enggsatyamraj/froww.git
cd froww

# Install dependencies
npm install

# Add your Alpha Vantage API key to .env file
echo "API_KEY=your_api_key_here" > .env

# Start the development server
npx expo start
```

### Download APK
📱 **Direct Download**: [Download Latest APK](https://expo.dev/accounts/enggsatyamraj/projects/froww/builds/8e239028-dcf9-4f29-9d89-03be257733f0)

## ⚙️ Installation & Setup

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure API Key
Create a `.env` file in the root directory:
```env
API_KEY=your_alpha_vantage_api_key_here
```

**Note**: Get your free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

### 4. Start the Development Server
```bash
npx expo start
```

### 5. Run on Device/Simulator

#### For Android:
```bash
npx expo run:android
```

#### For iOS:
```bash
npx expo run:ios
```

#### Using Expo Go App:
1. Install Expo Go from App Store/Play Store
2. Scan the QR code from the terminal
3. The app will load on your device

## 📁 Project Structure

```
froww/
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx            # Explore screen (Top gainers/losers)
│   │   ├── watchlist.tsx        # Watchlists overview
│   │   └── _layout.tsx          # Tab layout configuration
│   ├── stock/                   # Stock-related screens
│   │   └── [symbol].tsx         # Dynamic stock detail screen
│   ├── watchlist/               # Watchlist management
│   │   ├── [id].tsx            # Individual watchlist view
│   │   └── _layout.tsx         # Watchlist layout
│   ├── view-all.tsx            # View all stocks (gainers/losers)
│   ├── index.tsx               # Splash screen
│   └── _layout.tsx             # Root layout
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   │   ├── GridStockCard.tsx    # Stock card for grid view
│   │   ├── StockCard.tsx        # Stock card component
│   │   ├── Skeleton.tsx         # Loading skeletons
│   │   └── Button.tsx           # Custom button component
│   ├── WatchlistBottomSheet.tsx # Watchlist management modal
│   └── RenameWatchlistBottomSheet.tsx # Rename functionality
├── services/                     # API and data services
│   ├── alphaVantageApi.ts       # Alpha Vantage API integration
│   ├── cacheManager.ts          # Intelligent caching system
│   └── watchlistStorage.ts     # Watchlist data management
├── theme/                        # Design system
│   ├── colors.ts                # Color palette
│   ├── spacing.ts               # Spacing system
│   ├── typography.ts            # Typography styles
│   └── index.ts                 # Theme exports
├── types/                        # TypeScript definitions
│   └── api.ts                   # API response types
├── constants/                    # App constants
└── hooks/                        # Custom React hooks
```

## 🔧 Configuration

### Environment Variables
The app uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Alpha Vantage API key | Yes |

### App Configuration (`app.json`)
- **App Name**: Froww
- **Bundle ID**: `com.enggsatyamraj.froww`
- **Version**: 1.0.0
- **Platforms**: iOS, Android, Web

## 🚀 Features Implementation

### 1. Explore Screen
- **Top Gainers/Losers**: Real-time market data with percentage changes
- **Grid Layout**: 2-column responsive grid for optimal viewing
- **Pull-to-Refresh**: Easy data updates
- **Navigation**: Direct access to individual stock details

### 2. Stock Details Screen
- **Company Information**: Comprehensive company overview
- **Interactive Charts**: Multiple timeframe support (1D, 1W, 1M, 3M, 1Y)
- **Key Metrics**: P/E ratio, market cap, 52-week high/low
- **Watchlist Integration**: Add/remove stocks from watchlists

### 3. Watchlist Management
- **Multiple Watchlists**: Create and manage unlimited watchlists
- **Stock Organization**: Add stocks to multiple watchlists
- **Rename/Delete**: Full CRUD operations for watchlists
- **Statistics**: Track gains/losses across your portfolio

### 4. Caching System
- **Smart Caching**: Different TTL for various data types
- **Offline Support**: App works with cached data when offline
- **Memory + Storage**: Two-tier caching for optimal performance

## 📊 API Integration

### Alpha Vantage API Endpoints Used:
1. **TOP_GAINERS_LOSERS**: Market movers data
2. **OVERVIEW**: Company fundamental data
3. **GLOBAL_QUOTE**: Real-time stock quotes
4. **TIME_SERIES_DAILY**: Daily historical data
5. **TIME_SERIES_INTRADAY**: Intraday price data

### Fallback System:
- Automatic fallback to mock data when API limits are reached
- Graceful error handling with user-friendly messages
- Smart retry mechanisms

## 🎨 Design System

### Colors
- **Primary**: #00D4AA (Groww Green)
- **Success**: #22C55E (Bullish Green)
- **Error**: #EF4444 (Bearish Red)
- **Background**: #F8FAFC
- **Surface**: #FFFFFF

### Typography
- **Font Weights**: 400 (normal) to 700 (bold)
- **Font Sizes**: 12px to 32px responsive scale
- **Letter Spacing**: Optimized for readability

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Multiple variants (primary, secondary, outline)
- **Charts**: Interactive with smooth animations

## 🔒 Data Management

### Local Storage
- **AsyncStorage**: Persistent data storage
- **Watchlists**: Stored locally with unique IDs
- **Cache**: Intelligent caching with expiration

### State Management
- **React State**: Component-level state management
- **Context API**: Global state for app-wide data
- **Custom Hooks**: Reusable state logic

## ⚡ Performance Optimizations

### Code Splitting
- **Lazy Loading**: Dynamic imports for screens
- **Component Optimization**: Memoization where appropriate

### Data Optimization
- **Pagination**: Efficient data loading
- **Image Optimization**: Optimized asset loading
- **Network Requests**: Request deduplication and caching

### UI Optimizations
- **Skeleton Loading**: Improved perceived performance
- **Smooth Animations**: 60fps animations
- **Efficient Re-renders**: Optimized component updates

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service testing
- **E2E Tests**: Full user journey testing

## 📦 Building for Production

### Android Build
```bash
# Create development build
npx expo run:android --variant release

# Create production APK
eas build --platform android
```

### iOS Build
```bash
# Create development build
npx expo run:ios --configuration Release

# Create production build
eas build --platform ios
```

## 🚀 Deployment

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for both platforms
eas build --platform all
```

### Manual Deployment
1. **Android**: Upload APK to Google Play Console
2. **iOS**: Upload IPA to App Store Connect

## 🐛 Troubleshooting

### Common Issues

#### API Rate Limits
- **Issue**: Alpha Vantage API rate limiting
- **Solution**: App automatically uses fallback data

#### Cache Issues
- **Issue**: Stale data showing
- **Solution**: Pull-to-refresh or clear app cache

#### Network Connectivity
- **Issue**: No internet connection
- **Solution**: App shows cached data with offline indicator

#### Build Issues
```bash
# Clear Expo cache
expo r -c

# Reset project
npm run reset-project

# Reinstall dependencies
rm -rf node_modules && npm install
```

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use ESLint configuration
3. Write tests for new features
4. Update documentation

### Pull Request Process
1. Fork the [repository](https://github.com/enggsatyamraj/froww)
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Satyam Raj**
- **GitHub**: [@enggsatyamraj](https://github.com/enggsatyamraj)
- **Repository**: [github.com/enggsatyamraj/froww](https://github.com/enggsatyamraj/froww)
- **Email**: enggsatyamraj@gmail.com

## 🙏 Acknowledgments

- **Alpha Vantage**: For providing free stock market data API
- **Expo Team**: For the excellent React Native framework
- **React Native Community**: For the amazing ecosystem
- **Assignment Provider**: For the detailed requirements and UI mockups

## 📞 Support

For support and questions:
- 🐛 **Issues**: [Create an issue](https://github.com/enggsatyamraj/froww/issues) on GitHub
- 📧 **Email**: enggsatyamraj@gmail.com

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Complete implementation of assignment requirements
- ✅ Explore screen with top gainers/losers
- ✅ Watchlist management system
- ✅ Stock detail pages with charts
- ✅ Real-time data integration
- ✅ Offline caching support
- ✅ Error handling and loading states
- ✅ Responsive design for all screen sizes

---

**Built with ❤️ using React Native and Expo**