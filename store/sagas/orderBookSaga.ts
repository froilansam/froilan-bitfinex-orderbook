import { eventChannel, EventChannel, SagaIterator } from "redux-saga";
import {
  call,
  cancel,
  cancelled,
  delay,
  fork,
  put,
  select,
  take,
} from "redux-saga/effects";

import {
  connectWebSocket,
  setOrderBookData,
  setPrecision,
  updateOrderBook,
  webSocketConnected,
  webSocketDisconnected,
  webSocketError,
} from "../reducers/orderBookReducer";

const BITFINEX_WS_URL = "wss://api-pub.bitfinex.com/ws/2";
const HEARTBEAT_INTERVAL = 30000;

const getCurrentPrecision = (state: any) => state.orderBook.precision;

function createWebSocketChannel(url: string, precision: number = 0): EventChannel<any> {
  return eventChannel((emitter) => {
    let ws: WebSocket | null = null;
    let heartbeatTimer: any = null;
    let currentChannelId: number | null = null;

    const getPrecisionString = (level: number): string => {
      return `P${Math.max(0, Math.min(4, level))}`;
    };

    const subscribeToOrderBook = (precisionLevel: number): void => {
      const subscribeMsg = {
        event: "subscribe",
        channel: "book",
        symbol: "tBTCUSD",
        prec: getPrecisionString(precisionLevel),
        freq: "F0",
        len: "25",
      };

      console.log("subscribeMsg", JSON.stringify(subscribeMsg, null, 2));

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(subscribeMsg));
        console.log(`[WebSocket] Subscribed to BTCUSD order book with precision ${getPrecisionString(precisionLevel)}`);
      }
    };


    const connect = (): void => {
      try {
        console.log(`[WebSocket] Connecting to: ${url}`);
        ws = new WebSocket(url);

        ws.onopen = (): void => {
          console.log("[WebSocket] Connected successfully");
          emitter({ type: "CONNECTED" });

          // Subscribe to BTC/USD order book with specified precision
          subscribeToOrderBook(precision);

          // Start heartbeat
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: "ping" }));
            }
          }, HEARTBEAT_INTERVAL);
        };

        ws.onmessage = (event: MessageEvent): void => {
          try {
            const data = JSON.parse(event.data);

            // Capture channel ID from subscription confirmation
            if (data.event === "subscribed" && data.channel === "book") {
              currentChannelId = data.chanId;
              console.log(
                `[WebSocket] Captured channel ID: ${currentChannelId}`
              );
            }

            emitter({ type: "MESSAGE", payload: data });
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
            emitter({
              type: "ERROR",
              payload: "Failed to parse WebSocket message",
            });
          }
        };

        ws.onclose = (event: CloseEvent): void => {
          console.log(
            `[WebSocket] Connection lost: ${event.code} - ${event.reason}`
          );

          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          // Always emit disconnected - no auto-reconnection
          // User must manually reconnect to preserve last data
          emitter({
            type: "DISCONNECTED",
            payload: event.reason || "Connection lost",
          });
        };

        ws.onerror = (error: Event): void => {
          console.error("[WebSocket] Error:", error);
          emitter({ type: "ERROR", payload: "WebSocket connection error" });
        };
      } catch (error) {
        console.error("[WebSocket] Failed to create connection:", error);
        emitter({
          type: "ERROR",
          payload: "Failed to create WebSocket connection",
        });
      }
    };

    connect();

    // Cleanup function
    return (): void => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (ws) {
        ws.close(1000, "Component unmounted");
      }
    };
  });
}

