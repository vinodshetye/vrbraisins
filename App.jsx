import { View, Image, Text, StyleSheet,TouchableOpacity, ActivityIndicator } from 'react-native'
import React, {useState, useEffect, useCallback} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import BranchselectionScreen from './src/screen/BranchselectionScreen';
import HomeScreen from './src/screen/HomeScreen';
import LoginScreen from './src/screen/LoginScreen';
import LedgerScreen from './src/screen/LedgerScreen';
import Logout from './src/screen/Logout';
import { colors } from './src/utils/colors';
import { fonts } from './src/utils/fonts';
import Ionicons from "react-native-vector-icons/Ionicons";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'; // Removed DrawerContent import as it's not used directly
import ReportScreen from './src/screen/ReportScreen';

const Stack = createNativeStackNavigator();
const Drawer =  createDrawerNavigator();

const retrieveJsonData = async (key) => { // Renamed for generic use
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null; // Return null if not found
  } catch (e) {
    console.log(`Error retrieving JSON data for key "${key}":`, e);
    return null;
  }
};

const CustomDrawerContent = (props) => {
  const { routeNames, index } = props.state;
  const focusedRouteName = routeNames[index];

  const [branchData, setBranchData] = useState(null); // Initialize with null
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranchDataAndUpdateState = useCallback(async () => {
    setIsLoading(true);
    const data = await retrieveJsonData('BranchData');
    if (data) {
      console.log('CustomDrawerContent: Found BranchData in AsyncStorage:', data);
      setBranchData(data);
    } else {
      console.log('CustomDrawerContent: Did not find BranchData in AsyncStorage.');
      setBranchData(null); // Ensure state is cleared if no data
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    const currentRouteName = props.state.routes[props.state.index].name;
    console.log(`CustomDrawerContent: Active route is "${currentRouteName}", (re)fetching BranchData.`);
    
    fetchBranchDataAndUpdateState();

    return () => {
      // Optional: Cleanup if needed when the component unmounts or before the effect re-runs.
    };
  }, [props.state.index, fetchBranchDataAndUpdateState]);
  

  // Helper function to reduce repetition
  const renderDrawerItem = (label, routeName, iconName) => (
    <DrawerItem
      label={label}
      onPress={() => props.navigation.navigate(routeName)}
      focused={focusedRouteName === routeName}
      activeBackgroundColor={colors.primary}
      inactiveTintColor={colors.drakgray}
      activeTintColor={colors.white}
      style={styles.menuTitle}
      icon={() => (
        <Ionicons
          name={iconName}
          size={18}
          color={focusedRouteName === routeName ? colors.white : colors.drakgray}
        />
      )}
      labelStyle={{ fontSize: 15, fontFamily: fonts.Regular }} // Added font family for consistency
    />
  );

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.menuTextContainer}>
        <Image source={require("./src/assets/vrb_logo.png")} style={styles.logo} />
        <View style={styles.menuHeaderContent}>
          <Text style={styles.menuHeadTitle} numberOfLines={2} ellipsizeMode="tail">
            {branchData ? (branchData.BranchName || 'Branch Name') : 'Branch Name'}
          </Text>
        </View>
      </View>
      {renderDrawerItem('Home', 'Home', 'home-outline')}
      
      {branchData && (
        <>
          {branchData.AuctionDCRegister === 1 && renderDrawerItem('Auction DC Register', 'Auction DC Register', 'alert-circle-outline')}
          {branchData.AuctionRegister === 1 && renderDrawerItem('Auction Register', 'Auction Register', 'create-outline')}
          {branchData.AuctionSaleRegister === 1 && renderDrawerItem('Auction Sale Register', 'Auction Sale Register', 'reader-outline')}
          {branchData.AuctionDispatch === 1 && renderDrawerItem('Auction Dispatch', 'Auction Dispatch', 'disc-outline')} 
          {branchData.OtherMaterialStock === 1 && renderDrawerItem('Other Material Stock', 'Other Material Stock', 'git-compare-outline')}
          {branchData.PalaReceiveRegister === 1 && renderDrawerItem('Pala Receive Register', 'Pala Receive Register', 'bag-check-outline')}
          {branchData.TIStock === 1 && renderDrawerItem('Trading Stock', 'Trading Stock', 'trending-up-outline')}
          {branchData.SIStock === 1 && renderDrawerItem('Storage Stock', 'Storage Stock', 'layers-outline')}
          {branchData.PrcStock === 1 && renderDrawerItem('Process Stock', 'Process Stock', 'repeat-outline')}
          {branchData.PalaStock === 1 && renderDrawerItem('Pala Stock', 'Pala Stock', 'document-text-outline')}
          {branchData.LedgerBook === 1 && renderDrawerItem('Ledger', 'Ledger', 'documents-outline')}
        </>
      )}
      {renderDrawerItem('Branch List', 'Branch List', 'git-branch-outline')}
      {renderDrawerItem('Logout', 'Logout', 'log-out-outline')}
    </DrawerContentScrollView>
  );  
};

