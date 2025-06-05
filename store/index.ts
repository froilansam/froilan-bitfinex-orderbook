import { configureStore } from "@reduxjs/toolkit";

import { orderBookReducer } from "./reducers/orderBookReducer";
import rootSaga from "./sagas/index";

const createSagaMiddleware = require("redux-saga").default;

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    orderBook: orderBookReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
      thunk: false,
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Initialize saga middleware
try {
  sagaMiddleware.run(rootSaga);
} catch (error) {
  console.error("Error starting saga middleware:", error);
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
