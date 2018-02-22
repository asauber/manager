import * as React from 'react';

import {
  withStyles,
  StyledComponentProps,
} from 'material-ui/styles';
import Hidden from 'material-ui/Hidden';
import Drawer from 'material-ui/Drawer';

import PrimaryNav from 'src/components/PrimaryNav';

import { TodoAny } from 'src/utils';

export const menuWidth = 250;

const styles = (theme: any): any => ({
  menuPaper: {
    height: '100%',
    width: menuWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
  },
  menuDocked: {
    height: '100%',
  },
});

interface Props extends StyledComponentProps {
  open: boolean;
  toggle: () => void;
}

interface DefaultProps  {
  classes: {};
}

type PropsWithDefaults = Props & DefaultProps;

class SideMenu extends React.Component<Props> {
  static defaultProps = {
    classes: {},
  };

  render() {
    const { classes, open, toggle } = this.props as PropsWithDefaults;

    return (
      <React.Fragment>
        <Hidden mdUp>
          <Drawer
            variant="temporary"
            open={open}
            classes={{ paper: classes.menuPaper }}
            onClose={toggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            <PrimaryNav toggleMenu={toggle} />
          </Drawer>
        </Hidden>
        <Hidden smDown implementation="css">
          <Drawer
            variant="permanent"
            open
            classes={{
              paper: classes.menuPaper,
              docked: classes.menuDocked,
            }}
          >
            <PrimaryNav toggleMenu={toggle} />
          </Drawer>
        </Hidden>
      </React.Fragment>
    );
  }
}

export default withStyles(styles, { withTheme: true })(
  SideMenu as TodoAny,
) as TodoAny;
