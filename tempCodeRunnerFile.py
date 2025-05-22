@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    
    # Validasi sederhana
    if 'start' not in data or 'goal' not in data:
        return jsonify({'error': 'Missing start or goal'}), 400

    start = tuple(data['start'])
    goal = tuple(data['goal'])

    path, weight, heuristic_name = astar_search(start, goal)

    # Jika path tidak ditemukan
    if not path:
        return jsonify({'error': 'No path found'}), 404

    return jsonify({
        'path': path,
        'weight': weight,
        'heuristic_name': heuristic_name
    })
