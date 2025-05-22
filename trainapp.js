// trainapp.js - Updated for BFS with realistic distance units

let selectedStart = '';
let selectedGoal = '';

// Handle dropdown selections
document.addEventListener('DOMContentLoaded', function() {
    // Start dropdown handler
    const startDropdownItems = document.querySelectorAll('#startDropdown .dropdown-item');
    const startButton = document.getElementById('departure');
    
    startDropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            selectedStart = this.textContent.trim();
            startButton.textContent = selectedStart;
            console.log('Selected start:', selectedStart);
        });
    });

    // Goal dropdown handler
    const goalDropdownItems = document.querySelectorAll('#goalDropdown .dropdown-item');
    const goalButton = document.getElementById('destination');
    
    goalDropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            selectedGoal = this.textContent.trim();
            goalButton.textContent = selectedGoal;
            console.log('Selected goal:', selectedGoal);
        });
    });

    // Submit button handler
    const submitButton = document.getElementById('tombolmain');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleSearch();
        });
    }
});

// Utility function to format distance
function formatDistance(distanceMeters) {
    if (distanceMeters >= 1000) {
        return `${(distanceMeters / 1000).toFixed(2)} km`;
    } else {
        return `${distanceMeters} m`;
    }
}

// Handle search functionality
async function handleSearch() {
    if (!selectedStart || !selectedGoal) {
        alert('Please select both departure and destination stations');
        return;
    }

    if (selectedStart === selectedGoal) {
        alert('Departure and destination cannot be the same');
        return;
    }

    try {
        // Show loading state
        const submitButton = document.getElementById('tombolmain');
        const originalText = submitButton.value;
        submitButton.value = 'Searching...';
        submitButton.disabled = true;

        // Call BFS API
        const response = await fetch(`http://localhost:5000/bfs?start=${encodeURIComponent(selectedStart)}&goal=${encodeURIComponent(selectedGoal)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        
        // Store results in localStorage for result page
        localStorage.setItem('searchResults', JSON.stringify({
            start: selectedStart,
            goal: selectedGoal,
            path: data.path,
            totalDistance: data.total_distance, // in meters
            totalDistanceFormatted: data.total_distance_formatted || formatDistance(data.total_distance),
            distanceUnit: data.distance_unit || 'meters',
            numberOfStations: data.number_of_stations,
            numberOfTransfers: data.number_of_transfers,
            algorithm: data.algorithm,
            timestamp: new Date().toISOString()
        }));

        // Redirect to results page
        window.location.href = 'result.html';

    } catch (error) {
        console.error('Search error:', error);
        alert('Error finding route: ' + error.message);
    } finally {
        // Reset button state
        const submitButton = document.getElementById('tombolmain');
        if (submitButton) {
            submitButton.value = originalText;
            submitButton.disabled = false;
        }
    }
}

// Alternative search function using POST method
async function searchWithPost() {
    if (!selectedStart || !selectedGoal) {
        alert('Please select both departure and destination stations');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start: selectedStart,
                goal: selectedGoal
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('POST search error:', error);
        throw error;
    }
}

// Load all stations dynamically (if needed)
async function loadStations() {
    try {
        const response = await fetch('http://localhost:5000/stations');
        const stations = await response.json();
        
        // Populate dropdowns with stations
        populateDropdowns(stations);
        
    } catch (error) {
        console.error('Error loading stations:', error);
    }
}

// Populate dropdown menus with stations
function populateDropdowns(stations) {
    const startDropdown = document.getElementById('startDropdown');
    const goalDropdown = document.getElementById('goalDropdown');
    
    if (startDropdown && goalDropdown) {
        // Clear existing items
        startDropdown.innerHTML = '';
        goalDropdown.innerHTML = '';
        
        // Add stations to dropdowns
        stations.forEach(station => {
            const startItem = document.createElement('li');
            startItem.innerHTML = `<button class="dropdown-item" type="button">${station}</button>`;
            startDropdown.appendChild(startItem);
            
            const goalItem = document.createElement('li');
            goalItem.innerHTML = `<button class="dropdown-item" type="button">${station}</button>`;
            goalDropdown.appendChild(goalItem);
        });
        
        // Re-attach event listeners
        attachDropdownListeners();
    }
}

// Attach event listeners to dynamically created dropdown items
function attachDropdownListeners() {
    const startDropdownItems = document.querySelectorAll('#startDropdown .dropdown-item');
    const startButton = document.getElementById('departure');
    
    startDropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            selectedStart = this.textContent.trim();
            startButton.textContent = selectedStart;
        });
    });

    const goalDropdownItems = document.querySelectorAll('#goalDropdown .dropdown-item');
    const goalButton = document.getElementById('destination');
    
    goalDropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            selectedGoal = this.textContent.trim();
            goalButton.textContent = selectedGoal;
        });
    });
}

// Utility function to validate station names
function isValidStation(stationName) {
    const validStations = [
        'Lebak Bulus Grab', 'Fatmawati Indomaret', 'Cipete Raya', 'Haji Nawi',
        'Blok A', 'Blok M BCA', 'ASEAN', 'Senayan', 'Istora Mandiri',
        'Bendungan Hilir', 'Setiabudi Astra', 'Dukuh Atas BNI', 'Bundaran HI',
        'Monas', 'Gambir', 'Juanda', 'Sawah Besar', 'Mangga Besar',
        'Jayakarta', 'Jakarta Kota', 'Kemayoran', 'Pasar Senen',
        'Gang Sentiong', 'Kramat', 'Pondok Jati', 'Taman Sari',
        'Tanah Abang', 'Karet', 'Sudirman', 'Cikini', 'Gondangdia',
        'Jatinegara', 'Klender', 'Buaran', 'Klender Baru', 'Cakung'
    ];
    
    return validStations.includes(stationName);
}

// Calculate estimated travel time based on distance
function calculateTravelTime(distanceMeters) {
    // Assume average train speed of 40 km/h in urban areas
    const avgSpeedKmh = 40;
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / avgSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
        return `${timeMinutes} minutes`;
    } else {
        const hours = Math.floor(timeMinutes / 60);
        const minutes = timeMinutes % 60;
        return `${hours}h ${minutes}m`;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('CityRail BFS App with Realistic Distances initialized');
    // Uncomment the line below if you want to load stations dynamically
    // loadStations();
});