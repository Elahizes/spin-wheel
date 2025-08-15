// Firebase configuration (same as in index.html)
const firebaseConfig = {
    // Your Firebase config here
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// DOM Elements
const lastUpdatedEl = document.getElementById('lastUpdated');
let unsubscribeSpins = null;
let unsubscribeStats = null;

// Initialize the dashboard
function initDashboard() {
    updateLastUpdated();
    setupEventListeners();
    loadSpins();
    loadStats();
}

// Update last updated time
function updateLastUpdated() {
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = new Date().toLocaleString();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add any event listeners here
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadSpins();
            loadStats();
            updateLastUpdated();
        });
    }
}

// Load spins data
function loadSpins() {
    const db = firebase.firestore();
    const spinsList = document.getElementById('spinsList');
    
    // Clear existing content
    if (spinsList) {
        spinsList.innerHTML = '<tr><td colspan="3" class="text-center p-4">Loading spins...</td></tr>';
    }

    // Unsubscribe from previous listener if it exists
    if (unsubscribeSpins) {
        unsubscribeSpins();
    }

    // Get spins from Firestore
    unsubscribeSpins = db.collection('spins')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            const spins = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                spins.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate()
                });
            });
            updateSpinsList(spins);
        }, (error) => {
            console.error('Error loading spins:', error);
            if (spinsList) {
                spinsList.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-red-500">Error loading spins</td></tr>';
            }
        });
}

// Load statistics
function loadStats() {
    const db = firebase.firestore();
    
    // Unsubscribe from previous listener if it exists
    if (unsubscribeStats) {
        unsubscribeStats();
    }

    // Get stats from Firestore
    unsubscribeStats = db.collection('stats')
        .doc('prizeDistribution')
        .onSnapshot((doc) => {
            const data = doc.data() || {};
            updatePrizeStats(data);
        }, (error) => {
            console.error('Error loading stats:', error);
        });
}

// Update spins list in the UI
function updateSpinsList(spins) {
    const tbody = document.getElementById('spinsList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (spins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center p-4 text-gray-500">
                    No spins found
                </td>
            </tr>`;
        return;
    }
    
    spins.forEach(spin => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const time = spin.timestamp ? new Date(spin.timestamp) : new Date();
        const timeAgo = getTimeAgo(time);
        
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${spin.userId?.substring(0, 6)}...${spin.userId?.substring(spin.userId.length - 4) || 'N/A'}</div>
                        <div class="text-xs text-gray-500">${time.toLocaleDateString()}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${getPrizeColorClass(spin.prize)}">
                    ${spin.prize || 'N/A'}
                </span>
            </td>
            <td class="px-4 py-3 text-right text-sm text-gray-500" title="${time.toLocaleString()}">
                ${timeAgo}
            </td>`;
            
        tbody.appendChild(row);
    });
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + 'y ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + 'mo ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + 'd ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + 'h ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + 'm ago';
    
    return 'just now';
}

// Get color class for prize
function getPrizeColorClass(prize) {
    if (!prize) return 'bg-gray-100 text-gray-800';
    
    const colors = {
        'gold': 'bg-yellow-100 text-yellow-800',
        'silver': 'bg-gray-100 text-gray-800',
        'bronze': 'bg-amber-100 text-amber-800',
        'try again': 'bg-gray-100 text-gray-500',
        'free spin': 'bg-green-100 text-green-800',
        'special': 'bg-purple-100 text-purple-800',
        'discount': 'bg-blue-100 text-blue-800',
        'gift': 'bg-red-100 text-red-800'
    };
    
    const prizeLower = prize.toLowerCase();
    for (const [key, value] of Object.entries(colors)) {
        if (prizeLower.includes(key)) {
            return value;
        }
    }
    
    return 'bg-gray-100 text-gray-800';
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (unsubscribeSpins) unsubscribeSpins();
    if (unsubscribeStats) unsubscribeStats();
});
