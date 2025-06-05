import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import OrderBook from '@/components/OrderBook';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { connectWebSocket, disconnectWebSocket, setPrecision, setScale } from '@/store/actions/orderBookActions';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { data, isConnected, precision, scale } = useAppSelector(state => state.orderBook);

  const handleConnect = () => {
    dispatch(connectWebSocket());
  };

  const handleDisconnect = () => {
    dispatch(disconnectWebSocket());
  };

  const handlePrecisionChange = (newPrecision: number) => {
    dispatch(setPrecision(newPrecision));
  };

  const handleScaleChange = (newScale: number) => {
    dispatch(setScale(newScale));
  };

  // Use mock data if no real data is available
  const bids = data?.bids || [
    { price: 34820, amount: 1.358, total: 1.358 },
    { price: 34810, amount: 7.291, total: 8.649 },
    { price: 34800, amount: 6.541, total: 15.19 },
    { price: 34790, amount: 4.950, total: 20.14 },
    { price: 34780, amount: 33.60, total: 53.74 },
    { price: 34770, amount: 23.91, total: 77.65 },
    { price: 34760, amount: 34.05, total: 111.7 },
    { price: 34750, amount: 61.00, total: 172.7 },
    { price: 34740, amount: 7.300, total: 180.0 },
    { price: 34730, amount: 6.500, total: 186.5 },
  ];

  const asks = data?.asks || [
    { price: 34830, amount: 0.0600, total: 93.93 },
    { price: 34840, amount: 2.121, total: 72.01 },
    { price: 34850, amount: 5.134, total: 61.71 },
    { price: 34860, amount: 6.085, total: 36.50 },
    { price: 34870, amount: 6.590, total: 34.11 },
    { price: 34880, amount: 14.12, total: 19.99 },
    { price: 34890, amount: 2.390, total: 13.40 },
    { price: 34900, amount: 25.21, total: 7.315 },
    { price: 34910, amount: 10.30, total: 2.181 },
    { price: 34920, amount: 21.92, total: 0.0600 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <OrderBook
        bids={bids}
        asks={asks}
        symbol="BTC/USD"
        precision={precision}
        scale={scale}
        onPrecisionChange={handlePrecisionChange}
        onScaleChange={handleScaleChange}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
