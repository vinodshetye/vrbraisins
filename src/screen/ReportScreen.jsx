import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert, FlatList, ActivityIndicator } from 'react-native' // Added Platform
import React, {useState, useEffect, useLayoutEffect, useCallback, useRef} from 'react'
import { configs } from '../utils/configs';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import DatepickerComponent from './DatepickerComponent';
import { TextInput } from 'react-native-gesture-handler';
import DropdownComponent from './DropdownComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationdropdownComponent from './LocationdropdownComponent';
import LocationgroupdropdownComponent from './LocationgroupdropdownComponent';
import GoodstypelistComponent from './GoodstypelistComponent';

const retrieveData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Error getting array:", e);
      return null;
    }
  };

const fetchReportData = async ({branchCode, reportType, fdate, tdate, accountNo, goodsTypeID, locationGroupID, locationID, marketingNo, pageNo}) => { // Renamed for clarity

 const apiUrl = configs.API_URL_REPORTS;
 console.log('Report API URL:', apiUrl);
 //console.log('Request Data:', {branchCode, reportType, fdate, tdate, accountNo, goodsTypeID, locationGroupID, locationID, marketingNo});
 
  const requestBody = JSON.stringify({
    'PageNo': pageNo,
    'BranchCode':branchCode,
    'ReportType':reportType,
    'FromDate': fdate,
    'ToDate': tdate,
    'AccountNo': accountNo,
    'GoodsTypeID': goodsTypeID,
    'LocationGroupID': locationGroupID,
    'LocationID': locationID,
    'MarkingNo': marketingNo,
    }); // Convert raw data to JSON string
  
  console.log('Request Body:', requestBody);


  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 
      requestBody,
    });
    const data = await response.json();

    console.log('Response:', data.lstReport);
    if(data?.suc===true){
      return data.lstReport;
    }else{
      console.log(data?.suc || 'suc is undefined.');
      return false;
    }
  } catch (error) {
    console.log('Error fetching data:', error);
    return false;
  }
};

const ReportForm = React.memo(({
  onAccountChange,
  onGoodsTypeChange,
  onLocationGroupChange,
  onLocationChange,
  marketingNoVal,
  onMarketingNoChange,
  fdate,
  onFdateChange,
  tdate,
  onTdateChange,
  onShowReport,
  isLoadingBranch
}) => {
  console.log("Rendering ReportForm Header..."); // This will now only log when props actually change
  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainerSpace}>
         <DropdownComponent onChange={onAccountChange} />
      </View>
      <View style={styles.inputContainerSpace}>
        <GoodstypelistComponent onChange={onGoodsTypeChange} />
      </View>
      <View style={styles.inputContainerSpace}>
        <LocationgroupdropdownComponent onChange={onLocationGroupChange} />
      </View>
      <View style={styles.inputContainerSpace}>
        <LocationdropdownComponent onChange={onLocationChange} />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name={"document-text-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
        <TextInput style={styles.textInput} onChangeText={onMarketingNoChange} value={marketingNoVal} placeholder='Marking Like' placeholderTextColor={colors.secondary} keyboardType='default' selectTextOnFocus={true} autoCapitalize="none" />
      </View>
      <View style={styles.dateContainer}>
        <DatepickerComponent pickerTestID="fdatePicker" initialDate={fdate} onDateChange={onFdateChange} />
        <DatepickerComponent pickerTestID="tdatePicker" initialDate={tdate} onDateChange={onTdateChange} />
      </View>
      <TouchableOpacity style={styles.loginButtonWrapper} onPress={onShowReport} disabled={isLoadingBranch}>
        <Text style={styles.loginText}>SHOW REPORT</Text>
      </TouchableOpacity>
    </View>
  );
});




