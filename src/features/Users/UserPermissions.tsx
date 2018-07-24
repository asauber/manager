import { compose, lensPath, pathOr, set } from 'ramda';
import * as React from 'react';

import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import { StyleRulesCallback, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import ActionsPanel from 'src/components/ActionsPanel';
import Button from 'src/components/Button';
import CircleProgress from 'src/components/CircleProgress';
import Grid from 'src/components/Grid';
import Notice from 'src/components/Notice';
import SelectionCard from 'src/components/SelectionCard';
import Toggle from 'src/components/Toggle';
import { getGrants, updateGrants, updateUser } from 'src/services/account';
import getAPIErrorsFor from 'src/utilities/getAPIErrorFor';
import scrollErrorIntoView from 'src/utilities/scrollErrorIntoView';

type ClassNames =
  'titleWrapper'
  | 'topGrid'
  | 'unrestrictedRoot'
  | 'globalSection'
  | 'section';

const styles: StyleRulesCallback<ClassNames> = (theme: Theme) => ({
  topGrid: {
    marginTop: -(theme.spacing.unit * 2),
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  unrestrictedRoot: {
    marginTop: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 3,
  },
  globalSection: {
    marginTop: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 3,
  },
  section: {
    marginTop: theme.spacing.unit * 2,
  },
});

interface Props {
  username?: string;
}

interface State {
  loading: boolean;
  grants?: Linode.Grants;
  restricted?: boolean;
  errors?: Linode.ApiFieldError[];
  success?: {
    global: string,
    specific: string,
  }
}

type CombinedProps = Props & WithStyles<ClassNames>;

class UserPermissions extends React.Component<CombinedProps, State> {
  state: State = {
    loading: true,
  };
  
  globalBooleanPerms = [
    'add_linodes',
    'add_nodebalancers',
    'add_longview',
    'longview_subscription',
    'add_domains',
    'add_stackscripts',
    'add_images',
    'add_volumes',
    'cancel_account'
  ];

  entityPerms = [
    'linode',
    'stackscript',
    'image',
    'volume',
    'nodebalancer',
    'domain',
    'longview',
  ]

  getUserGrants = () => {
    const { username } = this.props;
    if (username) {
      getGrants(username)
        .then((grants) => {
          if (grants.global) {
            this.setState({
              grants,
              loading: false,
              restricted: true,
            })
          } else {
            this.setState({
              grants,
              loading: false,
              restricted: false,
            })
          }
        })
        .catch((errResponse) => {
          this.setState({
            errors: [{ reason: 
              'Unknown error occured while fetching user permissions. Try again later.'}]
          });
          scrollErrorIntoView();
        });
    }
  }

  componentDidMount() {
    this.getUserGrants();
  }

  componentDidUpdate(prevProps: CombinedProps) {
    if (prevProps.username !== this.props.username) {
      this.getUserGrants();
    }
  }
  
  savePermsType = (type: string) => () => {
    const { username } = this.props;
    const { grants } = this.state;
    if (!username || !(grants && grants[type])) {
      return this.setState({
        errors: [
          { reason: `Can\'t set ${type} grants at this time. Please try again later`}]
      })
    }

    if (type === 'global') {
      this.setState(set(lensPath(['success', 'global']), ''));
      updateGrants(username, { global: grants.global } as Partial<Linode.Grants>)
        .then((grantsResponse) => {
          this.setState(compose(
            set(lensPath(['grants', 'global']), grantsResponse.global),
            set(lensPath(['success', 'global']),
              'Successfully updated global permissions'),
          ));
        })
        .catch((errResponse) => {
          this.setState({
            errors: pathOr(
              [{ reason: 
                'Error while updating global permissions for this user. Try again later'}],
              ['response', 'data', 'errors'],
              errResponse,
            ),
          })
          scrollErrorIntoView();
        });
    }
  }

  onChangeRestricted = () => {
    const { username } = this.props;
    this.setState({
      errors: [],
    })
    if (username) {
      updateUser(username, { restricted: !this.state.restricted })
        .then((user) => {
          this.setState({
            restricted: user.restricted,
          })
        })
        .catch((errResponse) => {
          this.setState({
            errors: [{
              reason: 'Error when updating user restricted status. Please try again later.'
            }],
          })
        })
    }
  }

  globalPermOnChange = (perm: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const lp = lensPath(['grants', 'global', perm]);
    this.setState(set(lp, e.target.checked));
  }

  renderGlobalPerm = (perm: string, checked: boolean) => {
    const permDescriptionMap = {
      add_linodes: 'Can add Linodes to this Account ($)',
      add_nodebalancers: 'Can add NodeBalancers to this Account ($)',
      add_longview: 'Can add Longview clients to this Account',
      longview_subscription: 'Can modify this account\'s Longview subscription ($)',
      add_domains: 'Can add Domains using the DNS Manager',
      add_stackscripts: 'Can create StackScripts under this account',
      add_images: 'Can create frozen Images under this account',
      add_volumes: 'Can add Block Storage Volumes to this account ($)',
      cancel_account: 'Can cancel the entire account',
    }
    return (
      <React.Fragment key={perm}>
        <FormControlLabel
          style={{ marginTop: 8 }}
          label={permDescriptionMap[perm]}
          control={
            <Toggle
              checked={checked}
              onChange={this.globalPermOnChange(perm)}
            />
          }
        />
        <Divider />
      </React.Fragment>
    );
  }

  billingPermOnClick = (value: string | null) => () => {
    const lp = lensPath(['grants', 'global', 'account_access']);
    this.setState(set(lp, value));
  }

  renderBillingPerm = () => {
    const { classes } = this.props;
    const { grants } = this.state;
    if (!(grants && grants.global)) { return null; }
    return (
      <div className={classes.section}>
        <Grid container className={classes.section}>
          <Grid item>
            <Typography variant="subheading">
              Billing Access
            </Typography>
          </Grid>
        </Grid>
        <Grid container className={classes.section}>
          <SelectionCard
            heading="None"
            subheadings={['The user cannot view any billing information.']}
            checked={grants.global.account_access === null}
            onClick={this.billingPermOnClick(null)}
          />
          <SelectionCard
            heading="Read Only"
            subheadings={['Read Only']}
            checked={grants.global.account_access === 'read_only'}
            onClick={this.billingPermOnClick('read_only')}
          />
          <SelectionCard
            heading="Read-Write"
            subheadings={['Read-Write']}
            checked={grants.global.account_access === 'read_write'}
            onClick={this.billingPermOnClick('read_write')}
          />
        </Grid>
      </div>
    );
  }
  
  renderActions = (
    onConfirm: () => void,
    onCancel: () => void,
    loading: boolean,
  ) => {
    const { classes } = this.props;
    return (
      <ActionsPanel className={classes.section}>
        <Button
          type="primary"
          loading={loading}
          onClick={onConfirm}
        >
          Save
        </Button>
        <Button
          type="cancel"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </ActionsPanel>
    );
  }

  renderGlobalPerms = () => {
    const { classes } = this.props;
    const { grants, success } = this.state;
    return (
      <Paper className={classes.globalSection}>
        <Typography variant="title">
          Global Permissions
        </Typography>
        {success && success.global &&
          <Notice success text={success.global} className={classes.section}/>
        }
        <div className={classes.section}>
          {grants && grants.global &&
            this.globalBooleanPerms
              .map((perm) => this.renderGlobalPerm(perm, grants.global[perm] as boolean))
          }
        </div>
        {this.renderBillingPerm()}
        {this.renderActions(
          this.savePermsType('global'),
          () => null, /* TODO: implement cancel */
          false /* TODO: implement saving state */
        )}
      </Paper>
    )
  }

  renderEntitySection = (entity: string) => {
    const { classes } = this.props;
    const { grants } = this.state;
    if (!(grants && grants[entity])) { return null; }
    const entityGrants = grants[entity];

    const entityNameMap = {
      linode: 'Linodes',
      stackscript: 'StackScripts',
      image: 'Images',
      volume: 'Volumes',
      nodebalancer: 'NodeBalancers',
      domain: 'Domains',
      longview: 'Longview Clients',
    };
    return (
      <div className={classes.section}>
        <Typography variant="subheading">
          {entityNameMap[entity]}
        </Typography>
        {entityGrants.map((grant) => {
          return <div key={grant.id}>{grant.label} {grant.permissions}</div>
        })}
      </div>
    )
  }
  
  renderSpecificPerms = () => {
    const { classes } = this.props;
    const { grants, success } = this.state;
    return (
      <Paper className={classes.globalSection}>
        <Typography variant="title">
          Specific Permissions
        </Typography>
        {success && success.specific &&
          <Notice success text={success.specific} className={classes.section}/>
        }
        <div className={classes.section}>
          {grants &&
            this.entityPerms.map((entity) => {
              return this.renderEntitySection(entity);
            })
          }
        </div>
        {this.renderActions(
          this.savePermsType('specific'),
          () => null, /* TODO: implement cancel */
          false /* TODO: implement saving state */
        )}
      </Paper>
    )
  }

  renderPermissions = () => {
    return (
      <React.Fragment>
        {this.renderGlobalPerms()}
        {this.renderSpecificPerms()}
      </React.Fragment>
    )
  }

  renderUnrestricted = () => {
    const { classes } = this.props;
    /* TODO: render all permissions disabled with this message above */
    return (
      <Paper className={classes.unrestrictedRoot}>
        <Typography>
          This user has unrestricted access to the account.
        </Typography>
      </Paper>
    );
  }

  renderBody = () => {
    const { classes } = this.props;
    const { restricted, errors } = this.state;
    const hasErrorFor = getAPIErrorsFor({ restricted: "Restricted" }, errors,)
    const generalError = hasErrorFor('none');

    return (
      <React.Fragment>
        {generalError &&
          <Notice error text={generalError} />
        }
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
        {restricted
          ? this.renderPermissions()
          : this.renderUnrestricted()
        }
      </React.Fragment>
    );
  }

  render() {
    const { loading } = this.state;
    return (
      <React.Fragment>
        {loading
          ? <CircleProgress />
          : this.renderBody()
        }
      </React.Fragment>
    )
  }
}

const styled = withStyles(styles, { withTheme: true });

export default styled(UserPermissions);
