import { sort } from 'ramda';

import { regionOrder } from 'src/constants';

type RegionLike = Partial<Linode.Region> | string;

export const sortRegions = (regions: RegionLike[]): RegionLike[] => {
  /* create (regionID, RegionLike) pairs to sort */
  const pairs: [string, RegionLike][] = regions.map((region) => {
    if (typeof region === 'string') {
      return ([region, region] as [string, RegionLike]);
    } else {
      return (['' + (region.id!), region] as [string, RegionLike]);
    }
  })

  /* sort the pairs using the reference array for comparison */
  const sorted = sort(
    (pairA: [string, RegionLike], pairB: [string, RegionLike]): number => {
      const idxA = regionOrder.findIndex(el => el === pairA[0]);
      const idxB = regionOrder.findIndex(el => el === pairB[0]);
      return idxA - idxB;
    }, pairs);

  return sorted.map(pair => pair[1]);
}
