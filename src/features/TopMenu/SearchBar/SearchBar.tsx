import * as React from 'react';
import * as moment from 'moment';
import Axios from 'axios';
import Downshift from 'downshift';
import { connect } from 'react-redux';
import { pathOr } from 'ramda';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import {
  withStyles,
  WithStyles,
  Theme,
  StyleRules,
} from 'material-ui/styles';
import Paper from 'material-ui/Paper';

import Search from 'material-ui-icons/Search';

import LinodeIcon from 'src/assets/addnewmenu/linode.svg';
import VolumeIcon from 'src/assets/addnewmenu/volume.svg';
import NodebalIcon from 'src/assets/addnewmenu/nodebalancer.svg';
import { API_ROOT } from 'src/constants';
import LinodeTheme from 'src/theme';
import TextField from 'src/components/TextField';
import { labelFromType } from 'src/features/linodes/presentation';

import SearchSuggestion, { SearchSuggestionT } from './SearchSuggestion';

type Styles =
  'root'
  | 'textfield'
  | 'input'
  | 'icon'
  | 'searchSuggestions';

const styles = (theme: Theme & Linode.Theme): StyleRules => ({
  root: {
    position: 'relative', /* for search results */
    height: 50,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: LinodeTheme.bg.main,
    padding: theme.spacing.unit,
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
  },
  icon: {
    color: '#c9cacb',
    fontSize: '2rem',
  },
  textfield: {
    color: '#606469',
    flex: 1,
    '& input': {
      fontSize: '1.0em',
    },
  },
  input: {
    border: 0,
  },
  searchSuggestions: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: 50,
    padding: theme.spacing.unit * 1,
  },
});


interface Props {
  types: Linode.LinodeType[];
}

interface State {
  searchText: string;
  lastFetch: moment.Moment;
  linodes?: Linode.Linode[];
  volumes?: Linode.Volume[];
  nodebalancers?: Linode.NodeBalancer[];
  domains?: Linode.Domain[];
  images?: Linode.Image[];
}

type FinalProps = Props & WithStyles<Styles> & RouteComponentProps<{}>;

class SearchBar extends React.Component<FinalProps, State> {
  state: State = {
    searchText: '',
    lastFetch: moment.utc(),
  };

  dataAvailable() {
    return (
      this.state.linodes
      || this.state.volumes
      || this.state.nodebalancers
      || this.state.domains
    );
  }

  linodeDescription(typeId: string, imageId: string) {
    const { types } = this.props;
    const { images } = this.state;
    const image = (images && images.find(image => image.id === imageId))
      || { label: 'Unknown Image' };
    const imageDesc = image.label;
    const typeDesc = labelFromType(types.find(type => type.id === typeId) as Linode.LinodeType);
    return `${imageDesc}, ${typeDesc}`;
  }

  updateData() {
    /* TODO: Use service modules for these API calls */
    /* TODO: Fetch every page */
    Axios.get(`${API_ROOT}/linode/instances/`)
      .then((response) => {
        this.setState({ linodes: response.data.data });
      });

    Axios.get(`${API_ROOT}/volumes`)
      .then((response) => {
        this.setState({ volumes: response.data.data });
      });

    Axios.get(`${API_ROOT}/nodebalancers`)
      .then((response) => {
        this.setState({ nodebalancers: response.data.data });
      });

    Axios.get(`${API_ROOT}/domains`)
      .then((response) => {
        this.setState({ domains: response.data.data });
      });

    Axios.get(`${API_ROOT}/images`)
      .then((response) => {
        this.setState({ images: response.data.data });
      });
  }

