import React from "react";
import {
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
  onScaleChange: (scale: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

const OrderBook: React.FC<OrderBookProps> = ({
  bids,
  asks,
  symbol,
  precision,
  scale,
  onPrecisionChange,
  onScaleChange,
  onConnect,
  onDisconnect,
  isConnected,
}) => {
  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(5);
  };

  const getDepthBarWidth = (total: number, maxTotal: number): number => {
    if (maxTotal === 0) return 0;
    const baseWidth = (total / maxTotal) * 100;
    return Math.min(baseWidth * scale, 100);
  };

  const maxBidTotal = Math.max(...bids.map((b) => b.total));
  const maxAskTotal = Math.max(...asks.map((a) => a.total));

  const renderOrderRow = (
    bidEntry: OrderBookEntry | null,
    askEntry: OrderBookEntry | null,
    maxBidTotal: number,
    maxAskTotal: number,
    index: number
  ) => {
    const bidDepthWidth = bidEntry
      ? getDepthBarWidth(bidEntry.total, maxBidTotal)
      : 0;
    const askDepthWidth = askEntry
      ? getDepthBarWidth(askEntry.total, maxAskTotal)
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
              {bidEntry ? formatAmount(bidEntry.total) : ""}
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
              {askEntry ? formatAmount(askEntry.total) : ""}
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
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (precision > 0) onPrecisionChange(precision - 1);
              if (scale > 0.5) onScaleChange(Math.max(scale - 0.25, 0.5));
            }}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (precision < 4) onPrecisionChange(precision + 1);
              if (scale < 2.0) onScaleChange(Math.min(scale + 0.25, 2.0));
            }}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>TOTAL</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>TOTAL</Text>
      </View>

      <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
        {Array.from(
          { length: Math.max(bids.length, asks.length) },
          (_, index) => {
            const bidEntry = bids[index] || null;
            const askEntry = asks[asks.length - 1 - index] || null;

            return renderOrderRow(
              bidEntry,
              askEntry,
              maxBidTotal,
              maxAskTotal,
              index
            );
          }
        )}
      </ScrollView>

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
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
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
    color: "#8b95a7",
    fontSize: 18,
    fontWeight: "bold",
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
  orderList: {
    flex: 1,
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
