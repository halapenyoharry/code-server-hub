// WebSocket connection
const socket = io();

// State
let services = new Map();
let preparedInstances = [];
let systemInfo = {};

// Connect to WebSocket
socket.on('connect', () => {
    showToast('Connected to hub server');
});

socket.on('services-update', (data) => {
    updateServices(data);
    updateInstances(data.preparedInstances);
    updateStats(data);
});

socket.on('instances-update', (data) => {
    updateInstances(data.instances);
});

// Update services display
function updateServices(data) {
    const grid = document.getElementById('services-grid');
    grid.innerHTML = '';
    
    // Combine services and sort
    const allServices = [...data.services];
    allServices.sort((a, b) => {
        if (a.type === 'code-server' && b.type !== 'code-server') return -1;
        if (a.type !== 'code-server' && b.type === 'code-server') return 1;
        return a.port - b.port;
    });
    
    allServices.forEach(service => {
        const card = createServiceCard(service);
        grid.appendChild(card);
    });
}

// Create service card
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    card.innerHTML = `
        <div class="service-header">
            <div>
                <span class="service-icon">${service.metadata.icon}</span>
                <span class="service-name">Port ${service.port}</span>
            </div>
            <div class="service-status">
                <div class="status-dot"></div>
                <span>Running</span>
            </div>
        </div>
        
        <div class="service-type">${service.type}</div>
        <div class="service-details">
            Process: ${service.command} (PID: ${service.pid})
        </div>
        
        <div class="service-actions">
            <button class="btn btn-small btn-primary" onclick="openServiceUrl('${service.url}')">Open</button>
            <button class="btn btn-small" onclick="viewDetails('${service.id}')">Details</button>
            <button class="btn btn-small btn-danger" onclick="stopService('${service.id}')">Stop</button>
        </div>
    `;
    
    return card;
}

// Update prepared instances - clean list format
function updateInstances(instances) {
    if (!instances) return;
    
    preparedInstances = instances;
    const list = document.getElementById('instances-list');
    list.innerHTML = '';
    
    instances.forEach(instance => {
        const row = createInstanceRow(instance);
        list.appendChild(row);
    });
}

// Create instance row - table-like but visual
function createInstanceRow(instance) {
    const row = document.createElement('div');
    row.className = `instance-row ${instance.status}`;
    
    const statusDot = instance.status === 'running' ? 
        '<div class="status-dot"></div>' : 
        '<div class="status-dot stopped"></div>';
    
    row.innerHTML = `
        <div class="instance-port">${instance.port}</div>
        <div class="instance-name">${instance.name}</div>
        <div class="instance-description">${instance.description}</div>
        <div class="instance-workspace">${instance.workspace}</div>
        <div class="instance-status">
            ${statusDot}
            <span>${instance.status}</span>
        </div>
        <div class="instance-actions">
            ${instance.canStart ? `
                <button class="btn btn-small btn-success" onclick="startInstance('${instance.port}')">Start</button>
            ` : ''}
            ${instance.canStop ? `
                <button class="btn btn-small btn-warning" onclick="restartInstance('${instance.port}')">Restart</button>
                <button class="btn btn-small btn-danger" onclick="stopInstance('${instance.port}')">Stop</button>
            ` : ''}
            ${instance.status === 'running' ? `
                <button class="btn btn-small btn-primary" onclick="openInstance('${instance.port}')">Open</button>
            ` : ''}
            <button class="btn btn-small btn-secondary" onclick="removeInstance('${instance.port}')">Remove</button>
            <div class="instance-urls">
                <a href="${instance.url}" target="_blank" class="url-link">local</a>
                <a href="${instance.lanUrl}" target="_blank" class="url-link">network</a>
            </div>
        </div>
    `;
    
    return row;
}

