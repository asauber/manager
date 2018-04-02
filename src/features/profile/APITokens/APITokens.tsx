import * as React from 'react';
import * as moment from 'moment';
import Axios from 'axios';
import { pathOr } from 'ramda';

import { withStyles, Theme, WithStyles, StyleRulesCallback } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import Typography from 'material-ui/Typography';
import Table from 'material-ui/Table';
import TableBody from 'material-ui/Table/TableBody';
import TableCell from 'material-ui/Table/TableCell';
import TableHead from 'material-ui/Table/TableHead';
import TableRow from 'material-ui/Table/TableRow';

import { API_ROOT } from 'src/constants';
import PromiseLoader, { PromiseLoaderResponse } from 'src/components/PromiseLoader/PromiseLoader';
import IconTextLink from 'src/components/IconTextLink';

import APITokenMenu from './APITokenMenu';
import APITokenDrawer, { DrawerMode } from './APITokenDrawer';

type ClassNames = 'headline';

const styles: StyleRulesCallback<ClassNames> = (theme: Theme) => {
  return ({
    headline: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit * 2,
    },
  });
};

const preloaded = PromiseLoader<Props>({
  pats: () => Axios.get(`${API_ROOT}/profile/tokens`)
    .then(response => response.data),
  appTokens: () => Axios.get(`${API_ROOT}/profile/apps`)
    .then(response => response.data),
});

interface Props {
  pats: PromiseLoaderResponse<Linode.ManyResourceState<Linode.Token>>;
  appTokens: PromiseLoaderResponse<Linode.ManyResourceState<Linode.Token>>;
}

interface State {
  drawerOpen: boolean;
  activeToken: Linode.Token | null;
  drawerMode: DrawerMode;
}

type CombinedProps = Props & WithStyles<ClassNames>;

class APITokens extends React.Component<CombinedProps, State> {
  state = {
    drawerOpen: false,
    drawerMode: 'view' as DrawerMode,
    activeToken: null,
  };

  renderTokenTable(
    title: string,
    type: string,
    tokens: Linode.Token[],
  ) {
    const { classes } = this.props;

    return (
      <React.Fragment>
        <Typography variant="headline" className={classes.headline}>
          {title}
        </Typography>
        {type === 'Personal Access Token' &&
          <IconTextLink
            SideIcon={PlusSquare}
            onClick={() => this.toggleCreateDrawer(true)}
            text="Create an OAuth Client"
            title="Link title"
          />
        }
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Label</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token: Linode.Token) =>
                <TableRow key={token.id}>
                  <TableCell>
                    <Typography variant="subheading">
                      {token.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {token.created}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {token.expiry}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <APITokenMenu
                      openViewDrawer={() => {
                        this.openDrawer(token);
                      }}
                    />
                  </TableCell>
                </TableRow>,
              )}
            </TableBody>
          </Table>
        </Paper>
      </React.Fragment>
    );
  }

  formatDates(tokens: Linode.Token[]): Linode.Token[] {
    const aLongTimeFromNow = moment.utc().add(100, 'year');
    return tokens.map((token) => {
      const created = moment(token.created);
      const expiry = moment(token.expiry);
      return {
        ...token,
        created: created > aLongTimeFromNow ? 'never' : created.fromNow(),
        expiry: expiry > aLongTimeFromNow ? 'never' : expiry.fromNow(),
      };
    });
  }

  openDrawer = (token: Linode.Token) => {
    this.setState({ activeToken: token });
    this.setState({ drawerOpen: true });
  }

  closeDrawer = () => {
    this.setState({ drawerOpen: false });
  }

  render() {
    const { drawerOpen, activeToken, drawerMode } = this.state;
    const appTokens = this.formatDates(
      pathOr([], ['response', 'data'], this.props.appTokens));
    const pats = this.formatDates(
      pathOr([], ['response', 'data'], this.props.pats));

    return (
      <React.Fragment>
        {this.renderTokenTable(
          'Apps',
          'OAuth Client Token',
          appTokens,
        )}
        {this.renderTokenTable(
          'Personal Access Tokens',
          'Personal Access Token',
          pats,
        )}
        <APITokenDrawer
          activeToken={activeToken}
          drawerOpen={drawerOpen}
          drawerMode={drawerMode}
          closeDrawer={this.closeDrawer}
        />
      </React.Fragment>
    );
  }
}

const styled = withStyles(styles, { withTheme: true })<Props>(APITokens);

export default preloaded(styled);