const ReportScreen = ({route}) => {
  const {UserID,type} = route.params;
  const navigation = useNavigation();
  const [branchDetails, setBranchDetails] = useState(null);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [accountNo, setAccountNo] = useState(0);
  const [fdate, setFdate] = useState(new Date()); // Initialize with new Date
  const [tdate, setTdate] = useState(new Date()); // Initialize with new Date
  const [ledgerData, setLedgerData] = useState([]);
  const [goodsType, setGoodsType] = useState(0);
  const [locationGroup, setLocationGroup] = useState(0);
  const [location, setLocation] = useState(0);
  const [marketingNoVal, setMarketingNoVal] = useState('');
  const [pageNo, setPageNo] = useState(1);

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [screenLoading, setScreenLoading] = useState(true);  
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null)

  useEffect(() => {
    const getBranchDetails = async () => {
      console.log('ReportScreen: useEffect fetching BranchData. Current route.params:', route.params);
      setIsLoadingBranch(true); // Ensure loading state is true
      const branches = await retrieveData('BranchData'); // Use await for cleaner async
        if (branches) {
          console.log('Ledger Screen found BranchData:', branches); // <-- Log if found
          setBranchDetails(branches);
          
          // Parse the date components from branches and create a Date object
          const year = parseInt(branches.FYear, 10);
          const month = parseInt(branches.FMonth, 10) - 1; // Month is 0-indexed in Date constructor
          const day = parseInt(branches.FDate, 10);
          // Check if parsing resulted in valid numbers before creating Date object
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            setFdate(new Date(year, month, day));
          } else {
            console.error("Failed to parse initial date from BranchData:", branches);
            setFdate(new Date()); // Fallback to current date if parsing fails
          }
        } else {
          console.log('ReportScreen did not find BranchData in AsyncStorage.');
          setBranchDetails(null); // Clear branch details if not found
          setFdate(new Date()); //Reset Brach date to current date
        }
      setIsLoadingBranch(false);
    };
    getBranchDetails();

   // If the navigation was triggered by a refresh action

if (route.params?.refreshReport === true) {
  console.log("ReportScreen: refreshReport=true detected. Clearing previous report data and resetting param.");
  setScreenLoading(true);
  setLedgerData([]);
  setPageNo(1);
  setHasMore(true); 
   setAccountNo(0);
   //setGoodsType(0);
   //setLocationGroup(0);
   //setLocation(0);
   setMarketingNoVal('');
   setTdate(new Date()); // Assuming fdate is reset by getBranchDetails
   setFdate(new Date()); // Assuming fdate is reset by getBranchDetails
  // Reset the refreshReport param to prevent re-triggering on other route.params changes.
  // This will cause this useEffect to run again, but route.params.refreshReport will be undefined.
  navigation.setParams({
    ...route.params,
    refreshReport: undefined, // or false
  });
}
}, [route.params, navigation]); 

  const refreshReport = useCallback(() => {
    console.log("ReportScreen: refreshReport function called. Navigating to current route name:", route.name);
    // Navigate to the current route's actual name (e.g., 'Trading Stock') instead of the component name 'ReportScreen'.
    navigation.navigate(route.name, {...route.params, refreshReport: true});
  }, [navigation, route.name, route.params]); // Added `route.name` and ensured `route.params` are dependencies.


// 2. Wrap state change handlers in useCallback to keep their references stable.
const handleAccountChange = useCallback((value) => setAccountNo(value === null ? '0' : value), []);
const handleGoodsTypeChange = useCallback((value) => setGoodsType(value === null ? '0' : value), []);
const handleLocationGroupChange = useCallback((value) => setLocationGroup(value === null ? '0' : value), []);
const handleLocationChange = useCallback((value) => setLocation(value === null ? '0' : value), []);

