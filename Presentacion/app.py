
from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import sys

def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))

    return os.path.join(base_path, relative_path)


app = Flask(
    __name__,
    template_folder=resource_path("templates"),
    static_folder=resource_path("static")
)


# ============================================================
# TU CÓDIGO BASE
# ============================================================

class heapq:

    def heappush(frontera, elemento):
        frontera.append(elemento)

    def heappop(frontera):
        menor_indice = 0

        for i in range(len(frontera)):
            if frontera[i] < frontera[menor_indice]:
                menor_indice = i

        return frontera.pop(menor_indice)


def reconstruct_path(sol, start, goal):
    if start == goal:
        return [start]

    if goal not in sol:
        return []

    path = [goal]
    s = goal

    while s:
        padre = sol.get(s)

        if padre is None:
            break

        path.append(padre)
        s = padre

        if s == start:
            break

    return list(reversed(path))


def guardar_paso(
    pasos,
    accion,
    actual,
    frontera,
    explorados,
    parent,
    costos,
    camino_final=None
):
    pasos.append({
        "accion": accion,
        "actual": actual,
        "frontera": frontera.copy(),
        "explorados": list(explorados),
        "parent": parent.copy(),
        "costos": costos.copy(),
        "camino_final": camino_final if camino_final else []
    })


def uniform_cost_search(graph, start, goal):
    node = start
    costo_inicial = 0

    pasos = []

    parent = {}
    parent[start] = None

    if start == goal:
        guardar_paso(
            pasos,
            "El nodo inicial ya es la meta.",
            start,
            [],
            set(),
            parent,
            {start: 0},
            [start]
        )
        return parent, 0, pasos

    frontera = []
    heapq.heappush(frontera, (costo_inicial, node))

    explorados = set()

    costos = {}
    costos[start] = 0

    guardar_paso(
        pasos,
        "Inicio del algoritmo. Se agrega el nodo inicial a la frontera.",
        None,
        frontera,
        explorados,
        parent,
        costos
    )

    while True:

        if len(frontera) == 0:
            guardar_paso(
                pasos,
                "La frontera está vacía. No se encontró solución.",
                None,
                frontera,
                explorados,
                parent,
                costos
            )
            return {}, None, pasos

        costo_actual, node = heapq.heappop(frontera)

        guardar_paso(
            pasos,
            f"Se extrae de la frontera el nodo con menor costo: {node} con costo {costo_actual}.",
            node,
            frontera,
            explorados,
            parent,
            costos
        )

        if node in explorados:
            guardar_paso(
                pasos,
                f"El nodo {node} ya estaba explorado, por eso se ignora.",
                node,
                frontera,
                explorados,
                parent,
                costos
            )
            continue

        if node == goal:
            camino_final = reconstruct_path(parent, start, goal)

            guardar_paso(
                pasos,
                f"Se llegó a la meta: {goal}. Costo total: {costo_actual}.",
                node,
                frontera,
                explorados,
                parent,
                costos,
                camino_final
            )

            return parent, costo_actual, pasos

        explorados.add(node)

        guardar_paso(
            pasos,
            f"Se marca {node} como explorado.",
            node,
            frontera,
            explorados,
            parent,
            costos
        )

        for child in graph[node]:

            nuevo_costo = costo_actual + graph[node][child]

            if child not in explorados and child not in costos:
                parent[child] = node
                costos[child] = nuevo_costo
                heapq.heappush(frontera, (nuevo_costo, child))

                guardar_paso(
                    pasos,
                    f"Se agrega {child} a la frontera con costo acumulado {nuevo_costo}. Padre: {node}.",
                    node,
                    frontera,
                    explorados,
                    parent,
                    costos
                )

            elif child in costos and nuevo_costo < costos[child]:
                parent[child] = node
                costos[child] = nuevo_costo
                heapq.heappush(frontera, (nuevo_costo, child))

                guardar_paso(
                    pasos,
                    f"Se actualiza {child}. Nuevo costo menor: {nuevo_costo}. Nuevo padre: {node}.",
                    node,
                    frontera,
                    explorados,
                    parent,
                    costos
                )

            else:
                guardar_paso(
                    pasos,
                    f"No se actualiza {child}, porque ya tiene un costo menor o ya fue explorado.",
                    node,
                    frontera,
                    explorados,
                    parent,
                    costos
                )


# ============================================================
# GRAFO COMPLETO DE RUMANIA
# ============================================================

