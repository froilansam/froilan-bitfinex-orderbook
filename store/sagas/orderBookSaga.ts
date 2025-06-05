import { eventChannel, EventChannel } from "redux-saga";
import {
  call,
  cancel,
  cancelled,
  delay,
  fork,
  put,
  take,
} from "redux-saga/effects";

import {
  ORDER_BOOK_ACTIONS,
  orderBookSnapshot,
  updateOrderBook,
  webSocketConnected,
  webSocketDisconnected,
  webSocketError,
} from "../actions/orderBookActions";

interface BitfinexWebSocketMessage {
  event?: string;
  channel?: string;
  chanId?: number;
  symbol?: string;
  pair?: string;
  prec?: string;
  freq?: string;
  len?: string;
  msg?: string;
}

const BITFINEX_WS_URL = "wss://api-pub.bitfinex.com/ws/2";
const RECONNECT_DELAY = 3000;
const HEARTBEAT_INTERVAL = 30000;

function createWebSocketChannel(url: string): EventChannel<any> {
  return eventChannel((emitter) => {
    let ws: WebSocket | null = null;
    let heartbeatTimer: any = null;

    const connect = () => {
      try {
        console.log("Creating WebSocket connection to:", url);
        ws = new WebSocket(url);

        ws.onopen = () => {
          console.log("WebSocket connected");
          emitter({ type: "CONNECTED" });

          // Subscribe to order book
          const subscribeMsg = {
            event: "subscribe",
            channel: "book",
            symbol: "BTCUSD",
            prec: "P0",
            freq: "F0",
            len: "25",
          };

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(subscribeMsg));
          }

          // Start heartbeat
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: "ping" }));
            }
          }, HEARTBEAT_INTERVAL);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            emitter({ type: "MESSAGE", payload: data });
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
          }

          if (!event.wasClean) {
            emitter({ type: "DISCONNECTED", payload: "Connection lost" });
          } else {
            emitter({ type: "DISCONNECTED", payload: "Connection closed" });
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          emitter({ type: "ERROR", payload: "WebSocket connection error" });
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        emitter({
          type: "ERROR",
          payload: "Failed to create WebSocket connection",
        });
      }
    };

    connect();

    return () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (ws) {
        ws.close(1000, "Component unmounted");
      }
    };
  });
}

function* handleWebSocketMessage(message: any) {
  try {
    // Handle different message types
    if (Array.isArray(message)) {
      const [chanId, data] = message;

      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          // Snapshot data
          const bids: [number, number, number][] = [];
          const asks: [number, number, number][] = [];

          data.forEach(([price, count, amount]: [number, number, number]) => {
            if (amount > 0) {
              bids.push([price, count, amount]);
            } else {
              asks.push([price, count, Math.abs(amount)]);
            }
          });

          yield put(orderBookSnapshot({ bids, asks }));
        } else {
          // Update data
          const [price, count, amount] = data as [number, number, number];

          if (amount > 0) {
            yield put(updateOrderBook({ bids: [[price, count, amount]] }));
          } else {
            yield put(
              updateOrderBook({ asks: [[price, count, Math.abs(amount)]] })
            );
          }
        }
      }
    } else if (message.event) {
      // Handle event messages
      switch (message.event) {
        case "info":
          console.log("Bitfinex WebSocket info:", message);
          break;
        case "subscribed":
          console.log(
            "Subscribed to channel:",
            message.channel,
            message.symbol
          );
          break;
        case "error":
          console.error("Bitfinex WebSocket error:", message);
          yield put(webSocketError(message.msg || "Unknown error"));
          break;
        case "pong":
          // Heartbeat response
          break;
        default:
          console.log("Unknown event:", message);
      }
    }
  } catch (error) {
    console.error("Error handling WebSocket message:", error);
    yield put(webSocketError("Failed to process message"));
  }
}

function* webSocketFlow() {
  let channel: EventChannel<any> | null = null;

  try {
    channel = yield call(createWebSocketChannel, BITFINEX_WS_URL);
    yield put(webSocketConnected());

    while (true) {
      const message = yield take(channel);

      switch (message.type) {
        case "CONNECTED":
          yield put(webSocketConnected());
          break;
        case "MESSAGE":
          yield fork(handleWebSocketMessage, message.payload);
          break;
        case "DISCONNECTED":
          yield put(webSocketDisconnected());
          channel?.close();
          return;
        case "ERROR":
          yield put(webSocketError(message.payload));
          channel?.close();
          return;
      }
    }
  } catch (error) {
    console.error("WebSocket flow error:", error);
    yield put(webSocketError("WebSocket connection failed"));
  } finally {
    if (yield cancelled()) {
      console.log("WebSocket saga cancelled");
      channel?.close();
    }
  }
}

function* webSocketSaga() {
  while (true) {
    try {
      yield take(ORDER_BOOK_ACTIONS.CONNECT_WEBSOCKET);
      const webSocketTask = yield fork(webSocketFlow);

      // Wait for disconnect action
      yield take(ORDER_BOOK_ACTIONS.DISCONNECT_WEBSOCKET);
      yield cancel(webSocketTask);
      yield put(webSocketDisconnected());
    } catch (error) {
      console.error("WebSocket saga error:", error);
      yield put(webSocketError("WebSocket saga failed"));
      yield delay(RECONNECT_DELAY);
    }
  }
}

export default function* orderBookSaga() {
  yield fork(webSocketSaga);
}
