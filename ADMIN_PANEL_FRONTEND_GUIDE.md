# 🎯 **Admin Panel Frontend Integration Guide**

## 🏗️ **Admin Panel Architecture Overview**

```
Admin Login → Dashboard → Chat List → Chat Interface
     ↓            ↓           ↓           ↓
  Auth Token → Live Stats → Select Chat → Send Messages
```

---

## 🔐 **1. Admin Authentication System**

### **Admin Login API**
- **Endpoint:** `POST /admin/login`
- **Purpose:** Authenticate admin and get access token
- **Token Duration:** 8 hours (longer than user tokens)

### **Frontend Login Implementation**

#### **Login Form Component**
```javascript
// AdminLogin.jsx
import React, { useState } from 'react';

function AdminLogin({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3003/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { accessToken, admin } = await response.json();
      
      // Store admin token and info
      localStorage.setItem('adminToken', accessToken);
      localStorage.setItem('adminInfo', JSON.stringify(admin));
      
      onLoginSuccess(admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h2>Admin Panel Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Admin Email"
          value={credentials.email}
          onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}

export default AdminLogin;
```

#### **Admin Authentication Hook**
```javascript
// useAdminAuth.js
import { useState, useEffect } from 'react';

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminInfo');
    
    if (token && adminInfo) {
      setAdmin(JSON.parse(adminInfo));
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        await fetch('http://localhost:3003/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  };

  return { admin, loading, logout, setAdmin };
}
```

---

## 📊 **2. Admin Dashboard with Live Stats**

### **Dashboard Stats API**
- **Endpoint:** `GET /admin/stats`
- **Purpose:** Get real-time dashboard statistics
- **Updates:** Poll every 30 seconds for live data

### **Dashboard Component**
```javascript
// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3003/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Chats</h3>
          <div className="stat-number">{stats?.totalActiveSessions || 0}</div>
        </div>
        
        <div className="stat-card urgent">
          <h3>Waiting for Response</h3>
          <div className="stat-number">{stats?.sessionsWaitingForResponse || 0}</div>
        </div>
        
        <div className="stat-card warning">
          <h3>High Priority</h3>
          <div className="stat-number">{stats?.highPrioritySessions || 0}</div>
        </div>
        
        <div className="stat-card success">
          <h3>Online Admins</h3>
          <div className="stat-number">{stats?.onlineAdmins || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <div className="stat-number">{stats?.averageResponseTime || 0}s</div>
        </div>
        
        <div className="stat-card">
          <h3>Messages Today</h3>
          <div className="stat-number">{stats?.messagesHandledToday || 0}</div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
```

---

## 💬 **3. Live Chat List Interface**

### **Active Chats API**
- **Endpoint:** `GET /admin/chats/active`
- **Purpose:** Get all active chat sessions with priority levels
- **Updates:** Poll every 10 seconds for real-time updates

### **Chat List Component**
```javascript
// ActiveChatsList.jsx
import React, { useState, useEffect } from 'react';

function ActiveChatsList({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const fetchActiveChats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3003/admin/chats/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveChats();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      default: return '#00aa00';
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChatId(chat.id);
    onSelectChat(chat);
  };

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="active-chats-list">
      <h3>Active Chats ({chats.length})</h3>
      
      <div className="chat-list">
        {chats.map(chat => (
          <div 
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => handleSelectChat(chat)}
            style={{ borderLeft: `4px solid ${getPriorityColor(chat.priority)}` }}
          >
            <div className="chat-header">
              <span className="user-name">{chat.userName}</span>
              <span className="girlfriend-name">💕 {chat.girlfriendName}</span>
              <span className={`priority priority-${chat.priority}`}>
                {chat.priority.toUpperCase()}
              </span>
            </div>
            
            <div className="chat-details">
              <span className="message-count">{chat.totalMessages} messages</span>
              <span className="last-activity">{chat.timeSinceLastMessage}</span>
              {chat.isAdminActive && (
                <span className="admin-active">👤 {chat.assignedAdminName}</span>
              )}
            </div>
            
            <div className="chat-meta">
              <span className="user-email">{chat.userEmail}</span>
              <span className="minutes-used">{chat.minutesUsed}min used</span>
            </div>
          </div>
        ))}
      </div>
      
      {chats.length === 0 && (
        <div className="no-chats">No active chats at the moment</div>
      )}
    </div>
  );
}

export default ActiveChatsList;
```

---

## 🎯 **4. Chat Interface for Admins**

