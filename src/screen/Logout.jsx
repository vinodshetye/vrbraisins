import React, {useEffect} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import LoginScreen from './LoginScreen';

const LogoutButton = () => {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            // Clear the local storage
            await AsyncStorage.clear();
            console.log('User logged out and session data cleared!');
            
            // Navigate to the Login screen (or any screen)
           // navigation.navigate('LoginScreen');
          navigation.navigate('Login');
           
        } catch (error) {
            console.error('Error while logging out:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
        }
    };
    
    handleLogout();
    
    return null;
};

export default LogoutButton;
