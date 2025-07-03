import { StyleSheet, Text, FlatList, View, ActivityIndicator, TouchableOpacity, BackHandler } from 'react-native' // Import BackHandler and Alert
import React, { useEffect, useState, useCallback } from 'react' // Import useCallback
import { configs } from '../utils/configs';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (key, value) => {
  try {
    const jsonItemValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonItemValue);
  } catch (error) {
    console.log('Error storing data:', error);
  }
};

const removeData = async (key) => {
  try {
      await AsyncStorage.removeItem(key);
      console.log('Branch screen Removing data:', key);
  } catch (error) {
    console.log('Branch screenError removing data:', error);
    // Optionally inform the user if clearing fails critically
    // Alert.alert('Error', 'Failed to clear session data.');
  }
};

const fetchData = async ({UserID}) => {

 const apiUrl = configs.API_URL_BRANCH_DETAILS;
 console.log('Branch Details API URL:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'UserID':UserID}), // Convert raw data to JSON string
    });
    const data = await response.json();

    console.log('Response:', data);
    if(data?.suc===true){
      return data.lstBranch;
    }else{
      console.log(data?.suc || 'suc is undefined.');
      return false;
    }
  } catch (error) {
    console.log('Error fetching data:', error);
    return false;
  }
};

const BranchselectionScreen = ({ route }) => {
  const navigation = useNavigation();
  const {UserID, type} = route.params;
  const [branchList, setBranchList] = useState(null); // State for branch data
  const [branchAvailable, setBranchAvailable] = useState(false); // State for branch data
  const [loading, setLoading] = useState(true); // State for loading indicator

  console.log( 'BranchselectionScreen route Params:', route.params );

  // --- Back Button Handler ---
  useFocusEffect(
    useCallback(() => {
      
        console.log('Hardware back press detected on BranchselectionScreen!'); // <-- Add this log
        // Clear the BranchData from AsyncStorage
        removeData('BranchData');
        console.log('Attempted to clear BranchData via back press.');
    
      return () => {
          console.log('Removing hardwareBackPress listener from BranchselectionScreen.'); // <-- Add log for cleanup
          //subscription.remove();
      }
    }, []) // Empty dependency array means this effect runs once on focus and cleans up on blur
  );
  // --- End Back Button Handler ---


  // Initial data fetch effect
  useEffect(() => {
    // Clear data when the component mounts *initially* (as you had before)
    removeData('BranchData');

    const getBranchDetails = async () => {
      setLoading(true); // Ensure loading is true at the start of fetch
      const branches = await fetchData({ UserID }); // Fetch data
      if (branches) {
          setBranchAvailable(true);
          setBranchList(branches); // Update state with branch data
      } else {
        setBranchAvailable(false); // Explicitly set to false if fetch fails or returns false
      }
      setLoading(false); // Stop the loading indicator
    };

    getBranchDetails(); // Call the async function inside useEffect
  }, [UserID]); // Dependency: re-run if UserID changes

  const renderBranch = ({ item }) => (

        <View style={styles.itemContainer}>
          <View style={styles.subItemContainer}>
            <Text style={styles.itemTitle}>{item.BranchName}</Text>
            <Text style={styles.itemDescription}>Branch Code: {item.BranchCode}</Text>
          </View>
          <TouchableOpacity
              onPress={() => {
                storeData('BranchData', item);

                if(type==='leftMenu'){
                  navigation.navigate('Home', {
                    UserID: UserID,
                    routname: 'Home',
                  });
                }else{
                  navigation.navigate('Main', {
                    UserID: UserID,
                    routname: 'Home', // Keep or remove based on whether 'Home' screen needs it
                  });
                }
              }}
              style={styles.listbutton}
            >
           <Text style={styles.listbuttonText}>SELECT</Text>
          </TouchableOpacity>
        </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Branch</Text>
      {loading ? (
         <ActivityIndicator size="large" color={colors.primary} /> // Use primary color
      ) : branchAvailable ? ( // Simplified conditional rendering
         branchList && branchList.length > 0 ? ( // Check if branchList is not null/empty
            <FlatList
              data={branchList}
              // Use a more stable key if item has a unique ID, otherwise index is okay
              keyExtractor={(item, index) => item.BranchID || index.toString()} // Assuming item might have BranchID
              renderItem={renderBranch}
            />
         ) : (
           // This case might occur if API returns suc:true but empty lstBranch
           <View style={{ justifyContent: 'center', alignItems: 'center' }}>
           <Text style={styles.errorText}>No branch details available.</Text>
           <TouchableOpacity 
            onPress={() => {
              navigation.navigate('Logout');
            }}
            style={styles.logoutbutton}
            >
              <Text style={styles.listbuttonText}>LOGOUT</Text>
           </TouchableOpacity>
          </View>
         )
      ) : (
        // This covers API failure or suc:false
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.errorText}>Failed to fetch branch details.</Text>
        <TouchableOpacity 
        onPress={() => {
          navigation.navigate('Logout');
        }}
        style={styles.logoutbutton}
        >
          <Text style={styles.listbuttonText}>LOGOUT</Text>
         </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default BranchselectionScreen

// --- Styles remain the same ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 1, // Consider removing if header provides spacing
    backgroundColor: colors.white, // Add background color if needed
  },
  subItemContainer: {
    flex: 1, // Allow text container to take available space
    flexDirection: 'column',
    // Removed alignment/textAlign as default left is usually fine
    // justifyContent: 'left', // Not needed for column
    // textAlign: 'left', // Apply to Text components if needed
    // alignItems: 'left', // Use 'flex-start'
    marginLeft: 20,
  },
  logoutbutton: {
    // width: '100', // Avoid fixed pixel width, use padding/flex
    backgroundColor: colors.primary,
    borderRadius: 25, // Make it rounder
    paddingVertical: 12, // Adjust padding
    paddingHorizontal: 20, // Add horizontal padding
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
    marginVertical: 10, // Adjust vertical margin
    marginRight: 20,
    width: 120, // Ensure minimum width
  },
  listbutton: {
    // width: '100', // Avoid fixed pixel width, use padding/flex
    backgroundColor: colors.primary,
    borderRadius: 25, // Make it rounder
    paddingVertical: 12, // Adjust padding
    paddingHorizontal: 20, // Add horizontal padding
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
    marginVertical: 10, // Adjust vertical margin
    marginRight: 20,
    minWidth: 90, // Ensure minimum width
  },
  listbuttonText: {
    color: colors.white,
    fontFamily: fonts.Bold,
    textAlign: 'center',
    fontSize: 14, // Adjust font size
  },
  title: {
    fontSize: 24,
    // fontWeight: 'bold', // Use fontFamily instead
    fontFamily: fonts.Regular,
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: colors.gray,
    padding: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space items out
    alignItems: 'center',
    paddingVertical: 10, // Add vertical padding
    paddingHorizontal: 5, // Reduce horizontal padding if needed
    borderBottomWidth: 1,
    borderColor: colors.gray,
    marginHorizontal: 10, // Add horizontal margin to the container
  },
  itemTitle: {
    fontSize: 18,
    // fontWeight: 'bold', // Use fontFamily
    fontFamily: fonts.SemiBold, // Maybe SemiBold is enough
    color: colors.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.subprimary,
    marginTop: 3,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16, // Make error text slightly larger
    paddingHorizontal: 20, // Add padding
  },
});
