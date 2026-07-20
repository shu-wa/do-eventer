export type LocationMapProps = {
  latitude: number;
  longitude: number;
  onSelect: (latitude: number, longitude: number) => void;
};

export function LocationMap(props: LocationMapProps): import('react').ReactElement;
