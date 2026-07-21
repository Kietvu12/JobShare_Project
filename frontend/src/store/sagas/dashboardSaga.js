import { call, put, takeLatest } from 'redux-saga/effects';
import apiService from '../../services/api';
import {
  FETCH_DASHBOARD_REQUEST,
  FETCH_DASHBOARD_SUCCESS,
  FETCH_DASHBOARD_FAILURE,
  FETCH_DASHBOARD_CHART_REQUEST,
  FETCH_DASHBOARD_CHART_SUCCESS,
  FETCH_DASHBOARD_CHART_FAILURE,
} from '../actions/dashboardActions';

let dashboardInFlight = false;
let dashboardChartInFlight = false;

function* fetchDashboardSaga() {
  if (dashboardInFlight) return;
  dashboardInFlight = true;
  try {
    const response = yield call(apiService.getDashboard);
    if (response.success && response.data) {
      yield put({ type: FETCH_DASHBOARD_SUCCESS, payload: response.data });
    } else {
      yield put({ type: FETCH_DASHBOARD_FAILURE, payload: response.message || 'Failed to fetch dashboard data' });
    }
  } catch (error) {
    yield put({ type: FETCH_DASHBOARD_FAILURE, payload: error.message || 'An error occurred while fetching dashboard data' });
  } finally {
    dashboardInFlight = false;
  }
}

function* fetchDashboardChartSaga(action) {
  if (dashboardChartInFlight) return;
  dashboardChartInFlight = true;
  try {
    const response = yield call(apiService.getDashboardChart, action.payload);
    if (response.success && response.data) {
      yield put({ type: FETCH_DASHBOARD_CHART_SUCCESS, payload: response.data });
    } else {
      yield put({ type: FETCH_DASHBOARD_CHART_FAILURE, payload: response.message || 'Failed to fetch chart data' });
    }
  } catch (error) {
    yield put({ type: FETCH_DASHBOARD_CHART_FAILURE, payload: error.message || 'An error occurred while fetching chart data' });
  } finally {
    dashboardChartInFlight = false;
  }
}

export function* dashboardSaga() {
  yield takeLatest(FETCH_DASHBOARD_REQUEST, fetchDashboardSaga);
  yield takeLatest(FETCH_DASHBOARD_CHART_REQUEST, fetchDashboardChartSaga);
}

