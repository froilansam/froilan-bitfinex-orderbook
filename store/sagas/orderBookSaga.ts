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

function createWebSocketChannel(
  url: string,
  precision: number = 0
): EventChannel<any> {
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

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(subscribeMsg));
      }
    };

    const connect = (): void => {
      try {
        ws = new WebSocket(url);

        ws.onopen = (): void => {
          emitter({ type: "CONNECTED" });

          subscribeToOrderBook(precision);

          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: "ping" }));
            }
          }, HEARTBEAT_INTERVAL);
        };

        ws.onmessage = (event: MessageEvent): void => {
          try {
            const data = JSON.parse(event.data);

            if (data.event === "subscribed" && data.channel === "book") {
              currentChannelId = data.chanId;
            }

            emitter({ type: "MESSAGE", payload: data });
          } catch (error) {
            emitter({
              type: "ERROR",
              payload: "Failed to parse WebSocket message",
            });
          }
        };

        ws.onclose = (event: CloseEvent): void => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          emitter({
            type: "DISCONNECTED",
            payload: event.reason || "Connection lost",
          });
        };

        ws.onerror = (error: Event): void => {
          emitter({ type: "ERROR", payload: "WebSocket connection error" });
        };
      } catch (error) {
        emitter({
          type: "ERROR",
          payload: "Failed to create WebSocket connection",
        });
      }
    };

    connect();

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
    if (Array.isArray(message)) {
      const [, data] = message;

      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          const bids: [number, number, number][] = [];
          const asks: [number, number, number][] = [];

          data.forEach(([price, count, amount]: [number, number, number]) => {
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
          const [price, count, amount] = data as [number, number, number];

          if (count > 0) {
            if (amount > 0) {
              yield put(updateOrderBook({ bids: [[price, count, amount]] }));
            } else if (amount < 0) {
              yield put(
                updateOrderBook({ asks: [[price, count, Math.abs(amount)]] })
              );
            }
          } else if (count === 0) {
            if (amount === 1) {
              yield put(updateOrderBook({ bids: [[price, 0, 0]] }));
            } else if (amount === -1) {
              yield put(updateOrderBook({ asks: [[price, 0, 0]] }));
            }
          }
        }
      }
    } else if (message.event) {
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
          yield put(webSocketError(message.msg || "Unknown WebSocket error"));
          break;
        case "pong":
          break;
        default:
          console.log("[WebSocket] Unknown event:", message);
      }
    }
  } catch (error) {
    yield put(webSocketError("Failed to process WebSocket message"));
  }
}

function* webSocketFlow(precision: number = 0): SagaIterator {
  let channel: EventChannel<any> | null = null;

  try {
    channel = yield call(createWebSocketChannel, BITFINEX_WS_URL, precision);

    if (!channel) {
      throw new Error("Failed to create WebSocket channel");
    }

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
          if (channel) {
            channel.close();
          }
          return;
        case "ERROR":
          yield put(webSocketError(message.payload));
          if (channel) {
            channel.close();
          }
          return;
      }
    }
  } catch (error) {
    yield put(webSocketError("WebSocket connection failed"));
  } finally {
    if (yield cancelled()) {
      if (channel) {
        try {
          channel.close();
        } catch {
          // addinfg this if the channel is closed already
        }
      }
    }
  }
}

function* webSocketSaga(): SagaIterator {
  while (true) {
    try {
      yield take(connectWebSocket.type);

      const currentPrecision = yield select(getCurrentPrecision);
      const webSocketTask = yield fork(webSocketFlow, currentPrecision);

      yield take("orderBook/disconnectWebSocket");

      yield cancel(webSocketTask);
      yield put(webSocketDisconnected());
    } catch (error) {
      yield put(webSocketError("WebSocket saga failed"));
    }
  }
}

function* precisionChangeSaga(): SagaIterator {
  while (true) {
    try {
      const action = yield take("orderBook/changePrecision");

      yield put(setPrecision(action.payload));

      const state = yield select((state: any) => state.orderBook);

      if (state.isConnected) {
        yield put({ type: "orderBook/connectWebSocket" });

        yield put({ type: "orderBook/disconnectWebSocket" });

        yield delay(200);

        yield put({ type: "orderBook/connectWebSocket" });
      }
    } catch (error) {
      yield put(webSocketError("Failed to change precision"));
    }
  }
}

export default function* orderBookSaga(): SagaIterator {
  yield fork(webSocketSaga);
  yield fork(precisionChangeSaga);
}
