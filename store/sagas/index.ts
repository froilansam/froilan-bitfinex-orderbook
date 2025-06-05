import { all, fork } from 'redux-saga/effects';
import orderBookSaga from './orderBookSaga';

export default function* rootSaga() {
  yield all([
    fork(orderBookSaga),
  ]);
}