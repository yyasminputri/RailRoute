from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from collections import deque
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

# Extended station list with more stations
STATIONS = [
    'Lebak Bulus Grab', 'Fatmawati Indomaret', 'Cipete Raya', 'Haji Nawi',
    'Blok A', 'Blok M BCA', 'ASEAN', 'Senayan', 'Istora Mandiri',
    'Bendungan Hilir', 'Setiabudi Astra', 'Dukuh Atas BNI', 'Bundaran HI',
    'Monas', 'Gambir', 'Juanda', 'Sawah Besar', 'Mangga Besar',
    'Jayakarta', 'Jakarta Kota', 'Kemayoran', 'Pasar Senen',
    'Gang Sentiong', 'Kramat', 'Pondok Jati', 'Taman Sari',
    'Tanah Abang', 'Karet', 'Sudirman', 'Cikini', 'Gondangdia',
    'Jatinegara', 'Klender', 'Buaran', 'Klender Baru', 'Cakung'
]

# Extended graph with more connections
GRAPH = {
    'Lebak Bulus Grab': ['Fatmawati Indomaret', 'Cipete Raya'],
    'Fatmawati Indomaret': ['Lebak Bulus Grab', 'Cipete Raya', 'Pondok Jati'],
    'Cipete Raya': ['Lebak Bulus Grab', 'Fatmawati Indomaret', 'Haji Nawi', 'Blok A'],
    'Haji Nawi': ['Cipete Raya', 'Blok A', 'Taman Sari'],
    'Blok A': ['Cipete Raya', 'Haji Nawi', 'Blok M BCA'],
    'Blok M BCA': ['Blok A', 'ASEAN', 'Tanah Abang'],
    'ASEAN': ['Blok M BCA', 'Senayan', 'Sudirman'],
    'Senayan': ['ASEAN', 'Istora Mandiri', 'Setiabudi Astra', 'Karet'],
    'Istora Mandiri': ['Senayan', 'Bendungan Hilir'],
    'Bendungan Hilir': ['Istora Mandiri', 'Setiabudi Astra', 'Dukuh Atas BNI'],
    'Setiabudi Astra': ['Senayan', 'Bendungan Hilir', 'Dukuh Atas BNI', 'Bundaran HI'],
    'Dukuh Atas BNI': ['Bendungan Hilir', 'Setiabudi Astra', 'Bundaran HI', 'Cikini'],
    'Bundaran HI': ['Setiabudi Astra', 'Dukuh Atas BNI', 'Monas', 'Gondangdia'],
    'Monas': ['Bundaran HI', 'Gambir', 'Juanda'],
    'Gambir': ['Monas', 'Juanda', 'Sawah Besar', 'Cikini'],
    'Juanda': ['Monas', 'Gambir', 'Sawah Besar'],
    'Sawah Besar': ['Gambir', 'Juanda', 'Mangga Besar', 'Pasar Senen'],
    'Mangga Besar': ['Sawah Besar', 'Jayakarta', 'Kemayoran'],
    'Jayakarta': ['Mangga Besar', 'Jakarta Kota'],
    'Jakarta Kota': ['Jayakarta', 'Kemayoran'],
    'Kemayoran': ['Mangga Besar', 'Jakarta Kota', 'Pasar Senen', 'Gang Sentiong'],
    'Pasar Senen': ['Sawah Besar', 'Kemayoran', 'Gang Sentiong', 'Kramat'],
    'Gang Sentiong': ['Kemayoran', 'Pasar Senen', 'Kramat'],
    'Kramat': ['Pasar Senen', 'Gang Sentiong', 'Cikini'],
    'Pondok Jati': ['Fatmawati Indomaret', 'Taman Sari'],
    'Taman Sari': ['Haji Nawi', 'Pondok Jati', 'Tanah Abang'],
    'Tanah Abang': ['Blok M BCA', 'Taman Sari', 'Karet', 'Sudirman'],
    'Karet': ['Senayan', 'Tanah Abang', 'Sudirman'],
    'Sudirman': ['ASEAN', 'Tanah Abang', 'Karet', 'Cikini'],
    'Cikini': ['Dukuh Atas BNI', 'Gambir', 'Kramat', 'Sudirman', 'Gondangdia'],
    'Gondangdia': ['Bundaran HI', 'Cikini', 'Jatinegara'],
    'Jatinegara': ['Gondangdia', 'Klender', 'Buaran'],
    'Klender': ['Jatinegara', 'Klender Baru', 'Cakung'],
    'Buaran': ['Jatinegara', 'Klender Baru'],
    'Klender Baru': ['Klender', 'Buaran', 'Cakung'],
    'Cakung': ['Klender', 'Klender Baru']
}

