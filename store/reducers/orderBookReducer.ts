import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderBookEntry, OrderBookState } from '../../types/orderbook';

const initialState: OrderBookState = {
  data: null,
  isConnected: false,
  isLoading: false,
  error: null,
  precision: 0,
  scale: 1.0,
};

const processOrderBookData = (
  rawBids: [number, number, number][],
  rawAsks: [number, number, number][]
): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } => {
  // Process bids - convert to OrderBookEntry format and calculate cumulative totals
  let bidTotal = 0;
  const bids = rawBids.map(([price, , amount]) => {
    bidTotal += Math.abs(amount);
    return {
      price,
      amount: Math.abs(amount),
      total: parseFloat(bidTotal.toFixed(2)),
    };
  });

  // Process asks - convert to OrderBookEntry format and calculate cumulative totals
  let askTotal = 0;
  const asks = rawAsks.map(([price, , amount]) => {
    askTotal += Math.abs(amount);
    return {
      price,
      amount: Math.abs(amount),
      total: parseFloat(askTotal.toFixed(2)),
    };
  });

  // Sort bids by price descending (highest price first)
  bids.sort((a, b) => b.price - a.price);
  
  // Sort asks by price ascending (lowest price first)
  asks.sort((a, b) => a.price - b.price);

  return { bids, asks };
};

const updateOrderBookData = (
  currentData: { bids: OrderBookEntry[]; asks: OrderBookEntry[] } | null,
  updates: { bids?: [number, number, number][]; asks?: [number, number, number][] }
): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } => {
  if (!currentData) {
    return processOrderBookData(updates.bids || [], updates.asks || []);
  }

  // Convert current data back to raw format for processing
  const currentBids: [number, number, number][] = currentData.bids.map(bid => [
    bid.price,
    1,
    bid.amount,
  ]);
  
  const currentAsks: [number, number, number][] = currentData.asks.map(ask => [
    ask.price,
    1,
    ask.amount,
  ]);

  // Apply updates
  let updatedBids = currentBids;
  let updatedAsks = currentAsks;

  if (updates.bids) {
    updates.bids.forEach(([price, count, amount]) => {
      const existingIndex = updatedBids.findIndex(([p]) => p === price);
      
      if (count === 0 || amount === 0) {
        // Remove the price level
        if (existingIndex !== -1) {
          updatedBids.splice(existingIndex, 1);
        }
      } else {
        // Update or add the price level
        if (existingIndex !== -1) {
          updatedBids[existingIndex] = [price, count, amount];
        } else {
          updatedBids.push([price, count, amount]);
        }
      }
    });
  }

  if (updates.asks) {
    updates.asks.forEach(([price, count, amount]) => {
      const existingIndex = updatedAsks.findIndex(([p]) => p === price);
      
      if (count === 0 || amount === 0) {
        // Remove the price level
        if (existingIndex !== -1) {
          updatedAsks.splice(existingIndex, 1);
        }
      } else {
        // Update or add the price level
        if (existingIndex !== -1) {
          updatedAsks[existingIndex] = [price, count, amount];
        } else {
          updatedAsks.push([price, count, amount]);
        }
      }
    });
  }

  return processOrderBookData(updatedBids, updatedAsks);
};

const orderBookSlice = createSlice({
  name: 'orderBook',
  initialState,
  reducers: {
    connectWebSocket: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    disconnectWebSocket: (state) => {
      state.isLoading = false;
    },
    webSocketConnected: (state) => {
      state.isConnected = true;
      state.isLoading = false;
      state.error = null;
    },
    webSocketDisconnected: (state) => {
      state.isConnected = false;
      state.isLoading = false;
    },
    webSocketError: (state, action: PayloadAction<string>) => {
      state.isConnected = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    setOrderBookData: (state, action: PayloadAction<{ bids: [number, number, number][]; asks: [number, number, number][] }>) => {
      const processedData = processOrderBookData(action.payload.bids, action.payload.asks);
      state.data = {
        bids: processedData.bids,
        asks: processedData.asks,
        symbol: 'BTCUSD',
        lastUpdated: Date.now(),
      };
      state.isLoading = false;
      state.error = null;
    },
    updateOrderBook: (state, action: PayloadAction<{ bids?: [number, number, number][]; asks?: [number, number, number][] }>) => {
      if (!state.data) return;
      
      const updatedData = updateOrderBookData(state.data, action.payload);
      state.data = {
        ...state.data,
        bids: updatedData.bids,
        asks: updatedData.asks,
        lastUpdated: Date.now(),
      };
    },
    throttledUpdateOrderBook: (state, action: PayloadAction<{ bids?: [number, number, number][]; asks?: [number, number, number][] }>) => {
      if (!state.data) return;
      
      const updatedData = updateOrderBookData(state.data, action.payload);
      state.data = {
        ...state.data,
        bids: updatedData.bids,
        asks: updatedData.asks,
        lastUpdated: Date.now(),
      };
    },
    setPrecision: (state, action: PayloadAction<number>) => {
      state.precision = Math.max(0, Math.min(4, action.payload));
    },
    changePrecision: (state, action: PayloadAction<number>) => {
      state.precision = Math.max(0, Math.min(4, action.payload));
      state.isLoading = true;
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = Math.max(0.5, Math.min(2.0, action.payload));
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  connectWebSocket,
  disconnectWebSocket,
  webSocketConnected,
  webSocketDisconnected,
  webSocketError,
  setOrderBookData,
  updateOrderBook,
  throttledUpdateOrderBook,
  setPrecision,
  changePrecision,
  setScale,
  setError,
  clearError,
} = orderBookSlice.actions;

export const orderBookReducer = orderBookSlice.reducer;