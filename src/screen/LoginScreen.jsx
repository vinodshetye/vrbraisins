// c:\react_app\coldstorage\src\screen\LoginScreen.jsx
import { KeyboardAvoidingView, ScrollView, View, Image, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native'; // Removed Button as it wasn't used
import React, { useState } from 'react'; // Removed useEffect as it wasn't used
import { configs } from '../utils/configs';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, StackActions } from '@react-navigation/native';  
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiUrl = configs.API_URL_LOGIN;
console.log('Login API URL:', apiUrl); // Keep for debugging if needed

const storeData = async (key, value) => {
  try {
    const jsonItemValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonItemValue);
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

const storeStringData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

const retrieveData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error getting array:", e);
    return null;
  }
};

const LoginScreen = () => {

    // Removed unused 'data' state
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(''); // Renamed for clarity
    const [password, setPassword] = useState('');
    const [secureEntry, setSecureEntry] = useState(true);
    const navigation =  useNavigation();

   
   /*
    retrieveData('LoginData').then((data) => {
      if (data) {
        console.log('data if ',data);
        if(data?.suc===true){
          console.log('data redirection ',data.suc);
          //navigation.navigate('Main', { UserID: data.UserID, routname: 'Branchselection' });
          navigation.navigate('BranchselectionScreen', { UserID: data.UserID, routname: 'Branchselection' });
        }else{
          console.log(data?.suc || 'suc is undefined.');
        }
      } else {
        console.log('No data found in AsyncStorage.');
      }
    });
    */
    
  

    const validateLogin = () => {
          if (!username.trim() || !password.trim()) { // Added trim() to check for empty spaces
              Alert.alert('Validation Error', 'Please enter both User ID and Password.');
              return; // Stop execution if validation fails
          }
          // No need for 'else' after 'return'
          setLoading(true);
          sendPostRequest(); // Call the API request function
          // Removed redundant return
    };

    // POST Request to Send Raw JSON Data
    const sendPostRequest = async () => {
      const rawData = {
        LoginName: username, // Use the state variable directly
        password: password  // Use the state variable directly
      };
    // console.log('Request LoginName=', JSON.stringify(rawData)); // Keep for debugging if needed

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Good practice to add Accept header
        },
        body: JSON.stringify(rawData),
      });

      // Check if response is ok (status code 200-299)
      if (!response.ok) {
          // Handle non-successful responses (like 404, 500)
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      // console.log('Response from server:', json); // Keep for debugging if needed

      // Removed unused setData state update

      if(json?.suc === true && json?.UserID) { // Check for suc and UserID existence
        // Use replace instead of navigate to prevent going back to Login screen
        // Navigate to the RENAMED Stack screen "Main"
       // navigation.dispatch(
       //   StackActions.replace('Main', { UserID: json.UserID, routname: 'Branchselection' }) // Changed 'Home' to 'Main'
       // );
       storeStringData('isLoggedIn', 'true');
       storeData('LoginData', json); 
        navigation.navigate('BranchselectionScreen', { UserID: json.UserID, routname: 'Branchselection' })
      } else {
        // Provide a more specific error message if possible from the response
        const errorMessage = json?.msg || 'Invalid User ID or Password.';
        Alert.alert('Login Failed', errorMessage);
      }

    } catch (error) {
      // Handle fetch errors (network issues, etc.) and non-ok responses
      Alert.alert('Error', `An error occurred during login: ${error.message}`);
      console.error('Error sending POST request:', error);
    } finally {
        setLoading(false); // Stop the loading indicator regardless of success or failure
    }
  };

  return (
    // Enable KeyboardAvoidingView based on platform if needed
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>

        <View style={styles.textContainer}>
            <Image source={require("../assets/vrb_logo.png")} style={styles.logo} />
            <Text style={styles.title}>VRB Raisins</Text>
            <Text style={styles.numtitle}>9175591169 / 9175168455</Text>
        </View>
        { loading ? (
          // Center the ActivityIndicator
          <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <Ionicons name={"person-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
                <TextInput
                onChangeText={setUsername} // Simplified onChangeText
                value={username}
                style={styles.textInput}
                placeholder='Enter Your User ID' // Corrected typo
                placeholderTextColor={colors.secondary}
                keyboardType='default'
                autoCapitalize="none" // Prevent auto-capitalization for usernames
                />
            </View>
            <View style={styles.inputContainer}>
                <Ionicons name={"lock-closed-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
                <TextInput
                onChangeText={setPassword} // Simplified onChangeText
                value={password}
                style={styles.textInput}
                placeholder='Enter Your Password'
                placeholderTextColor={colors.secondary}
                secureTextEntry={secureEntry}
                autoCapitalize="none" 
                />
                <TouchableOpacity onPress={() => {setSecureEntry((prev) => !prev)}} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={secureEntry ? "eye-off-outline" : "eye-outline"} size={25} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {/* Removed unused Forgot Password Text */}
            <TouchableOpacity style={styles.loginButtonWrapper} onPress={validateLogin} disabled={loading}>
                <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Removed unused footer */}
        </View>
       </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen

const styles = StyleSheet.create({
    scrollView: {
        flexGrow: 1,
        justifyContent: 'center', // Center content vertically
        backgroundColor: colors.white,
    },
    container: {
        flex: 1, // Ensure container takes up space
        backgroundColor: colors.white,
        padding: 20,
        justifyContent: 'center', // Center content vertically within padding
    },
    loadingContainer: { // Style to center the loader
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10, // Add some margin to separate from header
    },
    logo:{
        width: 170,
        height: 170,
        borderRadius:20, // Keep if desired
        //resizeMode: 'contain', // Ensure logo fits well
        marginBottom: 10, // Add space below logo
    },
    title:{
        fontSize: 35,
        fontFamily: fonts.Bold,
        // marginTop: 20, // Removed, spacing handled by container/logo margin
        textAlign: 'center',
        color: colors.drakgray,
        // paddingHorizontal: 20, // Padding handled by container
    },
    subtitle:{
        fontSize: 20,
        fontFamily: fonts.Bold,
        // marginTop: 20, // Removed, spacing handled by container/logo margin
        textAlign: 'center',
        color: colors.drakgray,
        // paddingHorizontal: 20, // Padding handled by container
    },
    numtitle:{
        fontSize: 20,
        fontFamily: fonts.SemiBold,
        color: colors.secondary,
        textAlign: 'center',
        // paddingHorizontal: 20, // Padding handled by container
        marginTop: 5, // Add small space above numbers
    },
    // Removed unused backButtonWrapper style
    textContainer: {
        // marginVertical: 20, // Adjusted spacing
        alignItems: 'center',
        marginBottom: 10, // Add space below the header text
    },
    formContainer: {
        marginTop: 10, // Reduced top margin
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 100,
        paddingHorizontal: 15, // Adjusted padding
        flexDirection: 'row',
        alignItems: 'center',
        // padding: 3, // Replaced by vertical padding/height
        marginVertical: 10,
        height: 55, // Give inputs a fixed height
    },
    iconStyle: {
        marginRight: 10, // Add space between icon and text input
    },
    textInput: {
        flex: 1,
        // padding: 12, // Padding handled by container height/vertical alignment
        fontFamily: fonts.Regular, // Use Regular font for input
        fontSize: 16, // Slightly smaller font size
        color: colors.drakgray, // Ensure input text color is visible
        backgroundColor: colors.white,
    },
    // Removed unused forgotPasswordText style
    loginButtonWrapper: {
        backgroundColor: colors.primary,
        borderRadius: 100,
        marginVertical: 20,
        paddingVertical: 14, // Use padding for button height
        alignItems: 'center', // Center text horizontally
        justifyContent: 'center', // Center text vertically
    },
    loginText: {
        color: colors.white,
        fontFamily: fonts.Bold,
        textAlign: 'center',
        // padding:14, // Padding applied to wrapper
        fontSize: 18, // Slightly smaller font size
    },
    // Removed unused footer styles
});
