import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { THEME } from '../theme';
import { useLang } from '../i18n/LangContext';

import DashboardScreen from '../screens/tabs/DashboardScreen';
import RecipesScreen from '../screens/tabs/RecipesScreen';
import PlanScreen from '../screens/tabs/PlanScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator({ user, uid, onProfileUpdate }) {
  const t = useLang();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.card,
          borderTopColor: THEME.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: THEME.accent,
        tabBarInactiveTintColor: THEME.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            Recipes:   focused ? 'restaurant' : 'restaurant-outline',
            Plan:      focused ? 'calendar' : 'calendar-outline',
            Profile:   focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: t.tabDashboard }}>
        {() => <DashboardScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Recipes" options={{ tabBarLabel: t.tabRecipes }}>
        {() => <RecipesScreen uid={uid} />}
      </Tab.Screen>
      <Tab.Screen name="Plan" options={{ tabBarLabel: t.tabPlan }} component={PlanScreen} />
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profilo' }}>
        {() => <ProfileScreen user={user} uid={uid} onUpdate={onProfileUpdate} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
