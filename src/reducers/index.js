import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import analytics from './analytics';
import api from '../api/reducer';
import authentication from './authentication';
import errors from './errors';
import events from './events';
import modal from './modal';
import notifications from './notifications';
import preloadIndicator from './preloadIndicator';
import select from './select';
import session from './session';
import source from './source';
import title from './title';

const appReducer = combineReducers({
  analytics,
  api,
  authentication,
  errors,
  events,
  modal,
  notifications,
  preloadIndicator,
  routing: routerReducer,
  select,
  session,
  source,
  title,
});

export default function rootReducer(state, action) {
  return appReducer(state, action);
}
