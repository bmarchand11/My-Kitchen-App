import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { BackButton, Button, CloseButton, Field, Screen, Title } from '../../components/ui';
import { useKitchen } from '../../data/KitchenContext';
import { lookUpBarcode } from '../../lib/products';
import { colors, fonts } from '../../theme';

// iPhones report UPC-A codes as 13 digits with a leading zero and some scanners as 12;
// store one form so the household's memory of a product always matches.
function normalize(code: string): string {
  const digits = code.replace(/\D/g, '');
  return digits.length === 12 ? `0${digits}` : digits;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { rememberedProduct } = useKitchen();
  const [looking, setLooking] = useState(false);
  const [typed, setTyped] = useState('');
  // The camera reports the same code many times a second; only act on the first.
  const handled = useRef(false);

  // Coming back from the form after saving: get ready for the next product.
  useFocusEffect(
    useCallback(() => {
      handled.current = false;
      setLooking(false);
    }, []),
  );

  const handle = async (raw: string) => {
    const barcode = normalize(raw);
    if (handled.current || barcode.length < 8) return;
    handled.current = true;
    setLooking(true);
    try {
      const remembered = await rememberedProduct(barcode);
      if (remembered) {
        router.push({
          pathname: '/add/item',
          params: { barcode, name: remembered.name, sticker: remembered.sticker, section: remembered.sectionId, unit: remembered.unit },
        });
        return;
      }
      const product = await lookUpBarcode(barcode).catch(() => null);
      router.push({
        pathname: '/add/item',
        params: product ? { barcode, name: product.name, hints: product.hints } : { barcode, unknown: '1' },
      });
    } finally {
      setLooking(false);
    }
  };

  const onScanned = (result: BarcodeScanningResult) => handle(result.data);

  let camera;
  if (Platform.OS === 'web') {
    camera = <Text style={styles.note}>Scanning works in the iPhone app. Here you can type the numbers under the barcode.</Text>;
  } else if (!permission) {
    camera = <ActivityIndicator color={colors.ink} />;
  } else if (!permission.granted) {
    camera = (
      <View style={styles.permission}>
        <Text style={styles.note}>My Kitchen needs your camera to read barcodes. Photos aren’t saved.</Text>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={requestPermission} />
        ) : (
          <Button label="Open Settings" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  } else {
    camera = (
      <View style={styles.viewfinder}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={looking ? undefined : onScanned}
        />
        <View style={styles.target} pointerEvents="none" />
        {looking && (
          <View style={styles.looking}>
            <ActivityIndicator color={colors.surface} />
            <Text style={styles.lookingText}>Looking it up…</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <Screen showBottomBar={false}>
      <View style={styles.header}>
        <BackButton label="Add food" />
        <CloseButton />
      </View>
      <Title>Scan a barcode</Title>
      <Text style={styles.note}>Hold the barcode inside the box. We’ll fill in the name and picture.</Text>

      {camera}

      <View style={styles.manual}>
        <Field
          label="Or type the barcode numbers"
          value={typed}
          onChangeText={setTyped}
          keyboardType="number-pad"
          maxLength={14}
          placeholder="012345678905"
          onSubmitEditing={() => handle(typed)}
        />
        <Button label="Look it up" variant="secondary" busy={looking} onPress={() => handle(typed)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  permission: { gap: 12 },
  viewfinder: {
    flex: 1,
    minHeight: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: { width: '78%', height: 120, borderRadius: 16, borderWidth: 3, borderColor: colors.sunflower },
  looking: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31,42,68,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lookingText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.surface },
  manual: { gap: 10 },
});
