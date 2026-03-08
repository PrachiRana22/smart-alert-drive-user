import { View, Text, StyleSheet } from 'react-native';

export default function TestScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Simple Test Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 20,
        color: 'black',
    },
});
