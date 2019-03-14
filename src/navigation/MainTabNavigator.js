import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon/TabBarIcon';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import StatsScreen from '../screens/StatsScreen/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
import IdentityScreen from '../screens/IdentityScreen/IdentityScreen';
import CriminalRecordScreen from '../screens/CriminalRecordScreen/CriminalRecordScreen';
import ForbiddenTravellerScreen from '../screens/ForbiddenTraveller/ForbiddenTraveller';
import Details from '../screens/DetailsScreen/DetailsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen/ChangePasswordScreen';
import AboutScreen from '../screens/AboutScreen/AboutScreen';


const HomeStack = createStackNavigator({
  home: HomeScreen,
  criminalRecord: CriminalRecordScreen,
  identity: IdentityScreen,
  forbiddenTraveller: ForbiddenTravellerScreen,
});

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={ Platform.OS === 'ios' ? 'ios-home' : 'md-home' }
    />
  ),
};

const StatsStack = createStackNavigator({
  stats: StatsScreen,
});

StatsStack.navigationOptions = {
  tabBarLabel: 'Stats',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'md-stats' : 'md-stats'}
    />
  ),
};

const IdentityStack = createStackNavigator({
  identity: IdentityScreen,
  details: Details
});

IdentityStack.navigationOptions = {
  tabBarLabel: 'Check',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-search' : 'md-search'}
    />
  ),
};

const ProfileStack = createStackNavigator({
  profile: ProfileScreen,
  about: AboutScreen,
  changePass: ChangePasswordScreen,
});

ProfileStack.navigationOptions = {
  tabBarLabel: 'Profile',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-person' : 'md-person'}
    />
  ),
};

export default createBottomTabNavigator({
  HomeStack,
  StatsStack,
  IdentityStack,
  ProfileStack
});