graph = {
    'arad': {
        'zerind': 75,
        'timisoara': 118,
        'sibiu': 140
    },

    'zerind': {
        'arad': 75,
        'oradea': 71
    },

    'oradea': {
        'zerind': 71,
        'sibiu': 151
    },

    'timisoara': {
        'arad': 118,
        'lugoj': 111
    },

    'lugoj': {
        'timisoara': 111,
        'mehadia': 70
    },

    'mehadia': {
        'lugoj': 70,
        'drobeta': 75
    },

    'drobeta': {
        'mehadia': 75,
        'craiova': 120
    },

    'craiova': {
        'drobeta': 120,
        'rimnicu_vilcea': 146,
        'pitesti': 138
    },

    'sibiu': {
        'arad': 140,
        'oradea': 151,
        'fagaras': 99,
        'rimnicu_vilcea': 80
    },

    'fagaras': {
        'sibiu': 99,
        'bucharest': 211
    },

    'rimnicu_vilcea': {
        'sibiu': 80,
        'craiova': 146,
        'pitesti': 97
    },

    'pitesti': {
        'rimnicu_vilcea': 97,
        'craiova': 138,
        'bucharest': 101
    },

    'bucharest': {
        'fagaras': 211,
        'pitesti': 101,
        'giurgiu': 90,
        'urziceni': 85
    },

    'giurgiu': {
        'bucharest': 90
    },

    'urziceni': {
        'bucharest': 85,
        'hirsova': 98,
        'vaslui': 142
    },

    'hirsova': {
        'urziceni': 98,
        'eforie': 86
    },

    'eforie': {
        'hirsova': 86
    },

    'vaslui': {
        'urziceni': 142,
        'iasi': 92
    },

    'iasi': {
        'vaslui': 92,
        'neamt': 87
    },

    'neamt': {
        'iasi': 87
    }
}


labels = {
    'arad': 'Arad',
    'zerind': 'Zerind',
    'oradea': 'Oradea',
    'timisoara': 'Timisoara',
    'lugoj': 'Lugoj',
    'mehadia': 'Mehadia',
    'drobeta': 'Drobeta',
    'craiova': 'Craiova',
    'sibiu': 'Sibiu',
    'fagaras': 'Fagaras',
    'rimnicu_vilcea': 'Rimnicu Vilcea',
    'pitesti': 'Pitesti',
    'bucharest': 'Bucharest',
    'giurgiu': 'Giurgiu',
    'urziceni': 'Urziceni',
    'hirsova': 'Hirsova',
    'eforie': 'Eforie',
    'vaslui': 'Vaslui',
    'iasi': 'Iasi',
    'neamt': 'Neamt'
}


# Se amplió el canvas para que el grafo respire mejor.
positions = {
    'oradea': {'x': 105, 'y': 55},
    'zerind': {'x': 80, 'y': 150},
    'arad': {'x': 70, 'y': 270},
    'timisoara': {'x': 105, 'y': 400},
    'lugoj': {'x': 215, 'y': 475},
    'mehadia': {'x': 220, 'y': 560},
    'drobeta': {'x': 220, 'y': 650},

    'sibiu': {'x': 355, 'y': 275},
    'fagaras': {'x': 545, 'y': 270},
    'rimnicu_vilcea': {'x': 420, 'y': 410},
    'craiova': {'x': 490, 'y': 635},
    'pitesti': {'x': 610, 'y': 490},
    'bucharest': {'x': 790, 'y': 535},
    'giurgiu': {'x': 755, 'y': 650},

    'urziceni': {'x': 910, 'y': 485},
    'hirsova': {'x': 1035, 'y': 480},
    'eforie': {'x': 1100, 'y': 615},
    'vaslui': {'x': 1010, 'y': 330},
    'iasi': {'x': 930, 'y': 180},
    'neamt': {'x': 780, 'y': 105}
}


def get_edges():
    edges = []
    added = set()

    for origin in graph:
        for target, cost in graph[origin].items():
            key = tuple(sorted([origin, target]))

            if key not in added:
                added.add(key)
                edges.append({
                    "from": origin,
                    "to": target,
                    "cost": cost
                })

    return edges


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/presentacion")
def presentacion():
    return send_from_directory(resource_path("."), "presentacion.html")


@app.route("/visualizador")
def visualizador():
    return render_template("index.html")


@app.route("/api/data")
def api_data():
    start = request.args.get("start", "arad")
    goal = request.args.get("goal", "bucharest")

    if start not in graph:
        start = "arad"

    if goal not in graph:
        goal = "bucharest"

    sol, costo_total, pasos = uniform_cost_search(graph, start, goal)
    path = reconstruct_path(sol, start, goal)

    return jsonify({
        "graph": graph,
        "labels": labels,
        "positions": positions,
        "edges": get_edges(),
        "steps": pasos,
        "start": start,
        "goal": goal,
        "path": path,
        "total_cost": costo_total,
        "cities": list(graph.keys())
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
