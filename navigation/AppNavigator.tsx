import AboutApp from '@/screens/AboutApp';
import AddWordScreen from '@/screens/AddWordScreen';
import MyWordsScreen from '@/screens/MyWordsScreen';
import QuizScreen from '@/screens/QuizScreen';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const AppNavigator = () => {
    return (
        <View style={styles.container}>
            <QuizScreen />
            <AddWordScreen />
            <MyWordsScreen />
            <AboutApp />
        </View>
    );
};

export default AppNavigator;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
