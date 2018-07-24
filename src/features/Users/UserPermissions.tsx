import { compose, lensPath, omit, pathOr, set } from 'ramda';
import * as React from 'react';

import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import { StyleRulesCallback, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

import ActionsPanel from 'src/components/ActionsPanel';
import Button from 'src/components/Button';
import CircleProgress from 'src/components/CircleProgress';
import Grid from 'src/components/Grid';
import Notice from 'src/components/Notice';
import Radio from 'src/components/Radio';
import Select from 'src/components/Select';
import SelectionCard from 'src/components/SelectionCard';
import Table from 'src/components/Table';
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
  /* need this separated so we can show just the restricted toggle when it's in use */
  loadingGrants: boolean;
  grants?: Linode.Grants;
  restricted?: boolean;
  errors?: Linode.ApiFieldError[];
  success?: {
    global: string,
    specific: string,
  }
  /* null needs to be a string here because it's a Select value */
  setAllPerm: 'null' | 'read_only' | 'read_write';
}

type CombinedProps = Props & WithStyles<ClassNames>;

class UserPermissions extends React.Component<CombinedProps, State> {
  state: State = {
    loadingGrants: false,
    loading: true,
    setAllPerm: 'null',
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
              loadingGrants: false,
              restricted: true,
            })
          } else {
            this.setState({
              grants,
              loading: false,
              loadingGrants: false,
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

    /* This is where individual entity saving could be implemented */
  }

  saveSpecificGrants = () => {
    const { username } = this.props;
    const { grants } = this.state;
    if (!username || !(grants)) {
      return this.setState({
        errors: [
          { reason: `Can\'t set Entity-Specific Grants at this time. Please try again later` }
        ]
      })
    }

    this.setState(set(lensPath(['success', 'specific']), ''));
    const requestPayload = omit(['global'], grants);
    updateGrants(username, requestPayload as Partial<Linode.Grants>)
      .then((grantsResponse) => {
        /* build array of update fns */
        const updateFns = this.entityPerms.map((entity) => {
          const lens = lensPath(['grants', entity]);
          return set(lens, grantsResponse[entity]);
        })
        /* apply all of them at once */
        this.setState((compose as any)(...updateFns));
        this.setState(
          set(lensPath(['success', 'specific']),
            'Successfully updated Entity-Specific Grants'),
        );
      })
      .catch((errResponse) => {
        this.setState({
          errors: pathOr(
            [{ reason: 
              'Error while updating Entity-Specific Grants for this user. Try again later'}],
            ['response', 'data', 'errors'],
            errResponse,
          ),
        })
        scrollErrorIntoView();
      });
  }

  onChangeRestricted = () => {
    const { username } = this.props;
    this.setState({
      errors: [],
      loadingGrants: true,
    })
    if (username) {
      updateUser(username, { restricted: !this.state.restricted })
        .then((user) => {
          this.setState({
            restricted: user.restricted,
          })
        })
        .then(() => {
          /* unconditionally sets this.state.loadingGrants to false */
          this.getUserGrants()
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

  entityIsAll = (entity: string, value: Linode.GrantLevel): boolean => {
    const { grants } = this.state;
    if (!(grants && grants[entity])) { return false; }
    return grants[entity].reduce((acc: boolean, grant: Linode.Grant) => {
      return acc && grant.permissions === value;
    }, true);
  }

  entitySetAllTo = (entity: string, value: Linode.GrantLevel) => () => {
    const { grants } = this.state;
    if (!(grants && grants[entity])) { return false; }
    /* map entities to an array of state update functions */
    const updateFns = grants[entity].map((grant, idx) => {
      const lens = lensPath(['grants', entity, idx, 'permissions'])
      return set(lens, value);
    });
    /* compose all of the update functions and setState */
    this.setState((compose as any)(...updateFns));
  }

  setGrantTo = (entity: string, idx: number, value: Linode.GrantLevel) => () => {
    const { grants } = this.state;
    if (!(grants && grants[entity])) { return; }
    this.setState(set(
      lensPath(['grants', entity, idx, 'permissions']),
      value
    ));
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
        <Table>
          <TableHead data-qa-table-head>
            <TableRow>
              <TableCell>
                Label
              </TableCell>
              <TableCell>
                None
                <Radio
                  name={`${entity}-select-all`}
                  checked={this.entityIsAll(entity, null)}
                  value="null"
                  onChange={this.entitySetAllTo(entity, null)}
                />
              </TableCell>
              <TableCell>
                Read Only
                <Radio
                  name={`${entity}-select-all`}
                  checked={this.entityIsAll(entity, 'read_only')}
                  value="read_only"
                  onChange={this.entitySetAllTo(entity, 'read_only')}
                />
              </TableCell>
              <TableCell>
                Read-Write
                <Radio
                  name={`${entity}-select-all`}
                  checked={this.entityIsAll(entity, 'read_write')}
                  value="read_write"
                  onChange={this.entitySetAllTo(entity, 'read_write')}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entityGrants.map((grant, idx) => {
              return (
                <TableRow key={grant.label}>
                  <TableCell>
                    {grant.label}
                  </TableCell>
                  <TableCell>
                    <Radio
                      name={`${grant.id}-perms`}
                      checked={grant.permissions === null}
                      value="null"
                      onChange={this.setGrantTo(entity, idx, null)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      name={`${grant.id}-perms`}
                      checked={grant.permissions === 'read_only'}
                      value="read_only"
                      onChange={this.setGrantTo(entity, idx, 'read_only')}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      name={`${grant.id}-perms`}
                      checked={grant.permissions === 'read_write'}
                      value="read_write"
                      onChange={this.setGrantTo(entity, idx, 'read_write')}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  setAllEntitiesTo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : e.target.value;
    this.entityPerms.map(entity =>
      this.entitySetAllTo(entity, value as Linode.GrantLevel)());
    this.setState({
      setAllPerm: e.target.value as 'null' | 'read_only' | 'read_write',
    })
  }
  
  renderSpecificPerms = () => {
    const { classes } = this.props;
    const { grants, success, setAllPerm } = this.state;
    return (
      <Paper className={classes.globalSection}>
        <Grid container justify="space-between">
          <Grid item>
            <Typography variant="title">
              Specific Grants
            </Typography>
          </Grid>
          <Grid item>
            <Grid container justify="flex-end">
              <Grid item>
                Set all Grants to:
              </Grid>
              <Grid item>
                <Select
                  value={setAllPerm}
                  onChange={this.setAllEntitiesTo}
                  inputProps={{ name: 'setall', id: 'setall' }}
                >
                  <MenuItem value="null">
                    None
                  </MenuItem>
                  <MenuItem value="read_only">
                    Read Only
                  </MenuItem>
                  <MenuItem value="read_write">
                    Read Write
                  </MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <div className={classes.section}>
          {grants &&
            this.entityPerms.map((entity) => {
              return this.renderEntitySection(entity);
            })
          }
        </div>
        {success && success.specific &&
          <Notice success text={success.specific} className={classes.section}/>
        }
        {this.renderActions(
          this.saveSpecificGrants,
          () => null, /* TODO: implement cancel */
          false /* TODO: implement saving state */
        )}
      </Paper>
    )
  }

  renderPermissions = () => {
    const { loadingGrants } = this.state;
    if (loadingGrants) {
      return <CircleProgress />;
    } else {
      return (
        <React.Fragment>
          {this.renderGlobalPerms()}
          {this.renderSpecificPerms()}
        </React.Fragment>
      )
    }
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
