import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { OrderBookEntry } from '../types/orderbook';

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
  isConnected
}) => {
  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(5);
  };

  const getDepthBarWidth = (total: number, maxTotal: number): number => {
    const baseWidth = (total / maxTotal) * 90;
    return Math.min(baseWidth * scale, 90);
  };

  const maxBidTotal = Math.max(...bids.map(b => b.total));
  const maxAskTotal = Math.max(...asks.map(a => a.total));

  const renderOrderRow = (
    bidEntry: OrderBookEntry | null,
    askEntry: OrderBookEntry | null,
    maxBidTotal: number,
    maxAskTotal: number,
    index: number
  ) => {
    const bidDepthWidth = bidEntry ? getDepthBarWidth(bidEntry.total, maxBidTotal) : 0;
    const askDepthWidth = askEntry ? getDepthBarWidth(askEntry.total, maxAskTotal) : 0;
    
    return (
      <View key={`row-${index}`} style={styles.orderRow}>
        {/* Bid side */}
        <View style={styles.bidSide}>
          {bidEntry && (
            <View 
              style={[
                styles.depthBar,
                styles.bidDepthBar,
                { width: `${bidDepthWidth}%` }
              ]}
            />
          )}
          <View style={styles.sideContent}>
            <Text style={[styles.amountText, styles.leftAlign]}>
              {bidEntry ? formatAmount(bidEntry.amount) : ''}
            </Text>
            <Text style={[styles.priceText, styles.rightAlign, styles.bidPrice]}>
              {bidEntry ? formatPrice(bidEntry.price) : ''}
            </Text>
          </View>
        </View>

        {/* Ask side */}
        <View style={styles.askSide}>
          {askEntry && (
            <View 
              style={[
                styles.depthBar,
                styles.askDepthBar,
                { width: `${askDepthWidth}%` }
              ]}
            />
          )}
          <View style={styles.sideContent}>
            <Text style={[styles.priceText, styles.leftAlign, styles.askPrice]}>
              {askEntry ? formatPrice(askEntry.price) : ''}
            </Text>
            <Text style={[styles.amountText, styles.rightAlign]}>
              {askEntry ? formatAmount(askEntry.amount) : ''}
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

      <View style={styles.connectionControls}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isConnected ? '#ff6b6b' : '#00d4aa' }]}
          onPress={isConnected ? onDisconnect : onConnect}
        >
          <Text style={styles.buttonText}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.precisionControls}>
        <Text style={styles.precisionLabel}>Precision: {precision}</Text>
        <Text style={styles.precisionLabel}>Scale: {scale.toFixed(2)}x</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>AMOUNT</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>AMOUNT</Text>
      </View>

      <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
        {Array.from({ length: Math.max(bids.length, asks.length) }, (_, index) => {
          const bidEntry = bids[index] || null;
          const askEntry = asks[asks.length - 1 - index] || null;
          
          return renderOrderRow(bidEntry, askEntry, maxBidTotal, maxAskTotal, index);
        })}
        
        <View style={styles.spread}>
          <Text style={styles.spreadText}>
            Spread: {asks.length > 0 && bids.length > 0 
              ? (asks[0].price - bids[0].price).toFixed(3)
              : '0'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a3442',
    padding: 18,
    borderRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  controlButtonText: {
    color: '#8b95a7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  precisionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  precisionLabel: {
    color: '#8b95a7',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3a4452',
    marginBottom: 8,
  },
  headerText: {
    color: '#8b95a7',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderList: {
    flex: 1,
  },
  orderRow: {
    flexDirection: 'row',
    height: 30,
    marginVertical: 1,
  },
  bidSide: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  askSide: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  sideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
    height: '100%',
  },
  depthBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.35,
    zIndex: 0,
  },
  bidDepthBar: {
    backgroundColor: '#16b979',
    left: 0,
  },
  askDepthBar: {
    backgroundColor: '#c74e5b',
    right: 0,
  },
  amountText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    flex: 1,
  },
  bidPrice: {
    color: '#16b979',
  },
  askPrice: {
    color: '#c74e5b',
  },
  leftAlign: {
    textAlign: 'left',
  },
  rightAlign: {
    textAlign: 'right',
  },
  spread: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#3a4452',
    marginVertical: 4,
  },
  spreadText: {
    color: '#8b95a7',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default OrderBook;