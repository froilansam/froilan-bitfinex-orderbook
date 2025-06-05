import React, { useMemo, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OrderBookEntry } from "../types/orderbook";

interface OrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  precision: number;
  onPrecisionChange: (precision: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const OrderBook: React.FC<OrderBookProps> = ({
  bids,
  asks,
  precision,
  onPrecisionChange,
  onConnect,
  onDisconnect,
  isConnected,
  isLoading = false,
  error = null,
}) => {
  const formatPrice = useMemo(
    () =>
      (price: number): string => {
        return Math.round(price).toLocaleString("en-US");
      },
    []
  );

  const formatAmount = useMemo(
    () =>
      (amount: number): string => {
        return amount.toFixed(2);
      },
    []
  );

  const getDepthBarWidth = useMemo(
    () =>
      (total: number, maxTotal: number): number => {
        if (maxTotal === 0) return 0;
        return (total / maxTotal) * 100;
      },
    []
  );

  const { displayedBids, displayedAsks, maxTotal } = useMemo(() => {
    const slicedBids = bids.slice(0, 10);
    const slicedAsks = asks.slice(0, 10);
    const allTotals = [
      ...slicedBids.map((b) => b.total),
      ...slicedAsks.map((a) => a.total),
    ];
    const max = allTotals.length > 0 ? Math.max(...allTotals) : 0;

    return {
      displayedBids: slicedBids,
      displayedAsks: slicedAsks,
      maxTotal: max,
    };
  }, [bids, asks]);

  const statusIndicatorStyle = useMemo(
    () => [
      {
        backgroundColor: isConnected
          ? COLORS.green
          : error
          ? COLORS.red
          : COLORS.gray,
      },
    ],
    [isConnected, error]
  );

  const connectButtonStyle = useMemo(
    () => [
      {
        backgroundColor: isConnected ? "#ff6b6b" : COLORS.green,
      },
    ],
    [isConnected]
  );

  const decreasePrecisionStyle = useMemo(
    () => [
      {
        opacity: precision === 4 ? 0.3 : 1,
      },
    ],
    [precision]
  );

  const increasePrecisionStyle = useMemo(
    () => [
      {
        opacity: precision === 0 ? 0.3 : 1,
      },
    ],
    [precision]
  );

  const AnimatedDepthBar = ({ width, style }: { width: number; style: any }) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedWidth, {
        toValue: width,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [width]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <Animated.View
        style={[
          style,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    );
  };

  const renderOrderRow = useMemo(() => {
    const OrderRow = (
      bidEntry: OrderBookEntry | null,
      askEntry: OrderBookEntry | null,
      maxTotal: number,
      index: number
    ) => {
      const bidDepthWidth = bidEntry
        ? getDepthBarWidth(bidEntry.total, maxTotal)
        : 0;
      const askDepthWidth = askEntry
        ? getDepthBarWidth(askEntry.total, maxTotal)
        : 0;

      return (
        <View key={`row-${index}`} style={styles.orderRow}>
          <View style={styles.bidSide}>
            {bidEntry && (
              <AnimatedDepthBar
                width={bidDepthWidth}
                style={[styles.depthBar, styles.bidDepthBar]}
              />
            )}
            <View style={styles.sideContent}>
              <Text style={[styles.amountText, styles.leftAlign]}>
                {bidEntry ? formatAmount(bidEntry.amount) : ""}
              </Text>
              <Text
                style={[styles.priceText, styles.rightAlign, styles.bidPrice]}
              >
                {bidEntry ? formatPrice(bidEntry.price) : ""}
              </Text>
            </View>
          </View>
          <View style={styles.askSide}>
            {askEntry && (
              <AnimatedDepthBar
                width={askDepthWidth}
                style={[styles.depthBar, styles.askDepthBar]}
              />
            )}
            <View style={styles.sideContent}>
              <Text
                style={[styles.priceText, styles.leftAlign, styles.askPrice]}
              >
                {askEntry ? formatPrice(askEntry.price) : ""}
              </Text>
              <Text style={[styles.amountText, styles.rightAlign]}>
                {askEntry ? formatAmount(askEntry.amount) : ""}
              </Text>
            </View>
          </View>
        </View>
      );
    };
    return OrderRow;
  }, [formatAmount, formatPrice, getDepthBarWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>ORDER BOOK</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, statusIndicatorStyle]} />
            <Text style={styles.statusText}>
              {isLoading
                ? "Connecting..."
                : isConnected
                ? "Live"
                : error
                ? "Error"
                : "Disconnected"}
            </Text>
          </View>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, decreasePrecisionStyle]}
            onPress={() => {
              if (precision < 4) onPrecisionChange(precision + 1);
            }}
            disabled={precision === 4}
          >
            <Text
              style={[
                styles.controlButtonText,
                precision === 4 && styles.controlButtonTextDisabled,
              ]}
            >
              −
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, increasePrecisionStyle]}
            onPress={() => {
              if (precision > 0) onPrecisionChange(precision - 1);
            }}
            disabled={precision === 0}
          >
            <Text
              style={[
                styles.controlButtonText,
                precision === 0 && styles.controlButtonTextDisabled,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>AMOUNT</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>AMOUNT</Text>
      </View>

      <View style={styles.orderListContainer}>
        <ScrollView
          style={styles.orderList}
          showsVerticalScrollIndicator={false}
        >
          {Array.from(
            {
              length: Math.max(displayedBids.length, displayedAsks.length, 10),
            },
            (_, index) => {
              const bidEntry = displayedBids[index] || null;
              const askEntry = displayedAsks[index] || null;

              return renderOrderRow(bidEntry, askEntry, maxTotal, index);
            }
          )}
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.connectButton, connectButtonStyle]}
          onPress={isConnected ? onDisconnect : onConnect}
        >
          <Text style={styles.connectButtonText}>
            {isConnected ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const COLORS = {
  background: "#2a3442",
  text: "#ffffff",
  textSecondary: "#8b95a7",
  border: "#3a4452",
  green: "#16b979",
  red: "#c74e5b",
  gray: "#888888",
  error: "#4a1a1a",
  loading: "rgba(42, 52, 66, 0.9)",
  textDisabled: "#555555",
} as const;

const FONT_FAMILY = Platform.OS === "ios" ? "Menlo" : "monospace";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  controlButtonText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "bold",
  },
  controlButtonTextDisabled: {
    color: COLORS.textDisabled,
  },
  bottomControls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  connectButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  headerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderListContainer: {
    flex: 1,
    position: "relative",
  },
  orderList: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.loading,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    fontFamily: FONT_FAMILY,
  },
  orderRow: {
    flexDirection: "row",
    height: 30,
    marginVertical: 1,
  },
  bidSide: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  askSide: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  sideContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 1,
    height: "100%",
  },
  depthBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 0,
  },
  bidDepthBar: {
    backgroundColor: COLORS.green,
    right: 0,
  },
  askDepthBar: {
    backgroundColor: COLORS.red,
    left: 0,
  },
  amountText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  priceText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    flex: 1,
  },
  bidPrice: {
    color: COLORS.green,
  },
  askPrice: {
    color: COLORS.red,
  },
  leftAlign: {
    textAlign: "left",
  },
  rightAlign: {
    textAlign: "right",
  },
});

export default OrderBook;
