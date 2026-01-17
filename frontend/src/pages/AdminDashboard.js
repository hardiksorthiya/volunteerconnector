import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { UsersIcon, ActivitiesIcon, CheckIcon, CalendarIcon, MapPinIcon, NetworkIcon, UserIcon } from '../components/Icons';
import PageHeader from '../components/PageHeader';
import '../css/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API calls
  const [stats] = useState({
    totalVolunteers: 1247,
    tasksCompleted: 342,
    ongoingActivities: 28,
    totalActivities: 156
  });

  const [volunteers] = useState([
    { id: 1, name: 'Sarah Johnson', status: 'active', avatar: 'SJ', role: 'Community Organizer' },
    { id: 2, name: 'Michael Chen', status: 'available', avatar: 'MC', role: 'Event Coordinator' },
    { id: 3, name: 'Emily Davis', status: 'assigned', avatar: 'ED', role: 'Volunteer Lead' },
    { id: 4, name: 'David Wilson', status: 'active', avatar: 'DW', role: 'Field Worker' },
    { id: 5, name: 'Lisa Anderson', status: 'available', avatar: 'LA', role: 'Support Staff' },
    { id: 6, name: 'James Brown', status: 'assigned', avatar: 'JB', role: 'Project Manager' },
  ]);

  const [activities] = useState([
    { id: 1, title: 'Community Cleanup', progress: 75, date: '2024-01-15', status: 'ongoing' },
    { id: 2, title: 'Food Drive Campaign', progress: 100, date: '2024-01-10', status: 'completed' },
    { id: 3, title: 'Education Workshop', progress: 45, date: '2024-01-20', status: 'ongoing' },
    { id: 4, title: 'Health Check-up Drive', progress: 30, date: '2024-01-25', status: 'ongoing' },
  ]);

  const [tasks] = useState([
    { id: 1, title: 'Coordinate volunteer schedules', completed: true },
    { id: 2, title: 'Prepare event materials', completed: true },
    { id: 3, title: 'Contact local partners', completed: false },
    { id: 4, title: 'Finalize venue booking', completed: false },
    { id: 5, title: 'Send reminder notifications', completed: false },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const isAdmin = user.role === 0 || user.user_type === 'admin';
        if (!isAdmin) {
          // Redirect non-admin users to dashboard
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/dashboard');
        return;
      }
    }

    fetchUser();
  }, [navigate]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        // If response doesn't have success: true, still use the data if available
        if (response.data.data) {
          setUser(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Only redirect to login on authentication errors (401, 403)
      // Don't redirect on network errors or other errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        // For other errors, try to use stored user data or show error
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        // Set loading to false so UI can render
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <PageHeader 
        title={`Welcome back, ${user?.name || 'User'}! 👋`}
        subtitle="Here's your dashboard overview"
      />

      {/* Stats Widgets */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <UsersIcon className="stat-icon-svg" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalVolunteers.toLocaleString()}</h3>
            <p>Total Volunteers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckIcon className="stat-icon-svg" />
          </div>
          <div className="stat-content">
            <h3>{stats.tasksCompleted}</h3>
            <p>Tasks Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ActivitiesIcon className="stat-icon-svg" />
          </div>
          <div className="stat-content">
            <h3>{stats.ongoingActivities}</h3>
            <p>Ongoing Activities</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ActivitiesIcon className="stat-icon-svg" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalActivities}</h3>
            <p>Total Activities</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        {/* Volunteer Cards Section */}
        <div className="dashboard-section volunteer-cards-section">
          <div className="section-header">
            <h2>Volunteers</h2>
            <span className="section-count">{volunteers.length}</span>
          </div>
          <div className="volunteer-cards-grid">
            {volunteers.map((volunteer) => (
              <div key={volunteer.id} className="volunteer-card">
                <div className="volunteer-avatar">
                  <span>{volunteer.avatar}</span>
                  <div className={`status-dot status-${volunteer.status}`}></div>
                </div>
                <div className="volunteer-info">
                  <h4>{volunteer.name}</h4>
                  <p>{volunteer.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity/Task Panel */}
        <div className="dashboard-section activity-panel">
          <div className="section-header">
            <h2>Activities & Tasks</h2>
            <CalendarIcon className="section-icon" />
          </div>

          {/* Activities List */}
          <div className="activities-list">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-card">
                <div className="activity-header">
                  <h4>{activity.title}</h4>
                  <span className={`activity-status status-${activity.status}`}>
                    {activity.status}
                  </span>
                </div>
                <div className="activity-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${activity.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{activity.progress}%</span>
                </div>
                <div className="activity-date">
                  <CalendarIcon className="date-icon" />
                  <span>{new Date(activity.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tasks Checklist */}
          <div className="tasks-checklist">
            <h3>Today's Tasks</h3>
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                  {task.completed && <CheckIcon className="check-icon" />}
                </div>
                <span className={task.completed ? 'task-completed' : ''}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location/Reach Section */}
        <div className="dashboard-section location-section">
          <div className="section-header">
            <h2>Location & Reach</h2>
            <MapPinIcon className="section-icon" />
          </div>
          <div className="map-container">
            <div className="map-placeholder">
              <MapPinIcon className="map-pin-large" />
              <p>Community Map</p>
              <div className="map-pins">
                <div className="map-pin pin-1"></div>
                <div className="map-pin pin-2"></div>
                <div className="map-pin pin-3"></div>
                <div className="map-pin pin-4"></div>
                <div className="map-pin pin-5"></div>
              </div>
            </div>
            <div className="community-clusters">
              <h4>Community Clusters</h4>
              <div className="cluster-list">
                <div className="cluster-item">
                  <div className="cluster-dot"></div>
                  <span>Downtown District</span>
                  <span className="cluster-count">342</span>
                </div>
                <div className="cluster-item">
                  <div className="cluster-dot"></div>
                  <span>Northside Community</span>
                  <span className="cluster-count">218</span>
                </div>
                <div className="cluster-item">
                  <div className="cluster-dot"></div>
                  <span>East End Hub</span>
                  <span className="cluster-count">156</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Flow */}
        <div className="dashboard-section connection-section">
          <div className="section-header">
            <h2>Connection Flow</h2>
            <NetworkIcon className="section-icon" />
          </div>
          <div className="network-visualization">
            <div className="network-nodes">
              <div className="network-node node-people">
                <UsersIcon className="node-icon" />
                <span>People</span>
              </div>
              <div className="network-lines">
                <div className="network-line line-1"></div>
                <div className="network-line line-2"></div>
                <div className="network-line line-3"></div>
              </div>
              <div className="network-node node-tasks">
                <ActivitiesIcon className="node-icon" />
                <span>Tasks</span>
              </div>
            </div>
            <div className="connection-stats">
              <div className="connection-stat">
                <span className="connection-number">1,247</span>
                <span className="connection-label">Active Connections</span>
              </div>
              <div className="connection-stat">
                <span className="connection-number">342</span>
                <span className="connection-label">Task Assignments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