  getSearchResults(query: string | null) {
    if (!this.dataAvailable || !query) return;

    const searchResults = [];

    if (this.state.linodes) {
      const linodesByLabel = this.state.linodes.filter(
        linode => linode.label.toLowerCase().includes(query.toLowerCase()),
      );
      searchResults.push(...(linodesByLabel.map(linode => ({
        title: linode.label,
        description: this.linodeDescription(linode.type, linode.image),
        Icon: LinodeIcon,
        path: `/linodes/${linode.id}`,
      }))));
    }

    if (this.state.volumes) {
      const volumesByLabel = this.state.volumes.filter(
        volume => volume.label.toLowerCase().includes(query.toLowerCase()),
      );
      searchResults.push(...(volumesByLabel.map(volume => ({
        title: volume.label,
        description: volume.size + ' G',
        Icon: VolumeIcon,
        path: `/volumes/${volume.id}`,
      }))));
    }

    if (this.state.nodebalancers) {
      const nodebalancersByLabel = this.state.nodebalancers.filter(
        nodebal => nodebal.label.toLowerCase().includes(query.toLowerCase()),
      );
      searchResults.push(...(nodebalancersByLabel.map(nodebal => ({
        title: nodebal.label,
        description: nodebal.hostname,
        Icon: NodebalIcon,
        path: `/nodebalancers/${nodebal.id}`,
      }))));
    }

    if (this.state.domains) {
      const domainsByLabel = this.state.domains.filter(
        domain => domain.domain.toLowerCase().includes(query.toLowerCase()),
      );
      searchResults.push(...(domainsByLabel.map(domain => ({
        title: domain.domain,
        description: domain.description || domain.status,
        /* TODO: Update this with the Domains icon! */
        Icon: NodebalIcon,
        path: `/domains/${domain.id}`,
      }))));
    }

    return searchResults;
  }

  handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      searchText: e.target.value,
    }, () => {
      if (!this.dataAvailable() || moment.utc().diff(this.state.lastFetch) > 30000) {
        this.setState({ lastFetch: moment.utc() }, () => {
          this.updateData();
        });
      }
    });
  }

  renderSearchResult({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
    const isHighlighted = highlightedIndex === index;
    const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

    return (
      <MenuItem
        {...itemProps}
        key={suggestion.label}
        selected={isHighlighted}
        component="div"
        style={{
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        <SearchSuggestion
          key={suggestion.title + suggestion.description}
          Icon={suggestion.Icon}
          title={suggestion.title}
          description={suggestion.description}
          searchText={this.state.searchText}
          path={suggestion.path}
          history={history}
        />
      </MenuItem>
    );
  }

  render() {
    // const { classes, history } = this.props;
    const { classes } = this.props;

    return (
      <React.Fragment>
        <div
          className={classes.root}
        >
          <Search
            className={classes.icon}
          />
          <Downshift
            defaultIsOpen={true}
            render={({
              getInputProps,
              isOpen,
              inputValue,
            }) => (
              <div>
                <TextField
                  fullWidth
                  className={classes.textfield}
                  InputProps={{
                    classes: {
                      root: classes.input,
                    },
                    ...getInputProps({
                      placeholder: 'Go to Linodes, Volumes, NodeBalancers, Domains...',
                      id: 'searchbar-simple',
                      onChange: this.handleSearchChange,
                    }),
                  }}
                />
                {isOpen &&
                  <Paper
                    className={classes.searchResults}
                  >
                    {this.getSearchResults(inputValue).map((suggestion, index)) => {

                    }}
                    {/*
                    {this.state.searchResults && this.state.searchResults.map((result) => {
                      return (
                        <SearchResult
                          key={result.title + result.description}
                          Icon={result.Icon}
                          title={result.title}
                          description={result.description}
                          searchText={this.state.searchText}
                          path={result.path}
                          history={history}
                        />
                      );
                    })}
                    */}
                  </Paper>
                }
              </div>
            )}
          />
        </div>
      </React.Fragment>
    );
  }
}

const RoutedSearchBar = withRouter(SearchBar);

const StyledSearchBar = withStyles(styles, { withTheme: true })<Props>(RoutedSearchBar);

const mapStateToProps = (state: Linode.AppState) => ({
  types: pathOr({}, ['resources', 'types', 'data', 'data'], state),
});

export default connect<Props>(mapStateToProps)(StyledSearchBar);
