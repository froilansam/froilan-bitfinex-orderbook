# Bitfinex Order Book Mobile App (Froilan Sam Malibiran Bitfinex Challenge)

A React Native mobile application that replicates the Order Book widget functionality from the Bitfinex trading platform. Built with Expo, Redux, and Redux Saga.

## Overview

This application displays a real-time order book for the BTCUSD trading pair using the Bitfinex WebSocket V2 API. The interface shows live bid and ask prices with depth visualization, precision controls, and connection manaement.

## Features

### Order Book Widget

- **Real-time data**: Live order book updates via WebSocket connection
- **Precision control**: Adjust price precision (P0-P4) using +/- buttons
- **Depth visualization**: Animated depth bars showing cumulative order volume
- **Connection management**: Connect/Disconnect buttons for WebSocket control
- **Error handling**: Automatic reconnection and error state display

### Technical Implementation

- **React Native** with Expo for cross-platform mobile development
- **Redux + Redux Saga** for state management and async operations
- **WebSocket integration** using Bitfinex WebSocket V2 API
- **TypeScript** for type safety and better development experience

## Architecture

```
src/
├── app/                    # Main app screens
├── components/            # Reusable UI components
│   └── OrderBook.tsx     # Main order book component
├── store/                # Redux store configuration
│   ├── actions/          # Action creators
│   ├── reducers/         # Redux reducers
│   └── sagas/           # Redux saga for WebSocket handling
├── types/               # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## State Management

The application uses Redux with the following key state:

- **Order book data**: Bids, asks, and cumulative totals
- **Connection status**: WebSocket connection state
- **Precision level**: Current price precision setting
- **Error handling**: Connection errors and recovery

## WebSocket Integration

Connects to Bitfinex WebSocket V2 API:

- **Endpoint**: `wss://api-pub.bitfinex.com/ws/2`
- **Symbol**: BTCUSD trading pair
- **Channel**: Order book with configurable precision
- **Auto-reconnection**: Handles network interruptions gracefully

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx run start
   ```

3. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Development Commands

```bash
# Start development server
npm start

# Run linting
npm run lint

# Reset project (remove example code)
npm run reset-project
```

## Usage

1. **Launch the app** - The order book will attempt to connect automatically
2. **View live data** - Real-time bid/ask prices with depth visualization
3. **Adjust precision** - Use +/- buttons to change price precision (P0-P4)
4. **Manage connection** - Use Connect/Disconnect button to control WebSocket
5. **Monitor status** - Connection indicator shows current state (Live/Error/Disconnected)

## Author

Froilan Sam Malibiran