// Update stats in header
function updateStats(data) {
    const runningInstances = preparedInstances.filter(i => i.status === 'running').length;
    // We could add a running instances counter to the header if needed
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Instance management functions
function startInstance(port) {
    socket.emit('manage-instance', { port, action: 'start' });
    showToast(`Starting instance on port ${port}...`);
}

function stopInstance(port) {
    socket.emit('manage-instance', { port, action: 'stop' });
    showToast(`Stopping instance on port ${port}...`);
}

function restartInstance(port) {
    socket.emit('manage-instance', { port, action: 'restart' });
    showToast(`Restarting instance on port ${port}...`);
}

function openInstance(port) {
    window.open(`http://lothal.local:${port}`, '_blank');
}

function startAllInstances() {
    socket.emit('manage-instance', { action: 'start-all' });
    showToast('Starting all instances...');
}

function stopAllInstances() {
    socket.emit('manage-instance', { action: 'stop-all' });
    showToast('Stopping all instances...');
}

async function removeInstance(port) {
    if (!confirm(`Are you sure you want to remove the instance on port ${port}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/instances/${port}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Instance on port ${port} removed successfully`);
            // Refresh instances list
            socket.emit('refresh-instances');
        } else {
            showToast(`Error: ${result.error}`);
        }
    } catch (error) {
        showToast(`Error removing instance: ${error.message}`);
    }
}

// Add instance functionality
function showAddForm() {
    document.getElementById('add-instance-form').style.display = 'block';
}

function hideAddForm() {
    document.getElementById('add-instance-form').style.display = 'none';
    // Clear form
    document.getElementById('new-port').value = '';
    document.getElementById('new-name').value = '';
    document.getElementById('new-description').value = '';
    document.getElementById('new-workspace').value = '';
}

async function addInstance() {
    const port = document.getElementById('new-port').value;
    const name = document.getElementById('new-name').value;
    const description = document.getElementById('new-description').value;
    const workspace = document.getElementById('new-workspace').value;
    
    if (!port || !name || !workspace) {
        showToast('Port, name, and workspace are required');
        return;
    }
    
    try {
        const response = await fetch('/api/instances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                port: parseInt(port),
                name,
                description,
                workspace,
                icon: '⚡',
                color: '#6b7280'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Instance "${name}" added successfully`);
            hideAddForm();
            // Refresh instances list
            socket.emit('refresh-instances');
        } else {
            showToast(`Error: ${result.error}`);
        }
    } catch (error) {
        showToast(`Error adding instance: ${error.message}`);
    }
}

// Service actions
function openService(port) {
    window.open(`http://localhost:${port}`, '_blank');
}

function openServiceUrl(url) {
    window.open(url, '_blank');
}

function stopService(serviceId) {
    socket.emit('control-service', { serviceId, action: 'stop' });
    showToast('Stopping service...');
}

function viewDetails(serviceId) {
    console.log('View details for', serviceId);
}

// System monitoring with Wi-Fi preference
async function updateSystemInfo() {
    try {
        const response = await fetch('/api/system');
        const data = await response.json();
        
        // Update CPU
        const cpuPercent = Math.round(data.cpu.usage);
        document.getElementById('cpu-usage').textContent = cpuPercent + '%';
        
        // Update Memory
        const memPercent = Math.round(data.memory.percentage);
        document.getElementById('memory-usage').textContent = memPercent + '%';
        
        // Update Network - prefer Wi-Fi
        const network = data.network.find(n => 
            n.ifaceName && (n.ifaceName.includes('Wi-Fi') || n.ifaceName.includes('en0'))
        ) || data.network[0];
        
        if (network) {
            document.getElementById('network-ip').textContent = network.ip4;
        }
    } catch (error) {
        console.error('Failed to update system info:', error);
    }
}

// Toast notifications
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Socket event handlers
socket.on('control-result', (result) => {
    if (result.success) {
        showToast('Action completed successfully');
    } else {
        showToast('Action failed: ' + result.error);
    }
});

socket.on('instance-result', (result) => {
    if (result.success) {
        showToast(result.result.message || 'Instance action completed successfully');
    } else {
        showToast('Instance action failed: ' + result.error);
    }
});

// Update system info every 2 seconds
setInterval(updateSystemInfo, 2000);

// Initial load
updateSystemInfo();
