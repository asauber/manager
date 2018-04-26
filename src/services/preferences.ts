export const preferences = {
  LINODE_VIEW: 'linode_view',
};

export function setPreference(name: string, value: string) {
  window.localStorage.setItem(name, value);
}

export function getPreference(name: string) {
  window.localStorage.getItem(name);
}

export function clearPreference(name: string) {
  window.localStorage.removeItem(name);
}

export function clearAllPreferences() {
  for (const preferenceName of Object.values(preferences)) {
    console.log(preferenceName);
  }
}
