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
  const storedData = await retrieveData('GoodstypeData');
  if (storedData) {
    console.log('data if ', storedData);
    return storedData;
  } else {
    console.log('No data found in AsyncStorage.');
    const apiUrl = configs.API_URL_GOODS_TYPE_LIST;
    console.log('Goods Type List API URL:', apiUrl);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Convert raw data to JSON string
      });
      const data = await response.json();
      console.log('Response:', data);
      if (data?.suc === true) {
        await storeData('GoodstypeData', data.lstGT);
        return data.lstGT;
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

const GoodstypelistComponent = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData().then((goodsTypeData) => {
      if (goodsTypeData) {
        console.log('goodsTypeData -->',goodsTypeData);
        const newArray = goodsTypeData.map(item => {
          return {
            label: item.GoodsTypeName,
            value: item.GoodsTypeID,
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
      placeholder="Select Goods Type"
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
      zIndex={500}
      listMode="MODAL"
    />
  );
};

export default GoodstypelistComponent

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