function* handleWebSocketMessage(message: any): SagaIterator {
  try {
    console.log("[WebSocket] Received message:", message);

    // Handle channel data messages
    if (Array.isArray(message)) {
      const [, data] = message;

      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          // Initial snapshot - multiple orders
          console.log("[WebSocket] Processing order book snapshot");
          const bids: [number, number, number][] = [];
          const asks: [number, number, number][] = [];

          data.forEach(([price, count, amount]: [number, number, number]) => {
            // For snapshots, only include entries with count > 0
            if (count > 0) {
              if (amount > 0) {
                bids.push([price, count, amount]);
              } else if (amount < 0) {
                asks.push([price, count, Math.abs(amount)]);
              }
            }
          });

          yield put(setOrderBookData({ bids, asks }));
        } else {
          // Real-time update - single order
          const [price, count, amount] = data as [number, number, number];
          console.log(
            `[WebSocket] Real-time update: ${price} ${count} ${amount}`
          );

          if (count > 0) {
            // Add or update price level
            if (amount > 0) {
              // Add/update bids
              yield put(updateOrderBook({ bids: [[price, count, amount]] }));
            } else if (amount < 0) {
              // Add/update asks
              yield put(
                updateOrderBook({ asks: [[price, count, Math.abs(amount)]] })
              );
            }
          } else if (count === 0) {
            // Delete price level
            if (amount === 1) {
              // Remove from bids
              yield put(updateOrderBook({ bids: [[price, 0, 0]] }));
            } else if (amount === -1) {
              // Remove from asks
              yield put(updateOrderBook({ asks: [[price, 0, 0]] }));
            }
          }
        }
      }
    } else if (message.event) {
      // Handle event messages
      switch (message.event) {
        case "info":
          console.log("[WebSocket] Info:", message);
          break;
        case "subscribed":
          console.log(
            `[WebSocket] Subscribed to ${message.channel}: ${message.symbol}`
          );
          break;
        case "error":
          console.error("[WebSocket] Error event:", message);
          yield put(webSocketError(message.msg || "Unknown WebSocket error"));
          break;
        case "pong":
          // Heartbeat response - connection is alive
          break;
        default:
          console.log("[WebSocket] Unknown event:", message);
      }
    }
  } catch (error) {
    console.error("[WebSocket] Error processing message:", error);
    yield put(webSocketError("Failed to process WebSocket message"));
  }
}

function* webSocketFlow(precision: number = 0): SagaIterator {
  let channel: EventChannel<any> | null = null;

  try {
    console.log("[WebSocketFlow] Starting WebSocket connection flow");
    channel = yield call(createWebSocketChannel, BITFINEX_WS_URL, precision);

    if (!channel) {
      throw new Error("Failed to create WebSocket channel");
    }

    while (true) {
      const message = yield take(channel);

      switch (message.type) {
        case "CONNECTED":
          console.log("[WebSocketFlow] WebSocket connected");
          yield put(webSocketConnected());
          break;
        case "MESSAGE":
          yield fork(handleWebSocketMessage, message.payload);
          break;
        case "DISCONNECTED":
          console.log(
            "[WebSocketFlow] WebSocket disconnected - keeping last data"
          );
          yield put(webSocketDisconnected());
          if (channel) {
            channel.close();
          }
          return;
        case "ERROR":
          console.error("[WebSocketFlow] WebSocket error:", message.payload);
          yield put(webSocketError(message.payload));
          if (channel) {
            channel.close();
          }
          return;
      }
    }
  } catch (error) {
    console.error("[WebSocketFlow] Flow error:", error);
    yield put(webSocketError("WebSocket connection failed"));
  } finally {
    if (yield cancelled()) {
      console.log("[WebSocketFlow] WebSocket saga cancelled");
      if (channel) {
        try {
          channel.close();
        } catch {
          // Channel might already be closed
        }
      }
    }
  }
}

function* webSocketSaga(): SagaIterator {
  while (true) {
    try {
      console.log("[WebSocketSaga] Waiting for connect action");
      yield take(connectWebSocket.type);

      console.log("[WebSocketSaga] Starting WebSocket connection");
      const currentPrecision = yield select(getCurrentPrecision);
      const webSocketTask = yield fork(webSocketFlow, currentPrecision);

      // Wait for disconnect action
      yield take("orderBook/disconnectWebSocket");
      console.log("[WebSocketSaga] Disconnecting WebSocket");

      yield cancel(webSocketTask);
      yield put(webSocketDisconnected());
    } catch (error) {
      console.error("[WebSocketSaga] Saga error:", error);
      yield put(webSocketError("WebSocket saga failed"));
    }
  }
}

function* precisionChangeSaga(): SagaIterator {
  while (true) {
    try {
      const action = yield take("orderBook/changePrecision");
      console.log(
        `[PrecisionSaga] Precision change requested: ${action.payload}`
      );

      // Set the new precision and put into loading state
      yield put(setPrecision(action.payload));

      // Get current connection state
      const state = yield select((state: any) => state.orderBook);

      if (state.isConnected) {
        console.log("[PrecisionSaga] Reconnecting with new precision level...");

        // Put into loading state
        yield put({ type: "orderBook/connectWebSocket" });

        // Disconnect current connection
        yield put({ type: "orderBook/disconnectWebSocket" });

        // Wait a moment for disconnection
        yield delay(200);

        // Reconnect with new precision
        yield put({ type: "orderBook/connectWebSocket" });
      }
    } catch (error) {
      console.error("[PrecisionSaga] Error changing precision:", error);
      yield put(webSocketError("Failed to change precision"));
    }
  }
}

export default function* orderBookSaga(): SagaIterator {
  yield fork(webSocketSaga);
  yield fork(precisionChangeSaga);
}
