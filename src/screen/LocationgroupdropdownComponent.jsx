import { StyleSheet } from 'react-native'
import React, {useState, useEffect} from 'react'
import { configs } from '../utils/configs';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import DropDownPicker from 'react-native-dropdown-picker';
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

const storeData = async (key, value) => {
  try {
    const jsonItemValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonItemValue);
  } catch (error) {
    console.log('Error storing data:', error);
  }
};

const fetchData = async () => {  
  const storedData = await retrieveData('LocationGroupData');
  if (storedData) {
    console.log('data if ', storedData);
    return storedData;
  } else {
    console.log('No data found in AsyncStorage.');
    const apiUrl = configs.API_URL_LOCATION_GROUP_LIST;
    console.log('Account List API URL:', apiUrl);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'LocationGroupID': 0 }), // Convert raw data to JSON string
      });
      const data = await response.json();
      console.log('Response:', data);
      if (data?.suc === true) {
        await storeData('LocationGroupData', data.lstpl);
        return data.lstpl;
      } else {
        console.log(data?.suc || 'suc is undefined.');
        return false;
      }
    } catch (error) {
      console.log('Error fetching data:', error);
      return false;
    }
  }
};

const LocationgroupdropdownComponent = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData().then((locationGroupData) => {
      if (locationGroupData) {
        console.log('locationGroupData -->',locationGroupData);
        const newArray = locationGroupData.map(item => {
          return {
            label: item.LocationGroup,
            value: item.LocationGroupID,
          }
        });
        console.log('newArray-->',newArray);
        setItems(newArray);
      } else {
        console.log('No data found in AsyncStorage.');
      }
    });
  }, []);

  useEffect(() => {
    // Call the parent's onChange callback when the internal value changes
    if (onChange) {
      onChange(value);
    }
  }, [value, onChange]);


  return (  
   <DropDownPicker
      flatListProps={{ keyboardShouldPersistTaps: "always" }}
      placeholder="Select Location Group"
      placeholderStyle={{color: "grey",fontWeight: "bold"}}
      mode="BADGE"
      open={open}
      value={value}
      items={items}
      setOpen={setOpen} 
      setValue={setValue}
      setItems={setItems}
      style={styles.dropdowntextInput}
      searchable={true}
      listMode="MODAL"
    />
  );
};


export default LocationgroupdropdownComponent

const styles = StyleSheet.create({
dropdowntextInput: {
    padding: 12, // Padding handled by container height/vertical alignment
    paddingLeft: 45,
    fontFamily: fonts.Regular, // Use Regular font for input
    fontSize: 16, // Slightly smaller font size
    color: colors.gray, // Ensure input text color is visible
    backgroundColor: colors.white,
    borderRadius: 100,
    borderColor: colors.secondary,
},
});
