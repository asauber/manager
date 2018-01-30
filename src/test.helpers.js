import isFunction from 'lodash/isFunction';
import sinon from 'sinon';

import { fetch } from '~/api/fetch';

import { state } from '~/data';


/**
 * Asserts that a certain kind of request occurs when you invoke the provided
 * function.
 * @param {Function} fn - The (async) function to invoke
 * @param {string} path - The path you expect it to be called with
 * @param {Object} expectedRequestData - Data that fetch is expected to be called with
 * @param {Object} response - The data that is returned by the fetch call
 * occured to dispatch
 */
export async function expectRequest(
  fn,
  path,
  expectedRequestData = {},
  response = {},
  fetchStub = null
) {
  const sandbox = sinon.sandbox.create();
  let checkedRequestData = false;

  const { method = 'get' } = expectedRequestData;
  // eslint-disable-next-line no-param-reassign
  delete expectedRequestData.method;

  try {
    expect(typeof fn).toBe('function');

    if (!fetchStub) {
      // eslint-disable-next-line no-param-reassign
      fetchStub = sandbox.stub(fetch, method.toLowerCase()).returns({
        json: () => response,
      });
    }

    const dispatch = jest.fn(() => response);
    await fn(dispatch, () => state);

    // This covers the set of API calls that use the thunkFetch helper to make requests.
    if (isFunction(dispatch.mock.calls[0] && dispatch.mock.calls[0][0])) {
      const _dispatch = jest.fn(() => response);
      await dispatch.mock.calls[0][0](_dispatch, () => state);
      if (_dispatch.mock.calls.length === 1 && isFunction(_dispatch.mock.calls[0][0])) {
        await expectRequest(
          _dispatch.mock.calls[0][0], path, expectedRequestData, response, fetchStub);
        checkedRequestData = true;
      }
    }

    if (!checkedRequestData) {
      expect(fetchStub.callCount).toEqual(1);
      expect(fetchStub.firstCall.args[0]).toEqual(path);

      const requestData = fetchStub.firstCall.args[1];

      const body = expectedRequestData.body;
      if (body) {
        Object.keys(body).map(key => expect(requestData[key]).toEqual(body[key]));
      }

      checkedRequestData = true;
    }

    if (!checkedRequestData) {
      throw new Error(`Failed to check response data:\n${JSON.stringify(expectedRequestData)}`);
    }

    sandbox.restore();
  } catch (e) {
    try {
      sandbox.restore();
    } catch (e) { /* pass */ }

    throw new Error(`Error testing call ${path}:\n\t${e.message}`);
  }
}

export async function expectDispatchOrStoreErrors(fn,
  expectArgs = [],
  expectN = undefined,
  dispatchResults = []) {
  const sandbox = sinon.sandbox.create();
  const dispatch = sandbox.stub();

  try {
    for (let i = 0; i < dispatchResults.length; i += 1) {
      dispatch.onCall(i).returns(dispatchResults[i]);
    }

    await fn(dispatch, () => state);

    if (expectN !== undefined) {
      expect(expectN).toEqual(dispatch.callCount);
    }

    for (let i = 0; i < dispatch.callCount; i += 1) {
      const nextArgs = dispatch.args[i];
      const nextExpect = expectArgs[i];
      if (nextExpect) {
        await nextExpect(nextArgs);
      }
    }
  } finally {
    sandbox.restore();
  }
}

export function changeInput(component, idName, value, options = {}) {
  const selector = { name: idName };

  try {
    let input = component;

    if (!options.nameOnly) {
      selector.id = idName;
    }

    if (options.displayName) {
      input = input.find(options.displayName);
    }

    input = input.find(selector);

    if (input.length > 1 && input.at(0).props().type === 'radio') {
      input = input.at(0);
    }

    // Work-around for testing the Select component with multiple values.
    if (Array.isArray(value)) {
      input.props().onChange(value.map(value => ({ target: { value, name: idName } })));
      return;
    }

    const event = { target: { value, name: idName, checked: value } };

    if (input.length === 0 && options.displayName) {
      const selectorsMatch = (props) =>
        Object.values(selector).reduce(
          (field, matched) => matched && props[field] === selector[field], false);
      const componentWithSelectorAttributes = component.findWhere(
        o => o.name() === options.displayName && selectorsMatch(o.props()));
      componentWithSelectorAttributes.props().onChange(event);
      return;
    }

    input.simulate('change', event);
  } catch (e) {
    const eWithMoreInfo = e;
    eWithMoreInfo.message = `${e.message}: ${JSON.stringify(selector)}`;
    throw eWithMoreInfo;
  }
}
/**
 *
 * @param {string} name
 * @param {*} value
 * @returns {object}
 */
export function createSimulatedEvent(name, value) {
  return {
    target: {
      name,
      value,
      checked: value,
    },
  };
}
