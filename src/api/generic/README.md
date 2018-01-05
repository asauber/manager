# Linode API - Redux Configuration Files

The files in this `generic` directory export configuration objects which are
used to generate all of the Redux entities for a given API endpoint:

* **Action Types**, the strings which name a type of state modification 
* **Actions**, the objects which contain state and are dispatched to modify 
it
* **Action Creators**, the functions which are called to return Actions that
are dispatched
* **Thunk Action Creators**, the functions which are called which return 
functions that execute the Redux context and also act as Action 
Creators
* **Reducers** the pure functions which return a new state for each Action
that is dispatched

The result is an api interface that allows us to make calls like following,
without having to write any of the above "by-hand".

`dispatch(api.linodes.disks.post(data, linode.id))`

## Format of the `config` object

To achieve this, the configuration object must contain some information 
about the endpoint, and possibly some "sub-endpoints".



