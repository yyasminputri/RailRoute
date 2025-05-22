// result.js - Display search results with realistic distance units

document.addEventListener('DOMContentLoaded', function() {
    displaySearchResults();
});

function displaySearchResults() {
    const resultsData = localStorage.getItem('searchResults');
    const resultBox = document.getElementById('resultbox');
    
    if (!resultsData) {
        resultBox.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <h4 class="alert-heading">No Results Found</h4>
                <p>No search results available. Please go back and perform a search.</p>
                <hr>
                <p class="mb-0"><a href="landing.html" class="btn btn-primary">Back to Search</a></p>
            </div>
        `;
        return;
    }
    
    try {
        const results = JSON.parse(resultsData);
        
        // Calculate travel time estimate
        const travelTimeEstimate = calculateTravelTime(results.totalDistance);
        
        // Generate path display
        const pathDisplay = generatePathDisplay(results.path);
        
        resultBox.innerHTML = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">🚊 Route Found!</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col">
                            <h6><strong>From:</strong> ${results.start}</h6>
                            <h6><strong>To:</strong> ${results.goal}</h6>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-route me-2"></i>
                                <strong>Distance:</strong> 
                                <span class="badge bg-success ms-2">${results.totalDistanceFormatted || formatDistance(results.totalDistance)}</span>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-clock me-2"></i>
                                <strong>Est. Time:</strong> 
                                <span class="badge bg-info ms-2">${travelTimeEstimate}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-train me-2"></i>
                                <strong>Stations:</strong> 
                                <span class="badge bg-warning text-dark ms-2">${results.numberOfStations}</span>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-exchange-alt me-2"></i>
                                <strong>Transfers:</strong> 
                                <span class="badge bg-secondary ms-2">${results.numberOfTransfers}</span>
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <h6><i class="fas fa-map-marked-alt me-2"></i>Route Path:</h6>
                        ${pathDisplay}
                    </div>
                    
                    <hr>
                    
                    <div class="row">
                        <div class="col">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Algorithm: ${results.algorithm}<br>
                                <i class="fas fa-calendar me-1"></i>
                                Search performed: ${formatDateTime(results.timestamp)}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between">
                        <a href="landing.html" class="btn btn-outline-primary">
                            <i class="fas fa-arrow-left me-1"></i>New Search
                        </a>
                        <button onclick="shareResults()" class="btn btn-outline-success">
                            <i class="fas fa-share me-1"></i>Share Route
                        </button>
                        <button onclick="printResults()" class="btn btn-outline-secondary">
                            <i class="fas fa-print me-1"></i>Print
                        </button>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error parsing search results:', error);
        resultBox.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error</h4>
                <p>There was an error displaying the search results.</p>
                <hr>
                <p class="mb-0"><a href="landing.html" class="btn btn-primary">Back to Search</a></p>
            </div>
        `;
    }
}

function generatePathDisplay(path) {
    if (!path || path.length === 0) {
        return '<p class="text-muted">No path available</p>';
    }
    
    let pathHtml = '<div class="route-path">';
    
    path.forEach((station, index) => {
        const isFirst = index === 0;
        const isLast = index === path.length - 1;
        
        // Generate station label
        let stationLabel = '';
        if (isFirst) {
            stationLabel = 'Start';
        } else if (isLast) {
            stationLabel = 'Destination';
        } else {
            stationLabel = `Station ${index + 1}`;
        }
        
        pathHtml += `
            <div class="d-flex align-items-center justify-content-between mb-2 station-row">
                <div class="d-flex align-items-center">
                    <div class="route-indicator">
                        ${isFirst ? '<i class="fas fa-play-circle text-success"></i>' : 
                          isLast ? '<i class="fas fa-stop-circle text-danger"></i>' : 
                          '<i class="fas fa-circle text-primary"></i>'}
                    </div>
                    <div class="ms-3">
                        <strong class="${isFirst ? 'text-success' : isLast ? 'text-danger' : ''}">${station}</strong>
                        <small class="text-muted d-block">
                            ${isFirst ? 'Departure' : isLast ? 'Destination' : 'Transfer Point'}
                        </small>
                    </div>
                </div>
                <div class="station-label">
                    <span class="badge ${isFirst ? 'bg-success' : isLast ? 'bg-danger' : 'bg-secondary'}">${stationLabel}</span>
                </div>
            </div>
            ${!isLast ? '<div class="route-line ms-2 mb-2"><i class="fas fa-arrow-down text-muted"></i></div>' : ''}
        `;
    });
    
    pathHtml += '</div>';
    return pathHtml;
}

function formatDistance(distanceMeters) {
    if (distanceMeters >= 1000) {
        return `${(distanceMeters / 1000).toFixed(2)} km`;
    } else {
        return `${distanceMeters} m`;
    }
}

function calculateTravelTime(distanceMeters) {
    // Assume average train speed of 40 km/h in urban areas
    const avgSpeedKmh = 40;
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / avgSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
        return `${timeMinutes} min`;
    } else {
        const hours = Math.floor(timeMinutes / 60);
        const minutes = timeMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (error) {
        return 'Unknown';
    }
}

function shareResults() {
    const resultsData = localStorage.getItem('searchResults');
    if (!resultsData) return;
    
    try {
        const results = JSON.parse(resultsData);
        const shareText = `🚊 CityRail Route Found!\n\nFrom: ${results.start}\nTo: ${results.goal}\nDistance: ${results.totalDistanceFormatted || formatDistance(results.totalDistance)}\nStations: ${results.numberOfStations}\nEstimated Time: ${calculateTravelTime(results.totalDistance)}\n\nRoute: ${results.path.join(' → ')}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'CityRail Route',
                text: shareText
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Route details copied to clipboard!');
            }).catch(() => {
                // Show in alert if clipboard fails
                alert(shareText);
            });
        }
    } catch (error) {
        console.error('Error sharing results:', error);
        alert('Unable to share results');
    }
}

function printResults() {
    window.print();
}

// Add some CSS for better route visualization
const style = document.createElement('style');
style.textContent = `
    .route-path {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        padding: 15px;
        background-color: #f8f9fa;
    }
    
    .route-indicator {
        min-width: 20px;
        text-align: center;
    }
    
    .route-line {
        height: 20px;
        display: flex;
        align-items: center;
    }
    
    .station-row {
        padding: 8px 12px;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }
    
    .station-row:hover {
        background-color: rgba(0, 123, 255, 0.05);
    }
    
    .station-label {
        min-width: 100px;
        text-align: right;
    }
    
    .station-label .badge {
        font-size: 0.75em;
        padding: 0.375em 0.75em;
    }
    
    @media (max-width: 576px) {
        .station-row {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .station-label {
            margin-top: 5px;
            text-align: left;
            min-width: auto;
        }
    }
    
    @media print {
        .btn, .card-footer {
            display: none !important;
        }
        
        .card {
            border: none !important;
            box-shadow: none !important;
        }
    }
`;
document.head.appendChild(style);