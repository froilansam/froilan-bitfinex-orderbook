import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OrderBook from '@/components/OrderBook';
import { OrderBookEntry } from '@/types/orderbook';

const mockBids: OrderBookEntry[] = [
  { price: 34829, amount: 1.358, total: 1.358 },
  { price: 34820, amount: 8.649, total: 10.007 },
  { price: 34810, amount: 15.19, total: 25.197 },
  { price: 34800, amount: 20.14, total: 45.337 },
  { price: 34790, amount: 53.74, total: 99.077 },
  { price: 34780, amount: 77.65, total: 176.727 },
  { price: 34770, amount: 111.7, total: 288.427 },
  { price: 34760, amount: 172.7, total: 461.127 },
  { price: 34750, amount: 180.0, total: 641.127 },
  { price: 34740, amount: 186.5, total: 827.627 },
];

const mockAsks: OrderBookEntry[] = [
  { price: 34830, amount: 0.0600, total: 0.0600 },
  { price: 34840, amount: 2.181, total: 2.241 },
  { price: 34850, amount: 7.315, total: 9.556 },
  { price: 34860, amount: 13.40, total: 22.956 },
  { price: 34870, amount: 19.99, total: 42.946 },
  { price: 34880, amount: 34.11, total: 77.056 },
  { price: 34890, amount: 36.50, total: 113.556 },
  { price: 34900, amount: 61.71, total: 175.266 },
  { price: 34910, amount: 72.01, total: 247.276 },
  { price: 34920, amount: 93.93, total: 341.206 },
];

export default function HomeScreen() {
  const [precision, setPrecision] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handlePrecisionChange = (newPrecision: number) => {
    setPrecision(newPrecision);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  return (
    <View style={styles.container}>
      <OrderBook
        bids={mockBids}
        asks={mockAsks}
        symbol="BTC/USD"
        precision={precision}
        scale={scale}
        onPrecisionChange={handlePrecisionChange}
        onScaleChange={handleScaleChange}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