### **Chat Management APIs**
- **Assign Chat:** `PUT /admin/chats/assign`
- **Send Message:** `POST /admin/chats/message`
- **Release Chat:** `DELETE /admin/chats/:sessionId/release`
- **Get Chat History:** `GET /chat/sessions/:sessionId/history` (reuse user endpoint)

### **Admin Chat Interface**
```javascript
// AdminChatInterface.jsx
import React, { useState, useEffect } from 'react';

function AdminChatInterface({ selectedChat, onChatReleased }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendAs, setSendAs] = useState('girlfriend'); // 'girlfriend' or 'admin'
  const [isAssigned, setIsAssigned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch chat history when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchChatHistory();
      setIsAssigned(selectedChat.isAdminActive);
    }
  }, [selectedChat]);

  const fetchChatHistory = async () => {
    if (!selectedChat) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `http://localhost:3003/chat/sessions/${selectedChat.id}/history?limit=100`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const assignChat = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3003/admin/chats/assign', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: selectedChat.id })
      });
      
      if (response.ok) {
        setIsAssigned(true);
        alert('Chat assigned successfully!');
      }
    } catch (err) {
      console.error('Error assigning chat:', err);
      alert('Failed to assign chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAssigned) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3003/admin/chats/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: selectedChat.id,
          content: newMessage,
          sendAs: sendAs
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        // Refresh chat history to show new message
        setTimeout(fetchChatHistory, 500);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const releaseChat = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `http://localhost:3003/admin/chats/${selectedChat.id}/release`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        setIsAssigned(false);
        onChatReleased();
        alert('Chat released successfully!');
      }
    } catch (err) {
      console.error('Error releasing chat:', err);
      alert('Failed to release chat');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChat) {
    return (
      <div className="no-chat-selected">
        <h3>Select a chat to start responding</h3>
        <p>Choose a chat from the list to view messages and respond as the girlfriend.</p>
      </div>
    );
  }

  return (
    <div className="admin-chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-info">
          <h3>{selectedChat.userName} ↔ {selectedChat.girlfriendName}</h3>
          <span className="chat-meta">
            {selectedChat.totalMessages} messages • {selectedChat.minutesUsed} minutes used
          </span>
        </div>
        
        <div className="chat-actions">
          {!isAssigned ? (
            <button onClick={assignChat} disabled={loading} className="assign-btn">
              Take This Chat
            </button>
          ) : (
            <button onClick={releaseChat} disabled={loading} className="release-btn">
              Release Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.senderType}`}
          >
            <div className="message-header">
              <span className="sender">
                {message.senderType === 'user' ? selectedChat.userName : 
                 message.senderType === 'girlfriend' ? selectedChat.girlfriendName : 
                 'Admin Support'}
              </span>
              <span className="timestamp">
                {new Date(message.sentAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      {isAssigned && (
        <form onSubmit={sendMessage} className="message-form">
          <div className="send-as-selector">
            <label>
              <input
                type="radio"
                value="girlfriend"
                checked={sendAs === 'girlfriend'}
                onChange={(e) => setSendAs(e.target.value)}
              />
              Send as {selectedChat.girlfriendName}
            </label>
            <label>
              <input
                type="radio"
                value="admin"
                checked={sendAs === 'admin'}
                onChange={(e) => setSendAs(e.target.value)}
              />
              Send as Admin Support
            </label>
          </div>
          
          <div className="message-input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Type your message as ${sendAs === 'girlfriend' ? selectedChat.girlfriendName : 'Admin Support'}...`}
              rows="3"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !newMessage.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}
      
      {!isAssigned && (
        <div className="not-assigned-message">
          <p>You need to take this chat before you can respond.</p>
        </div>
      )}
    </div>
  );
}

export default AdminChatInterface;
```

---

## 🎨 **5. Complete Admin Panel App**

### **Main Admin Panel Component**
```javascript
// AdminPanel.jsx
import React, { useState } from 'react';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ActiveChatsList from './components/ActiveChatsList';
import AdminChatInterface from './components/AdminChatInterface';
import './AdminPanel.css';

