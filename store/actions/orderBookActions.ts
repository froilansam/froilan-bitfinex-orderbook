export const ORDER_BOOK_ACTIONS = {
  // WebSocket Connection
  CONNECT_WEBSOCKET: 'CONNECT_WEBSOCKET',
  DISCONNECT_WEBSOCKET: 'DISCONNECT_WEBSOCKET',
  WEBSOCKET_CONNECTED: 'WEBSOCKET_CONNECTED',
  WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  
  // Order Book Data
  SUBSCRIBE_TO_SYMBOL: 'SUBSCRIBE_TO_SYMBOL',
  UNSUBSCRIBE_FROM_SYMBOL: 'UNSUBSCRIBE_FROM_SYMBOL',
  UPDATE_ORDER_BOOK: 'UPDATE_ORDER_BOOK',
  ORDER_BOOK_SNAPSHOT: 'ORDER_BOOK_SNAPSHOT',
  
  // UI Controls
  SET_PRECISION: 'SET_PRECISION',
  SET_SCALE: 'SET_SCALE',
  CHANGE_PRECISION: 'CHANGE_PRECISION',
  
  // Error Handling
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
} as const;

export interface ConnectWebSocketAction {
  type: typeof ORDER_BOOK_ACTIONS.CONNECT_WEBSOCKET;
}

export interface DisconnectWebSocketAction {
  type: typeof ORDER_BOOK_ACTIONS.DISCONNECT_WEBSOCKET;
}

export interface WebSocketConnectedAction {
  type: typeof ORDER_BOOK_ACTIONS.WEBSOCKET_CONNECTED;
}

export interface WebSocketDisconnectedAction {
  type: typeof ORDER_BOOK_ACTIONS.WEBSOCKET_DISCONNECTED;
}

export interface WebSocketErrorAction {
  type: typeof ORDER_BOOK_ACTIONS.WEBSOCKET_ERROR;
  payload: string;
}

export interface SubscribeToSymbolAction {
  type: typeof ORDER_BOOK_ACTIONS.SUBSCRIBE_TO_SYMBOL;
  payload: {
    symbol: string;
    precision: string;
  };
}

export interface UnsubscribeFromSymbolAction {
  type: typeof ORDER_BOOK_ACTIONS.UNSUBSCRIBE_FROM_SYMBOL;
  payload: string;
}

export interface UpdateOrderBookAction {
  type: typeof ORDER_BOOK_ACTIONS.UPDATE_ORDER_BOOK;
  payload: {
    bids?: [number, number, number][];
    asks?: [number, number, number][];
  };
}

export interface OrderBookSnapshotAction {
  type: typeof ORDER_BOOK_ACTIONS.ORDER_BOOK_SNAPSHOT;
  payload: {
    bids: [number, number, number][];
    asks: [number, number, number][];
  };
}

export interface SetPrecisionAction {
  type: typeof ORDER_BOOK_ACTIONS.SET_PRECISION;
  payload: number;
}

export interface SetScaleAction {
  type: typeof ORDER_BOOK_ACTIONS.SET_SCALE;
  payload: number;
}

export interface ChangePrecisionAction {
  type: typeof ORDER_BOOK_ACTIONS.CHANGE_PRECISION;
  payload: number;
}

export interface SetErrorAction {
  type: typeof ORDER_BOOK_ACTIONS.SET_ERROR;
  payload: string;
}

export interface ClearErrorAction {
  type: typeof ORDER_BOOK_ACTIONS.CLEAR_ERROR;
}

export type OrderBookAction =
  | ConnectWebSocketAction
  | DisconnectWebSocketAction
  | WebSocketConnectedAction
  | WebSocketDisconnectedAction
  | WebSocketErrorAction
  | SubscribeToSymbolAction
  | UnsubscribeFromSymbolAction
  | UpdateOrderBookAction
  | OrderBookSnapshotAction
  | SetPrecisionAction
  | SetScaleAction
  | ChangePrecisionAction
  | SetErrorAction
  | ClearErrorAction;

// Action Creators
export const connectWebSocket = (): ConnectWebSocketAction => ({
  type: ORDER_BOOK_ACTIONS.CONNECT_WEBSOCKET,
});

export const disconnectWebSocket = (): DisconnectWebSocketAction => ({
  type: ORDER_BOOK_ACTIONS.DISCONNECT_WEBSOCKET,
});

export const webSocketConnected = (): WebSocketConnectedAction => ({
  type: ORDER_BOOK_ACTIONS.WEBSOCKET_CONNECTED,
});

export const webSocketDisconnected = (): WebSocketDisconnectedAction => ({
  type: ORDER_BOOK_ACTIONS.WEBSOCKET_DISCONNECTED,
});

export const webSocketError = (error: string): WebSocketErrorAction => ({
  type: ORDER_BOOK_ACTIONS.WEBSOCKET_ERROR,
  payload: error,
});

export const subscribeToSymbol = (symbol: string, precision: string): SubscribeToSymbolAction => ({
  type: ORDER_BOOK_ACTIONS.SUBSCRIBE_TO_SYMBOL,
  payload: { symbol, precision },
});

export const unsubscribeFromSymbol = (symbol: string): UnsubscribeFromSymbolAction => ({
  type: ORDER_BOOK_ACTIONS.UNSUBSCRIBE_FROM_SYMBOL,
  payload: symbol,
});

export const updateOrderBook = (
  data: { bids?: [number, number, number][]; asks?: [number, number, number][] }
): UpdateOrderBookAction => ({
  type: ORDER_BOOK_ACTIONS.UPDATE_ORDER_BOOK,
  payload: data,
});

export const orderBookSnapshot = (
  data: { bids: [number, number, number][]; asks: [number, number, number][] }
): OrderBookSnapshotAction => ({
  type: ORDER_BOOK_ACTIONS.ORDER_BOOK_SNAPSHOT,
  payload: data,
});

export const setPrecision = (precision: number): SetPrecisionAction => ({
  type: ORDER_BOOK_ACTIONS.SET_PRECISION,
  payload: precision,
});

export const setScale = (scale: number): SetScaleAction => ({
  type: ORDER_BOOK_ACTIONS.SET_SCALE,
  payload: scale,
});

export const changePrecision = (precision: number): ChangePrecisionAction => ({
  type: ORDER_BOOK_ACTIONS.CHANGE_PRECISION,
  payload: precision,
});

export const setError = (error: string): SetErrorAction => ({
  type: ORDER_BOOK_ACTIONS.SET_ERROR,
  payload: error,
});

export const clearError = (): ClearErrorAction => ({
  type: ORDER_BOOK_ACTIONS.CLEAR_ERROR,
});