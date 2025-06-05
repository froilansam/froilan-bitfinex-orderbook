export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  symbol: string;
  lastUpdated: number;
}

export interface OrderBookState {
  data: OrderBook | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  precision: number;
  scale: number;
}

export interface WebSocketMessage {
  channel: string;
  data: any[];
}