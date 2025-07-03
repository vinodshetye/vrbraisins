import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert, FlatList } from 'react-native' // Added Platform
import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react'
import { configs } from '../utils/configs';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native-gesture-handler';


// Define DatepickerComponent
const DatepickerComponent = ({ initialDate, onDateChange, pickerTestID }) => {
  const [date, setDate] = useState(initialDate || new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Update internal date if initialDate prop changes from parent
    if (initialDate) {
        setDate(initialDate);
    }
  }, [initialDate]);

  const onChangeInternal = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
    if (onDateChange) {
      onDateChange(currentDate); // Notify parent
    }
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  return (
    <>
      <TouchableOpacity onPress={() => showMode('date')} style={styles.dateInputContainer}>
        <Ionicons name={"calendar-outline"}
            size={25}
            color={colors.primary}
            style={styles.iconStyle}
          />
          <TextInput
            style={styles.dateTextInput}
            readOnly={true}
            placeholder="Select Date"
            placeholderTextColor={colors.secondary}
            value={date.toLocaleDateString('en-GB')}
          />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID={pickerTestID}
          value={date}
          mode={mode}
          is24Hour={true}
          display="spinner"
          onChange={onChangeInternal}
        />
      )}  
    </>
  );
};

export default DatepickerComponent;

const styles = StyleSheet.create({  
    dateInputContainer: { // Renamed for clarity, specific to date picker
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 100,
        paddingHorizontal: 10, // Adjusted padding
        alignItems: 'center',
        padding: 3, // Replaced by vertical padding/height
        marginVertical: 10,
        height: 50, // Give inputs a fixed height
        width: '50%',
        marginEnd: 5,
    },
    iconStyle: {
        marginRight: 5, // Add space between icon and text input
    },
    dateTextInput: { // Renamed for clarity
        flexDirection: 'column',
        padding: 10, // Padding handled by container height/vertical alignment
        fontFamily: fonts.Regular, // Use Regular font for input
        fontSize: 16, // Slightly smaller font size
        color: colors.drakgray, // Ensure input text color is visible
        backgroundColor: colors.white,
        borderRadius: 100,
        borderColor: colors.secondary,
    },
});