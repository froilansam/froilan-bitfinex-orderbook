import OrderBook from "@/components/OrderBook";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  changePrecision,
  connectWebSocket,
  disconnectWebSocket,
} from "@/store/reducers/orderBookReducer";
import { useMemo } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { data, isConnected, isLoading, error, precision } =
    useAppSelector((state) => state.orderBook);

  const handleConnect = () => {
    dispatch(connectWebSocket());
  };

  const handleDisconnect = () => {
    dispatch(disconnectWebSocket());
  };

  const handlePrecisionChange = (newPrecision: number) => {
    dispatch(changePrecision(newPrecision));
  };

  const bids = useMemo(() => data?.bids || [], [data?.bids]);
  const asks = useMemo(() => data?.asks || [], [data?.asks]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <OrderBook
        bids={bids}
        asks={asks}
        precision={precision}
        onPrecisionChange={handlePrecisionChange}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        isLoading={isLoading}
        error={error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a3442",
  },
});
