import * as React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import ActionMenu, { Action } from 'src/components/ActionMenu/ActionMenu';

interface Props {
  onView: () => void;
  onEdit: () => void;
}

type CombinedProps = Props & RouteComponentProps<{}>;

class LinodeNetworkingActionMenu extends React.Component<CombinedProps> {
  createActions = () => {
    const {
      onView,
      onEdit,
    } = this.props;

    return function (closeMenu: Function): Action[] {
      const actions = [
        {
          title: 'View',
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            onView();
            closeMenu();
            e.preventDefault();
          },
        },
        {
          title: 'Edit',
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            onEdit();
            closeMenu();
            e.preventDefault();
          },
        },
      ];
      return actions;
    };
  }

  render() {
    return (
      <ActionMenu createActions={this.createActions()} />
    );
  }
}

export default withRouter(LinodeNetworkingActionMenu);