# Extended edge weights - converted to meters (realistic distances between stations)
EDGE_WEIGHTS = {
    ("Lebak Bulus Grab", "Fatmawati Indomaret"): 1600,  # 1.6 km
    ("Lebak Bulus Grab", "Cipete Raya"): 1500,  # 1.5 km
    ("Fatmawati Indomaret", "Cipete Raya"): 1100,  # 1.1 km
    ("Fatmawati Indomaret", "Pondok Jati"): 1400,  # 1.4 km
    ("Cipete Raya", "Blok A"): 1150,  # 1.15 km
    ("Cipete Raya", "Haji Nawi"): 1450,  # 1.45 km
    ("Haji Nawi", "Blok A"): 1700,  # 1.7 km
    ("Haji Nawi", "Taman Sari"): 1300,  # 1.3 km
    ("Blok A", "Blok M BCA"): 2100,  # 2.1 km
    ("Blok M BCA", "ASEAN"): 1250,  # 1.25 km
    ("Blok M BCA", "Tanah Abang"): 1750,  # 1.75 km
    ("ASEAN", "Senayan"): 1550,  # 1.55 km
    ("ASEAN", "Sudirman"): 1400,  # 1.4 km
    ("Senayan", "Istora Mandiri"): 850,  # 0.85 km
    ("Senayan", "Setiabudi Astra"): 2500,  # 2.5 km
    ("Senayan", "Karet"): 1200,  # 1.2 km
    ("Istora Mandiri", "Bendungan Hilir"): 2000,  # 2.0 km
    ("Bendungan Hilir", "Setiabudi Astra"): 1650,  # 1.65 km
    ("Bendungan Hilir", "Dukuh Atas BNI"): 1900,  # 1.9 km
    ("Setiabudi Astra", "Bundaran HI"): 1850,  # 1.85 km
    ("Setiabudi Astra", "Dukuh Atas BNI"): 2200,  # 2.2 km
    ("Dukuh Atas BNI", "Bundaran HI"): 3500,  # 3.5 km
    ("Dukuh Atas BNI", "Cikini"): 1600,  # 1.6 km
    ("Bundaran HI", "Monas"): 1250,  # 1.25 km
    ("Bundaran HI", "Gondangdia"): 2050,  # 2.05 km
    ("Monas", "Gambir"): 1000,  # 1.0 km
    ("Monas", "Juanda"): 900,  # 0.9 km
    ("Gambir", "Juanda"): 750,  # 0.75 km
    ("Gambir", "Sawah Besar"): 1100,  # 1.1 km
    ("Gambir", "Cikini"): 1500,  # 1.5 km
    ("Juanda", "Sawah Besar"): 950,  # 0.95 km
    ("Sawah Besar", "Mangga Besar"): 1200,  # 1.2 km
    ("Sawah Besar", "Pasar Senen"): 1350,  # 1.35 km
    ("Mangga Besar", "Jayakarta"): 1050,  # 1.05 km
    ("Mangga Besar", "Kemayoran"): 1650,  # 1.65 km
    ("Jayakarta", "Jakarta Kota"): 800,  # 0.8 km
    ("Jakarta Kota", "Kemayoran"): 1450,  # 1.45 km
    ("Kemayoran", "Pasar Senen"): 1300,  # 1.3 km
    ("Kemayoran", "Gang Sentiong"): 1150,  # 1.15 km
    ("Pasar Senen", "Gang Sentiong"): 900,  # 0.9 km
    ("Pasar Senen", "Kramat"): 1550,  # 1.55 km
    ("Gang Sentiong", "Kramat"): 1250,  # 1.25 km
    ("Kramat", "Cikini"): 1400,  # 1.4 km
    ("Pondok Jati", "Taman Sari"): 1700,  # 1.7 km
    ("Taman Sari", "Tanah Abang"): 1950,  # 1.95 km
    ("Tanah Abang", "Karet"): 1100,  # 1.1 km
    ("Tanah Abang", "Sudirman"): 1300,  # 1.3 km
    ("Karet", "Sudirman"): 950,  # 0.95 km
    ("Sudirman", "Cikini"): 1650,  # 1.65 km
    ("Cikini", "Gondangdia"): 1200,  # 1.2 km
    ("Gondangdia", "Jatinegara"): 2250,  # 2.25 km
    ("Jatinegara", "Klender"): 1900,  # 1.9 km
    ("Jatinegara", "Buaran"): 2100,  # 2.1 km
    ("Klender", "Klender Baru"): 1350,  # 1.35 km
    ("Klender", "Cakung"): 1750,  # 1.75 km
    ("Buaran", "Klender Baru"): 1550,  # 1.55 km
    ("Klender Baru", "Cakung"): 1450  # 1.45 km
}

