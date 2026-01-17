import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import Header from '../components/Header';
import api from '../config/api';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  console.log('🔄 DashboardScreen - NEW VERSION LOADED');
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my', or 'history'
  const [userActivities, setUserActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [stats, setStats] = useState({
    myActivities: 0,
    completedActivities: 0,
    totalHours: 0,
    totalTasks: 0
  });
  const [userTasks, setUserTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [taskHoursData, setTaskHoursData] = useState([]);
  const [loadingTaskHours, setLoadingTaskHours] = useState(false);
  const [dateFilter, setDateFilter] = useState('last_week'); // 'last_week', 'last_month', 'last_year'
  const [taskHoursDateRange, setTaskHoursDateRange] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          // Handle not authenticated
          setLoading(false);
          return;
        }
        await fetchUser();
        await fetchUserActivities();
        await fetchUserTasks();
        await fetchTaskHoursByActivity();
      } catch (error) {
        console.error('Error in useEffect:', error);
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, []);

  // Refetch task hours when date filter changes
  useEffect(() => {
    const refetchTaskHours = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await fetchTaskHoursByActivity();
        }
      } catch (error) {
        console.error('Error refetching task hours:', error);
      }
    };
    refetchTaskHours();
  }, [dateFilter]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            console.log('🔄 Refreshing dashboard data on focus');
            await fetchUserActivities();
            await fetchUserTasks();
            await fetchTaskHoursByActivity();
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
      refreshData();
    }, [user])
  );

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, skipping fetchUser');
        setLoading(false);
        return;
      }
      const response = await api.get('/users/me');
      if (response.data.success) {
        setUser(response.data.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - token expired or invalid');
        // Token will be cleared by interceptor, navigation will be handled by App.js
        setLoading(false);
        return;
      }
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, skipping fetchUserActivities');
        return;
      }

      // Get user first if not available
      let currentUser = user;
      if (!currentUser) {
        try {
          const userResponse = await api.get('/users/me');
          if (userResponse.data.success) {
            currentUser = userResponse.data.data;
            setUser(currentUser);
          }
        } catch (err) {
          if (err.response?.status === 401) {
            console.log('🔒 Unauthorized - token expired or invalid');
            return;
          }
          console.error('Error fetching user:', err);
        }
      }
      
      // Fetch all statistics from APIs in parallel
      const [activitiesResponse, totalHoursResponse, completedResponse, myActivitiesResponse, totalTasksResponse] = await Promise.all([
        api.get('/activities'),
        api.get('/activities/stats/total-hours'),
        api.get('/activities/stats/completed'),
        api.get('/activities/stats/my-activities'),
        api.get('/activities/stats/total-tasks')
      ]);

      if (activitiesResponse.data.success) {
        const activities = activitiesResponse.data.data || [];
        setUserActivities(activities);

        // Filter activities: created by current user OR joined by current user OR has tasks assigned
        const currentUserId = currentUser?.id;
        const myActivitiesList = currentUserId
          ? activities.filter(a => {
            // Check if created by user
            if (a.created_by === currentUserId) return true;
            // Check if joined (handle both boolean true and numeric 1 from MySQL)
            if (a.is_joined === true || a.is_joined === 1 || a.is_joined === '1') return true;
            // Check if user has tasks in this activity (handle both boolean true and numeric 1 from MySQL)
            if (a.has_tasks === true || a.has_tasks === 1 || a.has_tasks === '1') return true;
            // Also include activities where user has created tasks (has task_hours > 0)
            if (a.task_hours && parseFloat(a.task_hours) > 0) return true;
            return false;
          })
          : [];
        setMyActivities(myActivitiesList);

        // Get statistics from API responses
        const myAllCount = myActivitiesResponse.data?.success ? myActivitiesResponse.data.data.my_activities : myActivitiesList.length;
        const myCompletedCount = completedResponse.data?.success ? completedResponse.data.data.completed_activities : 0;
        const totalHours = totalHoursResponse.data?.success ? totalHoursResponse.data.data.total_hours : 0;
        const totalTasks = totalTasksResponse.data?.success ? totalTasksResponse.data.data.total_tasks : 0;

        setStats({
          myActivities: myAllCount,
          completedActivities: myCompletedCount,
          totalHours: totalHours,
          totalTasks: totalTasks
        });

        // Calculate category-wise distribution
        const categoryCounts = {};
        activities.forEach(activity => {
          const category = activity.category || 'Uncategorized';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categoryDataArray = Object.entries(categoryCounts).map(([name, value]) => ({
          name,
          value
        }));

        setCategoryData(categoryDataArray);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - token expired or invalid');
        return;
      }
      console.error('Error fetching activities:', error);
    }
  };

  const fetchUserTasks = async () => {
    setLoadingTasks(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, skipping fetchUserTasks');
        setUserTasks([]);
        setLoadingTasks(false);
        return;
      }

      const response = await api.get('/activities/tasks/my-tasks');
      console.log('📋 User tasks response:', response.data);
      
      if (response.data.success) {
        setUserTasks(response.data.data || []);
      } else {
        console.warn('⚠️ API returned success: false', response.data);
        setUserTasks([]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - token expired or invalid');
        setUserTasks([]);
        setLoadingTasks(false);
        return;
      }
      console.error('❌ Error fetching user tasks:', error);
      console.error('❌ Error details:', error.response?.data);
      setUserTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchTaskHoursByActivity = async () => {
    setLoadingTaskHours(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, skipping fetchTaskHoursByActivity');
        setTaskHoursData([]);
        setTaskHoursDateRange(null);
        setLoadingTaskHours(false);
        return;
      }

      const url = `/activities/stats/task-hours-by-activity?period=${dateFilter}`;
      console.log('🔍 Fetching task hours with URL:', url);
      const response = await api.get(url);
      console.log('📊 Task hours response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data.task_hours_by_activity || [];
        const dateRange = response.data.data.date_range;
        console.log('📊 Task hours data:', data);
        console.log('📅 Date range:', dateRange);
        setTaskHoursData(data);
        setTaskHoursDateRange(dateRange);
      } else {
        console.warn('⚠️ API returned success: false', response.data);
        setTaskHoursData([]);
        setTaskHoursDateRange(null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - token expired or invalid');
        setTaskHoursData([]);
        setTaskHoursDateRange(null);
        setLoadingTaskHours(false);
        return;
      }
      console.error('❌ Error fetching task hours by activity:', error);
      console.error('❌ Error details:', error.response?.data);
      setTaskHoursData([]);
      setTaskHoursDateRange(null);
    } finally {
      setLoadingTaskHours(false);
    }
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Pull to refresh - fetching all data');
      // Fetch all data in parallel
      await Promise.all([
        fetchUser(),
        fetchUserActivities(),
        fetchUserTasks(),
        fetchTaskHoursByActivity(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const startFormatted = formatDate(startDate);
    const endFormatted = end ? formatDate(endDate) : null;

    if (endFormatted && startFormatted !== endFormatted) {
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted;
  };

  const handleViewActivity = (activityId) => {
    navigation.navigate('ActivityDetail', { activityId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'ongoing':
      case 'active':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const renderActivityItem = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => handleViewActivity(item.id)}
      >
        <View style={styles.activityItemContent}>
          <View style={styles.activityItemHeader}>
            <Text style={styles.activityItemTitle} numberOfLines={1}>
              {item.title || 'Activity'}
            </Text>
            <View style={[styles.activityItemStatus, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.activityItemStatusText, { color: statusColors.text }]}>
                {item.status || 'pending'}
              </Text>
            </View>
          </View>
          <View style={styles.activityItemDetails}>
            <Text style={styles.activityItemDate}>
              📅 {formatDateRange(item.start_date, item.end_date)}
            </Text>
            <Text style={styles.activityItemLocation} numberOfLines={1}>
              📍 {item.location || item.address || 'N/A'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTaskItem = ({ item }) => {
    return (
      <View style={styles.taskItem}>
        <View style={styles.taskItemContent}>
          <Text style={styles.taskItemTitle}>{item.title || 'Task'}</Text>
          <Text style={styles.taskItemActivity}>{item.activity_title || 'N/A'}</Text>
          <View style={styles.taskItemDetails}>
            <Text style={styles.taskItemDate}>
              📅 {item.due_date 
                ? formatDateRange(item.start_date, item.due_date)
                : item.start_date 
                ? formatDate(item.start_date)
                : 'N/A'}
            </Text>
            <Text style={styles.taskItemHours}>
              ⏱️ {item.total_hours ? `${item.total_hours} hrs` : 'N/A'}
            </Text>
            <View style={[styles.taskItemStatusBadge, { backgroundColor: getStatusColor(item.status || 'pending').bg }]}>
              <Text style={[styles.taskItemStatusText, { color: getStatusColor(item.status || 'pending').text }]}>
                {item.status ? item.status.replace('-', ' ') : 'pending'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const getDisplayActivities = () => {
    if (activeTab === 'all') return userActivities;
    if (activeTab === 'my') return myActivities;
    return [];
  };

  return (
    <View style={styles.container}>
      <Header onNotificationPress={handleNotificationPress} />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
            title="Pull to refresh"
            titleColor="#6b7280"
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.name || 'User'}! 👋
          </Text>
          <Text style={styles.headerSubtext}>Here's your dashboard overview</Text>
          <Text style={styles.versionIndicator}>Dashboard v2.0</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statAll]}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>📋</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.myActivities}</Text>
              <Text style={styles.statLabel}>My Activity</Text>
              <Text style={styles.statPercentage}>
                {stats.myActivities > 0 ? '100%' : '0%'}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCompleted]}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>✓</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.completedActivities}</Text>
              <Text style={styles.statLabel}>Completed Activity</Text>
              <Text style={styles.statPercentage}>
                {stats.myActivities > 0 ? ((stats.completedActivities / stats.myActivities) * 100).toFixed(1) : 0}%
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statHours]}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>⏱️</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.totalHours}</Text>
              <Text style={styles.statLabel}>Total Hour</Text>
              <Text style={styles.statPercentage}>
                {stats.completedActivities > 0 ? (stats.totalHours / stats.completedActivities).toFixed(1) : 0} hrs/activity
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statTasks]}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>📊</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Task</Text>
              <Text style={styles.statPercentage}>
                {stats.myActivities > 0 ? (stats.totalTasks / stats.myActivities).toFixed(1) : 0} tasks/activity
              </Text>
            </View>
          </View>
        </View>

        {/* Work History Section */}
        <View style={styles.section}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All Activities ({userActivities.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'my' && styles.tabActive]}
              onPress={() => setActiveTab('my')}
            >
              <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
                My Activities ({myActivities.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                Work History
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'all' ? (
              <View>
                {userActivities.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No activities found</Text>
                  </View>
                ) : (
                  <FlatList
                    data={userActivities}
                    renderItem={renderActivityItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </View>
            ) : activeTab === 'my' ? (
              <View>
                {myActivities.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>You haven't created or joined any activities yet</Text>
                  </View>
                ) : (
                  <FlatList
                    data={myActivities}
                    renderItem={renderActivityItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </View>
            ) : (
              <View>
                {loadingTasks ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#2563eb" />
                    <Text style={styles.emptyStateText}>Loading tasks...</Text>
                  </View>
                ) : userTasks.length > 0 ? (
                  <FlatList
                    data={userTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No tasks found</Text>
                    <Text style={styles.emptyStateSubtext}>You haven't created or been assigned any tasks yet</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Category Pie Chart */}
        {categoryData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activity Categories</Text>
            </View>
            <View style={styles.chartContainer}>
              <PieChart
                data={categoryData.map((category, index) => {
                  const COLORS = ['#2563eb', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'];
                  const percentage = ((category.value / userActivities.length) * 100).toFixed(0);
                  return {
                    name: category.name,
                    population: category.value,
                    color: COLORS[index % COLORS.length],
                    legendFontColor: '#7F7F7F',
                    legendFontSize: 12,
                  };
                })}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Task Hours Bar Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Hours by Activity</Text>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'last_week' && styles.filterButtonActive]}
                onPress={() => setDateFilter('last_week')}
              >
                <Text style={[styles.filterButtonText, dateFilter === 'last_week' && styles.filterButtonTextActive]}>
                  7D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'last_month' && styles.filterButtonActive]}
                onPress={() => setDateFilter('last_month')}
              >
                <Text style={[styles.filterButtonText, dateFilter === 'last_month' && styles.filterButtonTextActive]}>
                  1M
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'last_year' && styles.filterButtonActive]}
                onPress={() => setDateFilter('last_year')}
              >
                <Text style={[styles.filterButtonText, dateFilter === 'last_year' && styles.filterButtonTextActive]}>
                  1Y
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {taskHoursDateRange && (
            <Text style={styles.dateRangeText}>
              {taskHoursDateRange.start_date} to {taskHoursDateRange.end_date}
            </Text>
          )}

          {loadingTaskHours ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.chartLoadingText}>Loading task hours data...</Text>
            </View>
          ) : taskHoursData.length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: taskHoursData.map(item => {
                    const title = item.activity_title || 'Activity';
                    return title.length > 10 ? title.substring(0, 10) + '...' : title;
                  }),
                  datasets: [{
                    data: taskHoursData.map(item => parseFloat(item.total_hours) || 0)
                  }]
                }}
                width={screenWidth - 64}
                height={280}
                yAxisLabel=""
                yAxisSuffix="h"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  barPercentage: 0.7,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No task hours data found for the selected period</Text>
              <Text style={styles.emptyStateSubtext}>Make sure you have tasks with hours added in the selected date range</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#6b7280',
  },
  versionIndicator: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statAll: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  statCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statHours: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  statTasks: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statPercentage: {
    fontSize: 10,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
  activityItem: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  activityItemContent: {
    padding: 12,
  },
  activityItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  activityItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityItemStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityItemLocation: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  taskItem: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  taskItemContent: {
    padding: 12,
  },
  taskItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskItemActivity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  taskItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskItemHours: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskItemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskItemStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 8,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  chartLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLoadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;
