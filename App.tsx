import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Kitchen</Text>
      <Text style={styles.subtitle}>Your fridge, freezer, and pantry are on the way.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2A44',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#3E4A63',
    textAlign: 'center',
  },
});
