import {FC, useEffect, useState} from 'react';
import {Alert, Platform} from 'react-native';
import {PERMISSIONS, PermissionStatus, request} from 'react-native-permissions';
import {GOOGLE_API_KEY} from 'react-native-dotenv';

import {Map} from '@components/Map';
import {Spinner} from '@components/Spinner';
import {Container, HeaderWrapper, Title} from './styles';
import {Prediction} from '@interfaces/Prediction';
import googlePlacesApi from '@client/googlePlaces';
import {SearchBar} from '@components/SearchBar';
import {useDebounce} from '@hooks';
import {Keyboard} from 'react-native';
import {Icon} from '@components/Icon';
import {colors} from '@theme/colors';
import {StatusBarComponent} from '@components/StatusBar';
import {useUserContext} from 'context/UserContext';
import {RootStackParams} from '@navigation/Home';
import {StackScreenProps} from '@react-navigation/stack';

/**
 * Types
 */

type AddLocationScreenProps = StackScreenProps<RootStackParams, 'AddLocation'>;

/**
 * AddLocationScreen
 */

export const AddLocationScreen: FC<AddLocationScreenProps> = () => {
  const {user, setUser} = useUserContext();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>();
  const [search, setSearch] = useState({term: '', fetchPredictions: false});
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const checkLocationPermissions = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    try {
      const status = await request(permission);
      setPermissionStatus(status);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onChangeText = async () => {
    if (search.term.trim() === '') {
      onClearSearch();
    }
    if (!search.fetchPredictions) {
      return;
    }

    try {
      const result = await googlePlacesApi.request({
        method: 'get',
        url: `/autocomplete/json?input=${search.term}&key=${GOOGLE_API_KEY}`,
      });
      if (result) {
        setPredictions(result.data.predictions);
        console.log(result.data.predictions);
        setShowPredictions(true);
      }
    } catch (_) {
      return Alert.alert('Hubo un error, vuelva a intentar');
    }
  };

  useDebounce(onChangeText, 300, [search.term]);

  const onSelection = async ({place_id, description}: Prediction) => {
    try {
      const result = await googlePlacesApi.request({
        method: 'get',
        url: `/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}`,
      });
      if (result) {
        const {
          data: {
            result: {
              geometry: {location},
            },
          },
        } = result;
        const {lat, lng} = location;
        setUser({
          location: {latitude: lat, longitude: lng},
          address: description,
        });
        setShowPredictions(false);
        Keyboard.dismiss();
        setSearch({term: description, fetchPredictions: false});
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onClearSearch = () => {
    setShowPredictions(false);
    setSearch({term: '', fetchPredictions: false});
  };

  useEffect(() => {
    checkLocationPermissions();
  }, []);

  if (permissionStatus !== 'granted') {
    return <Spinner />;
  }

  return (
    <>
      <StatusBarComponent backgroundColor={colors.bg.secondary} />
      <Container onPress={() => Keyboard.dismiss()}>
        <HeaderWrapper>
          <Icon name="AddAddress" size={22} />
          <Title>Agregar dirección de entrega</Title>
        </HeaderWrapper>
        <SearchBar
          value={search.term}
          type="location"
          placeholder={'Escribe tu dirección'}
          onChangeText={(text: string) => {
            setSearch({term: text, fetchPredictions: true});
          }}
          showData={showPredictions}
          data={predictions}
          onClearSearch={onClearSearch}
          onSelection={onSelection}
        />
        <Map selectedLocation={user.location} />
      </Container>
    </>
  );
};
