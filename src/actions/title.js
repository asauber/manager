export const ADD_TITLE_SLUG = '@@title/ADD_TITLE_SLUG';

export function addTitleSlug(slug) {
  return { type: ADD_TITLE_SLUG, slug };
}