function AdminPanel() {
  const { admin, loading, logout, setAdmin } = useAdminAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  if (!admin) {
    return <AdminLogin onLoginSuccess={setAdmin} />;
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-info">
          <h1>NewGirl Admin Panel</h1>
          <span className="admin-name">Welcome, {admin.name}</span>
          <span className="admin-role">({admin.role})</span>
        </div>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'chats' ? 'active' : ''}
          onClick={() => setActiveTab('chats')}
        >
          💬 Active Chats
        </button>
      </nav>

      {/* Content */}
      <main className="admin-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        
        {activeTab === 'chats' && (
          <div className="chats-layout">
            <div className="chats-sidebar">
              <ActiveChatsList onSelectChat={setSelectedChat} />
            </div>
            <div className="chat-main">
              <AdminChatInterface 
                selectedChat={selectedChat}
                onChatReleased={() => setSelectedChat(null)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
```

---

## 🎨 **6. CSS Styling Guide**

### **Admin Panel Styles**
```css
/* AdminPanel.css */
.admin-panel {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.admin-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-info h1 {
  margin: 0;
  font-size: 1.5rem;
}

.admin-name {
  margin-left: 1rem;
  font-weight: 500;
}

.admin-role {
  color: #bdc3c7;
  font-size: 0.9rem;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Navigation */
.admin-nav {
  background: white;
  padding: 0 2rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 1rem;
}

.admin-nav button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-weight: 500;
}

.admin-nav button.active {
  border-bottom-color: #3498db;
  color: #3498db;
}

/* Dashboard Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-card.urgent .stat-number { color: #e74c3c; }
.stat-card.warning .stat-number { color: #f39c12; }
.stat-card.success .stat-number { color: #27ae60; }

/* Chat Layout */
.chats-layout {
  display: flex;
  height: calc(100vh - 140px);
}

.chats-sidebar {
  width: 400px;
  background: white;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.chat-main {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
}

/* Chat List */
.active-chats-list {
  padding: 1rem;
}

.chat-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-item:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chat-item.selected {
  background: #e3f2fd;
  border-color: #2196f3;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.user-name {
  font-weight: bold;
  color: #2c3e50;
}

.girlfriend-name {
  color: #e91e63;
  font-weight: 500;
}

.priority {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.priority-urgent { background: #ffebee; color: #c62828; }
.priority-high { background: #fff3e0; color: #ef6c00; }
.priority-medium { background: #fffde7; color: #f57f17; }
.priority-low { background: #e8f5e8; color: #2e7d32; }

/* Chat Interface */
.admin-chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 70%;
}

.message.user {
  background: #e3f2fd;
  margin-left: auto;
}

.message.girlfriend {
  background: #fce4ec;
}

.message.admin {
  background: #fff3e0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.message-form {
  padding: 1rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.send-as-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.message-input-container {
  display: flex;
  gap: 0.5rem;
}

.message-input-container textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  resize: vertical;
}

.message-input-container button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .chats-layout {
    flex-direction: column;
  }
  
  .chats-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 🚀 **7. Complete Integration Checklist**

### **✅ Setup Steps**
1. **Install Dependencies**
   ```bash
   npm install react react-dom
   # or
   yarn add react react-dom
   ```

2. **Create Admin Panel Structure**
   ```
   src/
   ├── components/
   │   ├── AdminLogin.jsx
   │   ├── AdminDashboard.jsx
   │   ├── ActiveChatsList.jsx
   │   └── AdminChatInterface.jsx
   ├── hooks/
   │   └── useAdminAuth.js
   ├── AdminPanel.jsx
   └── AdminPanel.css
   ```

3. **Environment Configuration**
   ```javascript
   // config.js
   export const API_BASE_URL = 'http://localhost:3003';
   ```

### **✅ Key Features Implemented**
- ✅ **Admin Authentication** with 8-hour sessions
- ✅ **Live Dashboard** with real-time stats
- ✅ **Active Chat List** with priority levels
- ✅ **Chat Assignment** system
- ✅ **Message Interface** (send as girlfriend or admin)
- ✅ **Chat Release** functionality
- ✅ **Real-time Updates** via polling
- ✅ **Responsive Design** for mobile/desktop

### **✅ Admin Accounts Ready**
| **Email** | **Password** | **Role** |
|-----------|--------------|----------|
| admin@newgirl.com | admin123! | Super Admin |
| chat1@newgirl.com | chat123! | Chat Admin |
| chat2@newgirl.com | chat123! | Chat Admin |
| support@newgirl.com | support123! | Support Admin |

---

## 🎯 **8. Usage Flow**

### **Admin Workflow:**
1. **Login** → Use admin credentials
2. **Dashboard** → View live statistics
3. **Active Chats** → See all ongoing conversations
4. **Select Chat** → Click on a chat to view details
5. **Take Chat** → Assign chat to yourself
6. **Respond** → Send messages as the girlfriend
7. **Release** → When done, release for other admins

### **Priority System:**
- 🔴 **Urgent** (30+ min wait) - Immediate attention needed
- 🟠 **High** (15-30 min wait) - High priority
- 🟡 **Medium** (5-15 min wait) - Normal priority  
- 🟢 **Low** (<5 min wait) - Recent activity

This complete guide gives your frontend team everything needed to build a fully functional admin panel! 🎯✨
