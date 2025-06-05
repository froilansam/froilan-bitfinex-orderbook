import { OrderBookEntry, OrderBookState } from '../../types/orderbook';
import { ORDER_BOOK_ACTIONS, OrderBookAction } from '../actions/orderBookActions';

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
  // Sort bids descending (highest price first)
  const sortedBids = rawBids.sort((a, b) => b[0] - a[0]);
  // Sort asks ascending (lowest price first)
  const sortedAsks = rawAsks.sort((a, b) => a[0] - b[0]);

  // Calculate cumulative totals for bids
  let bidTotal = 0;
  const bids: OrderBookEntry[] = sortedBids.map(([price, , amount]) => {
    bidTotal += Math.abs(amount);
    return {
      price,
      amount: Math.abs(amount),
      total: bidTotal,
    };
  });

  // Calculate cumulative totals for asks (from best ask downward)
  const asks: OrderBookEntry[] = [];
  let askTotal = 0;
  
  // First calculate total volume
  const totalAskVolume = sortedAsks.reduce((sum, [, , amount]) => sum + Math.abs(amount), 0);
  
  // Then assign decreasing totals
  for (let i = 0; i < sortedAsks.length; i++) {
    const [price, , amount] = sortedAsks[i];
    askTotal += Math.abs(amount);
    asks.push({
      price,
      amount: Math.abs(amount),
      total: totalAskVolume - askTotal + Math.abs(amount),
    });
  }

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

export const orderBookReducer = (
  state = initialState,
  action: OrderBookAction
): OrderBookState => {
  switch (action.type) {
    case ORDER_BOOK_ACTIONS.CONNECT_WEBSOCKET:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ORDER_BOOK_ACTIONS.WEBSOCKET_CONNECTED:
      return {
        ...state,
        isConnected: true,
        isLoading: false,
        error: null,
      };

    case ORDER_BOOK_ACTIONS.WEBSOCKET_DISCONNECTED:
      return {
        ...state,
        isConnected: false,
        isLoading: false,
        data: null,
      };

    case ORDER_BOOK_ACTIONS.WEBSOCKET_ERROR:
      return {
        ...state,
        isConnected: false,
        isLoading: false,
        error: action.payload,
      };

    case ORDER_BOOK_ACTIONS.ORDER_BOOK_SNAPSHOT:
      const snapshotData = processOrderBookData(action.payload.bids, action.payload.asks);
      return {
        ...state,
        data: {
          bids: snapshotData.bids,
          asks: snapshotData.asks,
          symbol: 'BTCUSD',
          lastUpdated: Date.now(),
        },
        isLoading: false,
        error: null,
      };

    case ORDER_BOOK_ACTIONS.UPDATE_ORDER_BOOK:
      if (!state.data) return state;
      
      const updatedData = updateOrderBookData(state.data, action.payload);
      return {
        ...state,
        data: {
          ...state.data,
          bids: updatedData.bids,
          asks: updatedData.asks,
          lastUpdated: Date.now(),
        },
      };

    case ORDER_BOOK_ACTIONS.SET_PRECISION:
      return {
        ...state,
        precision: Math.max(0, Math.min(4, action.payload)),
      };

    case ORDER_BOOK_ACTIONS.SET_SCALE:
      return {
        ...state,
        scale: Math.max(0.5, Math.min(2.0, action.payload)),
      };

    case ORDER_BOOK_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ORDER_BOOK_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};