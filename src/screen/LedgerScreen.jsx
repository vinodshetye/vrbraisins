import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert, FlatList, ActivityIndicator } from 'react-native' // Added Platform
import React, {useState, useEffect, useLayoutEffect, useCallback, useRef} from 'react'
import { useNavigation } from '@react-navigation/native';
import { configs } from '../utils/configs';
import { colors } from '../utils/colors';
import { fonts } from '../utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import DatepickerComponent from './DatepickerComponent';
import { TextInput } from 'react-native-gesture-handler';
import DropdownComponent from './DropdownComponent';
import OtherMaterialsListComponent from './OthermaterialslistComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationdropdownComponent from './LocationdropdownComponent';
import LocationgroupdropdownComponent from './LocationgroupdropdownComponent';

const retrieveData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Error getting array:", e);
      return null;
    }
  };

const fetchLedgerData = async ({branchCode, yearCode, fdate, tdate, accountNo, marketingNo, DCNo, otherMaterials, auctionNo, locationGroup, location, palaRecNo, requestType, pageNo}) => { // Renamed for clarity

  console.log('requestType:----', requestType);

  const apiUrl = configs[`API_URL_${requestType}`];

 console.log('Ledger Book API URL:', apiUrl);
 console.log('Request Data:', {branchCode, yearCode, fdate, tdate, accountNo, marketingNo, DCNo, otherMaterials, auctionNo, locationGroup, location, palaRecNo, pageNo});

  const requestBody = JSON.stringify({
    'PageNo':pageNo,
    'BranchCode':branchCode,
    'YearCode': yearCode,
    'FromDate': fdate,
    'ToDate': tdate,
    'AccountNo': accountNo,
    'MarkingNo': marketingNo,
    'DCNO': DCNo,
    'AuctionNo': auctionNo,
    'MaterialCode': otherMaterials,
    'LocationGroupID': locationGroup,
    'LocationID': location,
    'PalaRecNo': palaRecNo,
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

    console.log('Response:', data.lstLedgerBook||data.lstReport);
    if(data?.suc===true){
      return data.lstLedgerBook||data.lstReport;
    }else{
      console.log(data?.suc || 'suc is undefined.');
      return false;
    }
  } catch (error) {
    console.log('Error fetching data:', error);
    return false;
  }
};

const LedgerScreen = ({route}) => {
  const currentYear = new Date(2025,3,1);
  const {UserID,type} = route.params;
  const navigation = useNavigation();
  const [branchDetails, setBranchDetails] = useState(null);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [accountNo, setAccountNo] = useState(0);
  const [otherMaterials, setOtherMaterials] = useState(0);
  const [fdate, setFdate] = useState(currentYear); // Initialize with new Date
  const [tdate, setTdate] = useState(new Date()); // Initialize with new Date
  const [ledgerData, setLedgerData] = useState([]);
  const [marketingNoVal, setMarketingNoVal] = useState('');
  const [DCNoVal, setDCNoVal] = useState('');
  const [auctionNo, setAuctionNo] = useState('');
  const [locationGroup, setLocationGroup] = useState(0);
  const [location, setLocation] = useState(0);
  const [palaRecNo, setPalaRecNo] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [screenLoading, setScreenLoading] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const getBranchDetails = async () => {
      console.log('Leader focused, attempting to retrieve BranchData...'); // <-- Add log
      setIsLoadingBranch(true);
      const branches = await retrieveData('BranchData'); 
        if (branches) {
          console.log('Ledger Screen found BranchData:', branches); // <-- Log if found
          setBranchDetails(branches);        
        } else {
          console.log('Ledger Screen did not find BranchData in AsyncStorage.'); // <-- Log if not found
          setBranchDetails(null);
        }
        setIsLoadingBranch(false);
    };
    getBranchDetails();
 
    if (route.params?.refreshReport === true) {
      console.log("ReportScreen: refreshReport=true detected. Clearing previous report data and resetting param.");
      setScreenLoading(true);
      setLedgerData([]); 
      setPageNo(1);
      setHasMore(true);
      setAccountNo(0);
      setOtherMaterials(0);
      setFdate(currentYear);
      setTdate(new Date()); // Assuming fdate is reset by getBranchDetails
      setMarketingNoVal('');
      setDCNoVal('');
      setAuctionNo('');  
      setLocationGroup(0);
      setLocation(0);
      setPalaRecNo('');
      // Reset the refreshReport param to prevent re-triggering on other route.params changes.
      // This will cause this useEffect to run again, but route.params.refreshReport will be undefined.
      navigation.setParams({
        ...route.params,
        refreshReport: false,
      });
    } 
  }, [navigation, route.params]); 

  const refreshReport = useCallback(() => {
      console.log("ReportScreen: refreshReport function called. Navigating to current route name:", route.name);
      // Navigate to the current route's actual name (e.g., 'Trading Stock') instead of the component name 'ReportScreen'.
      navigation.navigate(route.name, {...route.params, refreshReport: true});
    }, [navigation, route.name, route.params]); // Added `route.name` and ensured `route.params` are dependencies.
  

  const handleShowLedger = useCallback(() => {
    if (!branchDetails || !branchDetails.BranchCode) {
      console.error("Branch details are not loaded yet or incomplete.");
      Alert.alert("Error", "Branch details are not available. Please try again.");
      return;
    }
    setScreenLoading(false);
    setIsLoading(true);
    setLedgerData([]);
    setPageNo(1);
    setHasMore(true);

    //const formattedFdate = fdate.toISOString().split('T')[0];
    const formattedFdate = fdate.toLocaleDateString('en-GB');
    const formattedTdate = tdate.toLocaleDateString('en-GB');
    fetchLedgerData({
      branchCode: branchDetails.BranchCode,
      yearCode: branchDetails.YearCode,
      fdate: formattedFdate,
      tdate: formattedTdate,
      accountNo: accountNo,
      marketingNo: marketingNoVal,
      DCNo: DCNoVal,
      auctionNo: auctionNo,
      otherMaterials: otherMaterials,
      requestType: type,
      locationGroup: locationGroup,
      location: location,
      palaRecNo: palaRecNo,
      pageNo: 1,
    }).then((data) => {
        if (data && data.length > 0) { 
          console.log('Report data received -->', data);         
          setLedgerData(data);          
          // TODO: Display ledger data
        } else { 
          console.log('No data found or API error.'); 
          setLedgerData([]);
          setHasMore(false);
        }
        setIsLoading(false);
      });
    }, [branchDetails, type, fdate, tdate, accountNo, marketingNoVal, DCNoVal, auctionNo, otherMaterials, locationGroup, location, palaRecNo]);

    const fetchMoreData = () => {
      if (isLoading || isFetchingMore || !hasMore) {
        return;
      }
      setIsFetchingMore(true);
      const nextPage = pageNo + 1;
  
      const formattedFdate = fdate.toLocaleDateString('en-GB');
      const formattedTdate = tdate.toLocaleDateString('en-GB');
  
      fetchLedgerData({
        branchCode: branchDetails.BranchCode,
        yearCode: branchDetails.YearCode,
        fdate: formattedFdate,
        tdate: formattedTdate,
        accountNo: accountNo,
        marketingNo: marketingNoVal,
        DCNo: DCNoVal,
        auctionNo: auctionNo,
        otherMaterials: otherMaterials,
        requestType: type,
        locationGroup: locationGroup,
        location: location,
        palaRecNo: palaRecNo,
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


  const render_Ledger = ({ item }) => (
      <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}>{item.TrnDate}</Text>
              <Text style={styles.iVNO}>{item.VNo}</Text>
            </View>
              <Text style={styles.itemDescription}>{item.Particulers}</Text> 
              <Text style={styles.itemDescription}>{item.Narration}</Text>
            <View style={styles.subItemContainer}>
                <Text style={styles.green}>{item.Amount}</Text> 
                <Text style={styles.red}>{item.BalAmt} {item.DrCr==='D'?'Dr':'Cr'}</Text>
            </View>
        </View>
    </View>
    );

  const render_AuctionDCRegister = ({ item }) => (
    <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}></Text>
            </View>
              <Text style={styles.itemDescription}>Marking No. {item.MarkingNo}</Text> 
              <Text style={styles.itemDescription}>Qty. {item.Qty}</Text>
            <View style={styles.subItemContainer}>
                <Text style={styles.green}>Weight. {item.SaleWeight}</Text> 
                <Text style={styles.red}>Rate. {item.SaleRate}</Text>
            </View>
        </View>
    </View>
  );

  const render_AuctionRegister = ({ item }) => (
    <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}>Date: {item.AuctionDate!==null?new Date(item.AuctionDate.date).toLocaleDateString('en-GB'):''}</Text>
            </View>
              <Text style={styles.itemDescription}>Marking No. {item.MarkingNo}</Text> 
              <Text style={styles.itemDescription}>Sample Details. {item.SampleDetails}</Text>
              <Text style={styles.itemDescription}>Net Weight. {item.NetWeight}</Text>
              <Text style={styles.itemDescription}>Weight. {item.Weight}</Text>
            <View style={styles.subItemContainer}>
                <Text style={styles.green}>Qty. {item.Quantity}</Text> 
                <Text style={styles.red}>Rate. {item.Rate}</Text>
            </View>
        </View>
    </View>
  );

  const render_AuctionSaleRegister= ({ item }) => (
    <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}>Sales Date: {item.SaleTrnDate!==null?new Date(item.SaleTrnDate.date).toLocaleDateString('en-GB'):''}</Text>
            </View>
              <Text style={styles.itemDescription}>Farmer Party. {item.FarmerPartyName}</Text>
              <Text style={styles.itemDescription}>Sales Party. {item.SalesPartyName}</Text>
              <Text style={styles.itemDescription}>Marking No. {item.MarkingNo}</Text>              
            <View style={styles.subItemContainer}>
                <Text style={styles.green}>Qty. {item.Quantity}</Text> 
                <Text style={styles.red}>Rate. {item.Rate}</Text>
            </View>
        </View>
    </View>
  );

  const render_OtherMaterialStock = ({ item }) => (
    <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}>{item.MaterialName}</Text>
            </View>
           
              <Text style={styles.itemDescription}>Material Code. {item.MaterialCode}</Text> 
              <Text style={styles.itemDescription}>In Qty. {item.InQuantity}</Text>
              <Text style={styles.itemDescription}>Out Qty. {item.OutQuantity}</Text>
            <View style={styles.subItemContainer}>
              <Text style={[styles.green, {width:'98%'}]}>Balance Qty. {item.BalQuantity}</Text>
            </View>
        </View>
    </View>
  );

  const render_PalaReceiveRegister = ({ item }) => (
    <View style={styles.itemContainer}>
        <View>
            <View style={styles.itemTitle}>
              <Text style={styles.iTitle}>{item.MarkingNo}</Text>
            </View>
           
              <Text style={styles.itemDescription}>Pala Receive No. {item.PalaRecNo}</Text> 
              <Text style={styles.itemDescription}>In Qty. {item.InQty}</Text>
              <Text style={styles.itemDescription}>Out Qty. {item.OutwardQty}</Text>
            <View style={styles.subItemContainer}>
              <Text style={[styles.green, {width:'98%'}]}>Balance Qty. {item.BalQty}</Text>
            </View>
        </View>
    </View>
  );

  // Define the mapping object for render functions
  const renderFunctions = {
    Ledger: render_Ledger,
    AuctionDCRegister: render_AuctionDCRegister,
    AuctionRegister: render_AuctionRegister,
    OtherMaterialStock: render_OtherMaterialStock,
    AuctionSaleRegister: render_AuctionSaleRegister,
    PalaReceiveRegister: render_PalaReceiveRegister,
  };

  // Fallback renderItem in case type is not found or render function is undefined
  const defaultRenderItem = ({ item }) => (
    <View><Text style={styles.errorText}>Error: Renderer not available for type "{type}".</Text></View>
  );

  
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <FlatList
      ref={flatListRef}
      style={styles.container}
      data={ledgerData}
      keyExtractor={(item, index) => index.toString()}
      renderItem={screenLoading === false ? (renderFunctions[type] || defaultRenderItem) : null}
      keyboardShouldPersistTaps="always"
      onScroll={handleScroll}
      scrollEventThrottle={16} // Ensures onScroll fires smoothly
      ListHeaderComponent={
        <View style={styles.formContainer}>
      {type==='OtherMaterialStock' ? (
           <View style={styles.inputContainerSpace}>
                <OtherMaterialsListComponent value={otherMaterials} onChange={(value) => setOtherMaterials(value)} />
           </View>
           ) : (
           <View style={styles.inputContainerSpace}>
                <DropdownComponent value={accountNo} onChange={(value) => setAccountNo((value===null)?'0':value)} />
           </View>
      )}

      {type==='PalaReceiveRegister' ? (
          <>
          <View style={styles.inputContainerSpace}>
              <LocationgroupdropdownComponent value={locationGroup} onChange={(value) => setLocationGroup(value)} />
          </View>
          <View style={styles.inputContainerSpace}>
              <LocationdropdownComponent value={location} onChange={(value) => setLocation(value)} />
          </View>
          </>
      ):null}


      {(type==='PalaReceiveRegister' || type==='AuctionDCRegister' || type==='AuctionSaleRegister')?(
            <>
           <View style={styles.inputContainer}>
                <Ionicons name={"document-text-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
                <TextInput
                style={styles.textInput}
                onChangeText={setMarketingNoVal}
                value={marketingNoVal}
                placeholder='Marking Like' // Corrected typo
                placeholderTextColor={colors.secondary}
                keyboardType='default'
                selectTextOnFocus={true} 
                autoCapitalize="none" // Prevent auto-capitalization for usernames
                />
          </View>
          <View style={styles.inputContainer}>
                <Ionicons name={"document-text-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
                <TextInput
                style={styles.textInput}
                onChangeText={type==='PalaReceiveRegister'?setPalaRecNo:type==='AuctionSaleRegister'?setAuctionNo:setDCNoVal}
                value={type==='PalaReceiveRegister'?palaRecNo:type==='AuctionSaleRegister'?auctionNo:DCNoVal}
                placeholder={type==='PalaReceiveRegister'?'Pala Receive No':type==='AuctionSaleRegister'?'Auction No':'DC Number'} // Corrected typo
                placeholderTextColor={colors.secondary}
                keyboardType='default'
                selectTextOnFocus={true} 
                autoCapitalize="none" // Prevent auto-capitalization for usernames
                />
          </View>
          </>
           ):null}

      {type==='AuctionRegister'?(
          <View style={styles.inputContainer}>
                <Ionicons name={"document-text-outline"} size={25} color={colors.primary} style={styles.iconStyle} />
                <TextInput
                style={styles.textInput}
                onChangeText={setAuctionNo}
                value={auctionNo}
                placeholder='Auction Number' // Corrected typo
                placeholderTextColor={colors.secondary}
                keyboardType='default'
                selectTextOnFocus={true} 
                autoCapitalize="none" // Prevent auto-capitalization for usernames
                />
          </View>
       ):null}
          
          <View style={styles.dateContainer}> 
              <DatepickerComponent pickerTestID="fdatePicker" initialDate={fdate} onDateChange={setFdate} />
              <DatepickerComponent pickerTestID="tdatePicker" initialDate={tdate} onDateChange={setTdate} />
          </View>
        <TouchableOpacity style={styles.loginButtonWrapper} onPress={handleShowLedger} disabled={isLoadingBranch}>
          <Text style={styles.loginText}>SHOW {route.name}</Text>
        </TouchableOpacity>
        </View>
        }
        onEndReached={fetchMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 30 }} /> : null}
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

export default LedgerScreen

const styles = StyleSheet.create({
container: {
    flex: 1, // Ensure container takes up space
    backgroundColor: colors.white,
    paddingHorizontal: 20,
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
  fontSize: 16, // Slightly smaller font size
  textTransform: 'uppercase',
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
    fontSize: 17,
    fontFamily: fonts.Bold, // Maybe SemiBold is enough
    color: colors.primary,
  },
  iVNO: {
    fontSize: 18,
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
    width: '99%',
    flexWrap: 'wrap',
  },
  green: {
    fontSize: 16,
    fontFamily: fonts.SemiBold,
    color: colors.green,
    marginTop: 2,
    width: '49%',
    textAlign: 'left',
  },
  red: {
    fontSize: 16,
    fontFamily: fonts.SemiBold,
    color: colors.red,
    marginTop: 2,
    width: '49%',
    textAlign: 'left',
    paddingLeft: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subprimary
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
    bottom: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
