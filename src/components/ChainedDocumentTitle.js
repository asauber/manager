import PropTypes from 'prop-types';
import { Children, Component } from 'react';
import { connect } from 'react-redux';
import withSideEffect from 'react-side-effect';

import { addTitleSlug } from '~/actions';

/* Based on DocumentTitle, but uses all of title props in the ReactDOM instead
 * of just the innermost one.
 * https://github.com/gaearon/react-document-title
 */
class ChainedDocumentTitle extends Component {
  /*
  componentWillMount() {
    const { dispatch, title } = this.props;
    dispatch(addTitleSlug(title));
  }

  componentWillReceiveProps(props) {
    document.title = props.titleSlugs.join(' - ');
  }
  */

  render() {
    return this.props.children ?
      Children.only(this.props.children) :
      null;
  }
}

ChainedDocumentTitle.propTypes = {
  dispatch: PropTypes.func,
  title: PropTypes.string.isRequired,
  titleSlugs: PropTypes.array.isRequired,
  children: PropTypes.node,
};

/* This is a react-side-effect callback that is passed a list of component objects
 * containing all of the components of this type in the ReactDOM. They are in
 * heirarchical order. The expected return value is a reduced state object.
 */
function reducePropsToState(propsList) {
  const titles = propsList.map(cdt => cdt.title).reverse();
  return titles.join(' - ');
}

/* This is a react-side-effect callback. It is called every time the state is
 * reduced by the above function.
 */
function handleStateChangeOnClient(title) {
  //  document.title = title || '';
}

function select(state) {
  const titleSlugs = state.title.titleSlugs;
  return { titleSlugs };
}

export default connect(select)(withSideEffect(
  reducePropsToState,
  handleStateChangeOnClient,
)(ChainedDocumentTitle));
