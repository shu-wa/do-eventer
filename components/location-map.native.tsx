import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export type LocationMapProps = {
  latitude: number;
  longitude: number;
  onSelect: (latitude: number, longitude: number) => void;
};

export function LocationMap({ latitude, longitude, onSelect }: LocationMapProps) {
  return (
    <View style={styles.wrap}>
      <MapView
        key={`${latitude.toFixed(4)}-${longitude.toFixed(4)}`}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
        onPress={(event) => onSelect(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)}>
        <Marker coordinate={{ latitude, longitude }} draggable onDragEnd={(event) => onSelect(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { height: 350, overflow: 'hidden' } });
