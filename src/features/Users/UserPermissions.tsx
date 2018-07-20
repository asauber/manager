import * as React from 'react';

import { StyleRulesCallback, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import Grid from 'src/components/Grid';
import Toggle from 'src/components/Toggle';
import { getGrants } from 'src/services/account';

type ClassNames = 'titleWrapper' | 'topGrid';

const styles: StyleRulesCallback<ClassNames> = (theme: Theme) => ({
  topGrid: {
    marginTop: -(theme.spacing.unit * 2),
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
});

interface Props {
  username?: string;
}

interface State {
  grants?: Linode.Grants;
  restricted: boolean;
  errors?: Linode.ApiFieldError[];
}

type CombinedProps = Props & WithStyles<ClassNames>;

class UserPermissions extends React.Component<CombinedProps, State> {
  state: State = {
    restricted: true,
  };

  getUserGrants = () => {
    const { username } = this.props;
    if (username) {
      getGrants(username)
        .then((grants) => {
          this.setState({
            grants,
          })
          console.log(grants);
        })
        .catch((errResponse) => {
          this.setState({
            errors: [{ reason: 
              'Unknown error occured while fetching user permissions. Try again later.'}]
          })
        });
    }
  }

  componentDidUpdate(prevProps: CombinedProps) {
    if (prevProps.username !== this.props.username) {
      this.getUserGrants();
}
  }

  onChangeRestricted = () => {
    this.setState({
      restricted: !this.state.restricted,
    })
  }

  render() {
    const { classes } = this.props;
    const { restricted } = this.state;

    return (
      <React.Fragment>
        <Grid container className={classes.topGrid} justify="space-between">
          <Grid item className={classes.titleWrapper}>
            <Typography variant="title">
              Update User Permissions
            </Typography>
          </Grid>
          <Grid item>
            <Grid container alignItems="center">
              <Grid item>
                <Typography variant="title">
                  Restrict Access:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="title">
                  {restricted
                    ? 'On'
                    : 'Off'
                  }
                </Typography>
              </Grid>
              <Grid item>
                <Toggle
                  checked={restricted}
                  onChange={this.onChangeRestricted}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </React.Fragment>
    )
  }
}

const styled = withStyles(styles, { withTheme: true });

export default styled(UserPermissions);