// handleShowReport is already memoized with useCallback, which is great.
// State setters from useState (like setMarketingNoVal, setFdate, setTdate) are already stable
// and don't need to be wrapped in useCallback.


  const handleShowReport = useCallback((isInitialLoad = true) => {
    if (!branchDetails || !branchDetails.BranchCode) {
      console.error("Branch details are not loaded yet or incomplete.");
      Alert.alert("Error", "Branch details are not available. Please select a branch first or pull to refresh if already selected.");
      return;
    }
    
    setScreenLoading(false);
    setIsLoading(true);
    setLedgerData([]);
    setPageNo(1);
    setHasMore(true);

    //const formattedFdate = fdate.toISOString().split('T')[0];
    //const formattedFdate = fdate.toLocaleDateString('en-GB');
    const formattedFdate = fdate.toLocaleDateString('en-GB');
    const formattedTdate = tdate.toLocaleDateString('en-GB');

        
    fetchReportData({
      branchCode: branchDetails.BranchCode,
      reportType: type,
      fdate: formattedFdate,
      tdate: formattedTdate,
      accountNo: accountNo,
      goodsTypeID: goodsType,
      locationGroupID: locationGroup,
      locationID: location,
      marketingNo: marketingNoVal,
      pageNo: 1,
    }).then((data) => {
        if (data && data.length > 0) {
          console.log('Report data received -->', data);
          setLedgerData(data);
          // TODO: Display ledger data
        } else {
          console.log('No Report data found or API error.');
          setLedgerData([]); // Clear previous data on error or no data
          setHasMore(false);
          if(data !== false){
            Alert.alert("No Data", "No report data found for the selected criteria.");
          }
        }
        setIsLoading(false);
      });
    }, [branchDetails, type, fdate, tdate, accountNo, goodsType, locationGroup, location, marketingNoVal]);

    const fetchMoreData = () => {
      if (isLoading || isFetchingMore || !hasMore) {
        return;
      }
      setIsFetchingMore(true);
      const nextPage = pageNo + 1;

      const formattedFdate = fdate.toLocaleDateString('en-GB');
      const formattedTdate = tdate.toLocaleDateString('en-GB');

      fetchReportData({
        branchCode: branchDetails.BranchCode,
        reportType: type,
        fdate: formattedFdate,
        tdate: formattedTdate,
        accountNo: accountNo,
        goodsTypeID: goodsType,
        locationGroupID: locationGroup,
        locationID: location,
        marketingNo: marketingNoVal,
        pageNo: nextPage,
      }).then((data) => {
        if (data && data.length > 0) {
          setLedgerData(prevData => [...prevData, ...data]);
          setPageNo(nextPage);
        } else {
          setHasMore(false);
        }
        setIsFetchingMore(false);
      }).catch(() => setIsFetchingMore(false));
    };


    const renderLedgerData  = ({ item }) => (
      <View style={styles.itemContainer}>
          <View>
              <View style={styles.itemTitle}>
                <Text style={styles.iTitle}>In. No. {item.InNo}</Text>
                <Text style={styles.iTitle}>{item.InDate}</Text>
              </View>
                <Text style={styles.itemDescription}>Marking No. <Text style={{fontFamily:fonts.Bold}}>{item.MarkingNo}</Text></Text>
                <Text style={styles.itemDescription}>Location. <Text style={{fontFamily:fonts.Bold}}>{item.Location}</Text></Text>
                <Text style={[styles.itemDescription, {color:colors.green, textAlign:'left'}]}>Goods Type. <Text style={{fontFamily:fonts.Bold}}>{item.GoodsTypeName}</Text></Text>
                <Text style={[styles.itemDescription, {color:colors.green, textAlign:'left'}]}>Final Rate. <Text style={{fontFamily:fonts.Bold}}>{item.FinalRate}</Text></Text>
              <View style={styles.subItemContainer}>
                  <Text style={styles.green}>Bal. Qty. <Text style={{fontFamily:fonts.Bold}}>{item.BalQty}</Text></Text> 
                  <Text style={styles.red}>Bal. WT. <Text style={{fontFamily:fonts.Bold}}>{item.BalWt}</Text></Text>
              </View>
          </View>
      </View>
    );

    const handleScroll = (event) => {
      // Show button if user has scrolled down more than a certain amount (e.g., 400px)
      if (event.nativeEvent.contentOffset.y > 400) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    const handleScrollToTop = () => {
      // Scroll to the top of the list
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    useLayoutEffect(() => {
      // Set the headerRight button for refresh
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={refreshReport}
            disabled={isLoading || isLoadingBranch} // Disable button when loading
            style={{ marginRight: 15 }}
          >
            <Ionicons 
              name="refresh-outline" 
              size={25} 
              color={(isLoading || isLoadingBranch) ? colors.gray : colors.white} // Dim icon when disabled
            />
          </TouchableOpacity>
        ),
      });
    }, [navigation, refreshReport, isLoading, isLoadingBranch]); // Dependencies for useLayoutEffect
  
    // Display loading indicator for branch details
    if (isLoadingBranch) {
      return <View style={styles.containerCentered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <FlatList
        ref={flatListRef}
        style={styles.container} // Apply container styles to the FlatList itself
        data={ledgerData}
        renderItem={screenLoading===false?renderLedgerData:null}
        keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps="always"
        onScroll={handleScroll}
        scrollEventThrottle={16} // Ensures onScroll fires smoothly
        // Use the memoized form component as the header
        ListHeaderComponent={
          <ReportForm
            onAccountChange={handleAccountChange}
            onGoodsTypeChange={handleGoodsTypeChange}
            onLocationGroupChange={handleLocationGroupChange}
            onLocationChange={handleLocationChange}
            marketingNoVal={marketingNoVal}
            onMarketingNoChange={setMarketingNoVal}
            fdate={fdate}
            onFdateChange={setFdate}
            tdate={tdate}
            onTdateChange={setTdate}
            onShowReport={handleShowReport}
            isLoadingBranch={isLoadingBranch}
          />
        }
        // Correctly set up for pagination
        onEndReached={fetchMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small"  color={colors.primary} style={{ marginBottom: 30 }} /> : null}
        ListEmptyComponent={isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      />
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={handleScrollToTop}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-up" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  )
}

export default ReportScreen

const styles = StyleSheet.create({
container: {
    flex: 1, // Ensure container takes up space
    backgroundColor: colors.white,
    padding: 15,
    //justifyContent: 'center', // Center content vertically within padding
},
containerCentered: { // Added for centering loading indicator
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.white,
},
formContainer: {
    marginTop: 5, // Reduced top margin
},
dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
},
iconStyle: {
    marginRight: 5, // Add space between icon and text input
},
subItemContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
loginButtonWrapper: {
  backgroundColor: colors.primary,
  borderRadius: 100,
  marginVertical: 10,
  paddingVertical: 10, // Use padding for button height
  alignItems: 'center', // Center text horizontally
  justifyContent: 'center', // Center text vertically
},
loginText: {
  color: colors.white,
  fontFamily: fonts.Bold,
  textAlign: 'center',
  padding:2, // Padding applied to wrapper
  fontSize: 18, // Slightly smaller font size
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
    fontFamily: fonts.Bold, // Maybe SemiBold is enough
    color: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  iTitle: {
    fontSize: 18,
    fontFamily: fonts.Bold, // Maybe SemiBold is enough
    color: colors.primary,
  },
  iVNO: {
    fontSize: 20,
    fontFamily: fonts.Bold, // Maybe SemiBold is enough
    color: colors.primary,
    backgroundColor: colors.gray,
    padding:1,
    borderRadius: 50,
    height: 30,
    width: 30,
    textAlign: 'center', 
  },
  itemDescription: {
    fontSize: 16,
    color: colors.subprimary,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  green: {
    fontSize: 16,
    color: colors.green,
    marginTop: 3,
    width: '50%',
    textAlign: 'left',
  },
  red: {
    fontSize: 16,
    color: colors.green,
    marginTop: 3,
    width: '50%',
    textAlign: 'right',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16, // Make error text slightly larger
    paddingHorizontal: 20, // Add padding
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 100,
    paddingHorizontal: 15, // Adjusted padding
    alignItems: 'center',
    padding: 3, // Replaced by vertical padding/height
    marginVertical: 10,
    height: 55, // Give inputs a fixed height
  },
  inputContainerSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  textInput: {
    backgroundColor: colors.white,
    width: '90%',
  },
  scrollToTopButton: {
    position: 'absolute',
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 25,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
