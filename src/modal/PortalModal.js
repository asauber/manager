import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { ModalShell } from 'linode-components';


class PortalModal extends Component {
  constructor(props) {
    super(props);
    this.selector = document.getElementById('portal-modal');
  }

  getPathFromChildren(children) {
    if (Array.isArray(children)) {
      return children[0].props.title;
    } else if (typeof(children) === 'object') {
      return children.props.title;
    }
  }

  getTitleFromChildren(children) {
    if (Array.isArray(children)) {
      return children[0].props.title;
    } else if (typeof(children) === 'object') {
      return children.props.title;
    }
  }

  getOnCloseFromChildren(children) {
    if (Array.isArray(children)) {
      return children[0].props.onClose;
    } else if (typeof(children) === 'object') {
      return children.props.onClose;
    }
  }

  render() {
    const { children } = this.props;

    const title = this.getTitleFromChildren(children);
    const onClose = this.getOnCloseFromChildren(children);

    return ReactDOM.createPortal(
      <ModalShell
        open /* close the modal by not rendering the PortalModal */
        title={title}
        close={onClose}
        {...this.props} /* children get passed to the ModalShell */
      />,
      this.selector
    );
  }
}

PortalModal.propTypes = {
  children: PropTypes.any.isRequired,
};

export default PortalModal;
