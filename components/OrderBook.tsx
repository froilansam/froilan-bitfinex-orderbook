import React from "react";
import {
  ActivityIndicator,
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
  symbol: string;
  precision: number;
  scale: number;
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
  symbol,
  precision,
  scale,
  onPrecisionChange,
  onConnect,
  onDisconnect,
  isConnected,
  isLoading = false,
  error = null,
}) => {
  const formatPrice = (price: number): string => {
    return Math.round(price).toLocaleString("en-US");
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  const getDepthBarWidth = (total: number, maxTotal: number): number => {
    if (maxTotal === 0) return 0;
    return (total / maxTotal) * 100;
  };

  // Get the first 10 entries for calculating max total
  const displayedBids = bids.slice(0, 10);
  const displayedAsks = asks.slice(0, 10);
  const allTotals = [...displayedBids.map(b => b.total), ...displayedAsks.map(a => a.total)];
  const maxTotal = allTotals.length > 0 ? Math.max(...allTotals) : 0;

  const renderOrderRow = (
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
            <View
              style={[
                styles.depthBar,
                styles.bidDepthBar,
                { width: `${bidDepthWidth}%` },
              ]}
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
            <View
              style={[
                styles.depthBar,
                styles.askDepthBar,
                { width: `${askDepthWidth}%` },
              ]}
            />
          )}
          <View style={styles.sideContent}>
            <Text style={[styles.priceText, styles.leftAlign, styles.askPrice]}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>ORDER BOOK</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: isConnected
                    ? "#16b979"
                    : error
                    ? "#c74e5b"
                    : "#888888",
                },
              ]}
            />
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
            style={[
              styles.controlButton,
              precision === 4 && styles.controlButtonDisabled,
            ]}
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
            style={[
              styles.controlButton,
              precision === 0 && styles.controlButtonDisabled,
            ]}
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
        <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
          {Array.from(
            { length: 10 },
            (_, index) => {
              const bidEntry = bids[index] || null;
              const askEntry = asks[index] || null;

              return renderOrderRow(bidEntry, askEntry, maxTotal, index);
            }
          )}
        </ScrollView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#16b979" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[
            styles.connectButton,
            { backgroundColor: isConnected ? "#ff6b6b" : "#16b979" },
          ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a3442",
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
    color: "#ffffff",
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
    color: "#8b95a7",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorContainer: {
    backgroundColor: "#4a1a1a",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#c74e5b",
  },
  errorText: {
    color: "#c74e5b",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonText: {
    color: "#8b95a7",
    fontSize: 18,
    fontWeight: "bold",
  },
  controlButtonTextDisabled: {
    color: "#555555",
  },
  bottomControls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#3a4452",
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3a4452",
    marginBottom: 8,
  },
  headerText: {
    color: "#8b95a7",
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
    backgroundColor: "rgba(42, 52, 66, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#16b979",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
    backgroundColor: "#16b979",
    right: 0,
  },
  askDepthBar: {
    backgroundColor: "#c74e5b",
    left: 0,
  },
  amountText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  priceText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "bold",
    flex: 1,
  },
  bidPrice: {
    color: "#16b979",
  },
  askPrice: {
    color: "#c74e5b",
  },
  leftAlign: {
    textAlign: "left",
  },
  rightAlign: {
    textAlign: "right",
  },
});

export default OrderBook;
