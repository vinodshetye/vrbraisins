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

const fetchData = async ({branchCode}) => {

  console.log('branchCode ---> ',branchCode);
  const apiUrl = configs.API_URL_ACCOUNT_LIST;
  console.log('Account List API URL:', apiUrl);
 
   try {
     const response = await fetch(apiUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({'BranchCode':branchCode, 'GroupID':0}), // Convert raw data to JSON string
     });
     const data = await response.json();
 
     console.log('Response:', data);
     if(data?.suc===true){
       return data.lstpl;
     }else{
       console.log(data?.suc || 'suc is undefined.');
       return false;
     }
   } catch (error) {
     console.log('Error fetching data:', error);
     return false;
   }
 };


const DropdownComponent = ({ onChange }) => { // Added onChange prop
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [branchCode, setBranchCode] = useState(null);

  const [items, setItems] = useState([]);

  useEffect(() => {
    retrieveData('BranchData').then((data) => {
      if (data) {
        console.log('data if ',data);
        console.log('data if BranchCode -> ',data.BranchCode);
        setBranchCode(data.BranchCode);
      } else {
        console.log('No data found in AsyncStorage.');
      }
    });

    fetchData({branchCode}).then((accountData) => {
      if (accountData) {
        console.log('accountData-->',accountData);

        const newArray = accountData.map(item => {
          return {
            label: item.AccountName,
            value: item.AccountNo,
          }
        });
        console.log('newArray-->',newArray);

        setItems(newArray);
      } else {
        console.log('No data found in AsyncStorage.');
      }
    });
  }, [branchCode]);

  useEffect(() => {
    // Call the parent's onChange callback when the internal value changes
    if (onChange) {
      onChange(value);
    }
  }, [value, onChange]);


  return (  
   <DropDownPicker
      flatListProps={{ keyboardShouldPersistTaps: "always" }}
      placeholder="Select Party/Farmer Name"
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


export default DropdownComponent

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