def bfs_search(start, goal):
    """
    Breadth-First Search algorithm to find the shortest path between two stations
    Returns the path and total distance in meters
    """
    if start == goal:
        return [start], 0
    
    if start not in GRAPH or goal not in GRAPH:
        return None, 0
    
    # Initialize BFS
    queue = deque([(start, [start], 0)])  # (current_node, path, total_weight)
    visited = set([start])
    
    while queue:
        current, path, total_weight = queue.popleft()
        
        # Check all neighbors
        for neighbor in GRAPH[current]:
            if neighbor not in visited:
                new_path = path + [neighbor]
                
                # Calculate edge weight
                edge_key = (current, neighbor)
                reverse_edge_key = (neighbor, current)
                edge_weight = EDGE_WEIGHTS.get(edge_key, EDGE_WEIGHTS.get(reverse_edge_key, 1000))  # Default 1km
                new_weight = total_weight + edge_weight
                
                # Check if we reached the goal
                if neighbor == goal:
                    return new_path, new_weight
                
                # Add to queue for further exploration
                queue.append((neighbor, new_path, new_weight))
                visited.add(neighbor)
    
    return None, 0  # No path found

def format_distance(distance_meters):
    """Convert meters to appropriate unit (km or m) for display"""
    if distance_meters >= 1000:
        return f"{distance_meters / 1000:.2f} km"
    else:
        return f"{distance_meters} m"

@app.route('/stations', methods=['GET'])
def get_stations():
    """Get all available stations"""
    return jsonify(STATIONS)

@app.route('/bfs', methods=['GET'])
def bfs_route():
    """BFS pathfinding endpoint"""
    start = request.args.get('start')
    goal = request.args.get('goal')
    
    if not start or not goal:
        return jsonify({'error': 'Both start and goal parameters are required'}), 400
    
    if start not in STATIONS or goal not in STATIONS:
        return jsonify({'error': 'Invalid station name'}), 400
    
    path, total_distance_meters = bfs_search(start, goal)
    
    if path is None:
        return jsonify({'error': 'No path found between stations'}), 404
    
    # Calculate additional information
    num_stations = len(path)
    num_transfers = num_stations - 1
    
    return jsonify({
        'path': path,
        'total_distance': total_distance_meters,  # in meters
        'total_distance_formatted': format_distance(total_distance_meters),
        'distance_unit': 'meters',
        'number_of_stations': num_stations,
        'number_of_transfers': num_transfers,
        'algorithm': 'BFS (Breadth-First Search)'
    })

@app.route('/edge', methods=['GET'])
def get_edge():
    """Get all edge connections"""
    edges = []
    for (source, target), weight in EDGE_WEIGHTS.items():
        edges.append({
            'source': source,
            'target': target,
            'weight': weight,
            'weight_formatted': format_distance(weight)
        })
    return jsonify(edges)

@app.route('/graph', methods=['GET'])
def get_graph():
    """Get the complete graph structure"""
    return jsonify({
        'stations': STATIONS,
        'connections': GRAPH,
        'weights': EDGE_WEIGHTS,
        'distance_unit': 'meters'
    })

# Legacy endpoint for backward compatibility
@app.route('/astar', methods=['GET'])
def astar_search():
    """Legacy A* endpoint - now redirects to BFS"""
    start = request.args.get('start')
    goal = request.args.get('goal')
    
    if not start or not goal:
        return jsonify({'error': 'Both start and goal parameters are required'}), 400
    
    path, total_distance_meters = bfs_search(start, goal)
    
    if path is None:
        return jsonify({'error': 'No path found between stations'}), 404
    
    return jsonify({
        'path': path,
        'total_distance': total_distance_meters,
        'total_distance_formatted': format_distance(total_distance_meters),
        'algorithm': 'BFS (converted from A*)',
        'note': 'This endpoint now uses BFS instead of A*'
    })

@app.route('/search', methods=['POST'])
def search():
    """POST endpoint for pathfinding"""
    data = request.get_json()
    
    if not data or 'start' not in data or 'goal' not in data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    start = data['start']
    goal = data['goal']
    
    path, total_distance_meters = bfs_search(start, goal)
    
    if path is None:
        return jsonify({'error': 'No path found between stations'}), 404
    
    return jsonify({
        'path': path,
        'weight': total_distance_meters,
        'weight_formatted': format_distance(total_distance_meters),
        'algorithm': 'BFS'
    })

@app.route('/')
def index():
    """Root endpoint with API information"""
    return jsonify({
        'message': 'CityRail API with BFS Pathfinding',
        'endpoints': {
            '/stations': 'GET - List all stations',
            '/bfs': 'GET - Find path using BFS (params: start, goal)',
            '/edge': 'GET - List all edges',
            '/graph': 'GET - Complete graph structure',
            '/search': 'POST - Find path (JSON body with start and goal)',
            '/astar': 'GET - Legacy endpoint (now uses BFS)'
        },
        'total_stations': len(STATIONS),
        'total_connections': len(EDGE_WEIGHTS),
        'distance_unit': 'meters (converted to km when >= 1000m)'
    })

if __name__ == '__main__':
    app.run(debug=True)