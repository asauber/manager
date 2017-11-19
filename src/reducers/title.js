import { ADD_TITLE_SLUG } from '~/actions/title';

export default function title(state = [], action) {
  switch (action.type) {
    case ADD_TITLE_SLUG:
      return { titleSlugs: [...state, action.slug] };
    default:
      return { titleSlugs: [...state] };
  }
}
