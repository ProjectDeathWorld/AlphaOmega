import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ElementaryGame from '../../components/ui/ElementaryGame';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerBox}>
        <ThemedText type="title" style={styles.title}>
          🎲 Welcome to the Riddle Challenge!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Test your brain with fun riddles. Choose your level and see how many you can solve!
        </ThemedText>
      </View>
      <View style={styles.gameBox}>
        <ElementaryGame />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  headerBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4B2991',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6C63FF',
    marginBottom: 8,
  },
  gameBox: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});