// --- Drawer Navigator Component ---
// Renamed for clarity, receives UserID via route params from Stack Navigator
const AppDrawerNavigator = ({route}) => {
    const {UserID, type} = route.params;

    console.log('AppDrawerNavigator Params-->', route); // Keep for debugging if needed

      return (    
        <Drawer.Navigator
          // Use screenOptions for common drawer settings
          screenOptions={{
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: colors.white,
              headerTitleStyle: { fontFamily: fonts.SemiBold, fontSize: 20 },
              drawerLabelStyle: styles.drawerLabelStyle, // Apply common label style
              // Consider adding drawerActiveTintColor, drawerInactiveTintColor etc. here if consistent
          }}
          drawerContent={props => <CustomDrawerContent {...props}/>} // Use the custom component
         >       

                               
          <Drawer.Screen name={'Home'} component={HomeScreen} initialParams={{ UserID: UserID, type: 'Home'}}/>
          <Drawer.Screen name={'Auction DC Register'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'AuctionDCRegister' }} />
          <Drawer.Screen name={'Auction Register'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'AuctionRegister' }} />
          <Drawer.Screen name={'Auction Sale Register'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'AuctionSaleRegister' }} />
          <Drawer.Screen name={'Auction Dispatch'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'AuctionDispatch' }} />
          <Drawer.Screen name={'Other Material Stock'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'OtherMaterialStock' }} />
          <Drawer.Screen name={'Pala Receive Register'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'PalaReceiveRegister' }} />
                 
          <Drawer.Screen name={'Trading Stock'} component={ReportScreen} initialParams={{ UserID: UserID, type: 'TIStock' }} />
          <Drawer.Screen name={'Storage Stock'} component={ReportScreen} initialParams={{UserID: UserID, type: 'SIStock' }}/>
          <Drawer.Screen name={'Process Stock'} component={ReportScreen} initialParams={{UserID: UserID, type: 'PrcStock' }}/>
          <Drawer.Screen name={'Pala Stock'} component={ReportScreen} initialParams={{UserID: UserID, type: 'PalaStock' }}/>
          <Drawer.Screen name={'Ledger'} component={LedgerScreen} initialParams={{ UserID: UserID, type: 'Ledger' }}/>
          <Drawer.Screen name={'Branch List'} 
          component={BranchselectionScreen} 
          options={{
            headerLeft: () => null, // This hides the drawer menu (hamburger) icon
          }}          
          initialParams={{ UserID: UserID, type: 'leftMenu' }} />
          <Drawer.Screen name={'Logout'} component={Logout} initialParams={{ UserID: UserID, type: 'Logout' }}/>
     
        </Drawer.Navigator>
     );
  };


// --- Main App Component ---
const App = () => {
  return (
    // Removed screenOptions and style from NavigationContainer as they don't apply here
      <NavigationContainer>
        <Stack.Navigator
        screenOptions={{            
            headerShown: false,
            headerBackVisible: false,
            headerStyle:{ backgroundColor: colors.primary },
            headerTintColor: colors.white,
            headerTitleStyle: { fontFamily: fonts.SemiBold, fontSize: 20 },
        }}
         >
        
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          
          <Stack.Screen name='BranchselectionScreen'
            component={BranchselectionScreen} 
            options={{
              headerShown: true,
              headerTitle: 'Branch List',
              headerBackVisible: false,
              drawerLabelStyle: styles.drawerLabelStyle,
              headerLeft: () => null,
            }}
            />
          
          <Stack.Screen name='Main' component={AppDrawerNavigator} />
          
          <Stack.Screen name='Logout' component={Logout} />
          
        </Stack.Navigator>
      </NavigationContainer>    
  );
}

export default App

const styles = StyleSheet.create({
  container: { // This style wasn't used on a View, removed flex: 1
    // flex: 1, // Usually applied to the root View of a component, not NavigationContainer
  },
  drawerLabelStyle:{
    // fontSize: 50, // This seems very large for a drawer label, adjust if needed
    fontFamily: fonts.Regular, // Use a regular font weight unless Bold is intended
    marginLeft: -15, // Adjust spacing if icon pushes text too far
  },
  menuTitle:{ // Style for each DrawerItem
    // borderRadius:2, // Subtle, keep if desired
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    marginVertical: 0, // Reduce vertical space between items
    marginHorizontal: 5, // Add some horizontal margin
    paddingVertical: 0, // Add some vertical padding inside the item
  },
  logo:{
    width: 60,
    height: 60,
    borderRadius:10, // Keep if desired
    //resizeMode: 'contain', // Ensure logo fits well
  },
  menuTextContainer: { // Header section inside the drawer
    marginVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: colors.white, // Keep if different background is needed
    borderBottomWidth: 2, // Make header separator slightly thicker
    borderBottomColor: colors.primary, // Use primary color for emphasis
    padding: 10, // Increase padding
  },
  menuHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10, // Space between logo and text/button
  },
  menuHeadTitle:{
    fontSize: 18, // Slightly smaller
    fontFamily: fonts.Bold,
    textAlign: 'left',
    color: colors.drakgray,
    flex: 1, // Allow text to take remaining space
  },
})
