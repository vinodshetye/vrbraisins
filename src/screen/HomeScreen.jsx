import { Image, StyleSheet, Text, FlatList, View, ActivityIndicator } from 'react-native'
import React, { useState, useCallback } from 'react'
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const retrieveData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error getting array:", e);
    return null;
  }
};



const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const {UserID, routname} = route.params;
  const [branchList, setBranchList] = useState(null); // State for branch data
  const [branchDetails, setBranchDetails] = useState(null);
  const [loading, setLoading] = useState(true); // State for loading indicator

 
  useFocusEffect(
    useCallback(() => {
      const getBranchDetails = async () => {
        console.log('HomeScreen focused, attempting to retrieve BranchData...');
        setLoading(true);
        const branches = await retrieveData('BranchData');
        if (branches) {
          console.log('HomeScreen found BranchData:', branches);
          setBranchDetails(branches);
        } else {
          console.log('HomeScreen did not find BranchData in AsyncStorage.');
          setBranchDetails(null); // Ensure state is cleared if no data
        }
        setLoading(false);
      };
      getBranchDetails();

      return () => {
        // Optional: Cleanup if needed when screen loses focus
        // console.log('HomeScreen lost focus');
      };
    }, []) // Empty dependency array for useCallback ensures the callback itself doesn't change, useFocusEffect handles re-running on focus.
  );

  const renderBranch = ({ item }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.BranchName}</Text>
        <Text style={styles.itemDescription}>Date : <Text style={{color: colors.black, fontFamily: fonts.SemiBold}}>{item.FDate + '/' + item.FMonth + '/' + item.FYear} - {item.TDate + '/' + item.TMonth + '/' + item.TYear}</Text></Text>
        <Text style={styles.itemDescription}>
          Branch Code : <Text style={{color: colors.black, fontFamily: fonts.SemiBold}}>{item.BranchCode}</Text>  
        </Text>
        <Text style={styles.itemDescription}>
          Year Code : <Text style={{color: colors.black, fontFamily: fonts.SemiBold}}>{item.YearCode}</Text>
        </Text>        
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Branch Detail</Text>
      {loading ? (
               <ActivityIndicator size="large" color={colors.primary} /> 
            ) : (
              branchDetails ? (
                <FlatList
                data={[branchDetails]} // FlatList expects an array, so wrap the single branchDetails object
                keyExtractor={(item) => item.BranchCode || 'branchDetailsKey'} // Use a unique key from the item
                renderItem={renderBranch}
                />
              ) : (
                <Text style={styles.errorText}>No branch data available. Please select a branch.</Text>
              )
            )
          }
    </View>
  );
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.Regular,
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: colors.gray,
    padding: 10,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: colors.gray,
    marginLeft: 20,
  },
  itemTitle: {
    fontSize: 18,
    fontFamily: fonts.SemiBold,
    color: colors.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.subprimary,
    marginTop: 5,
    fontFamily: fonts.Regular,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  }, 
});