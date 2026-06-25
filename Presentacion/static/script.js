
let data = null;
let currentStep = 0;
const NODE_RADIUS = 36;
const GRAPH_PADDING = 48;

const svg = document.getElementById("graphSvg");
const startSelect = document.getElementById("startSelect");
const goalSelect = document.getElementById("goalSelect");
const stepRange = document.getElementById("stepRange");
const stepCounter = document.getElementById("stepCounter");

const panelStep = document.getElementById("panelStep");
const panelSubtitle = document.getElementById("panelSubtitle");
const actionText = document.getElementById("actionText");
const currentNode = document.getElementById("currentNode");
const totalCost = document.getElementById("totalCost");
const exploredNodes = document.getElementById("exploredNodes");
const frontierNodes = document.getElementById("frontierNodes");
const orderedFrontier = document.getElementById("orderedFrontier");
const finalPath = document.getElementById("finalPath");

document.getElementById("btnStart").addEventListener("click", () => goToStep(0));
document.getElementById("btnPrev").addEventListener("click", () => goToStep(currentStep - 1));
document.getElementById("btnNext").addEventListener("click", () => goToStep(currentStep + 1));
document.getElementById("btnEnd").addEventListener("click", () => goToStep(data.steps.length - 1));

stepRange.addEventListener("input", () => {
    goToStep(Number(stepRange.value));
});

startSelect.addEventListener("change", loadData);
goalSelect.addEventListener("change", loadData);

document.addEventListener("keydown", (event) => {
    if (!data) return;

    if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goToStep(currentStep + 1);
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToStep(currentStep - 1);
    }

    if (event.key === "Home") {
        event.preventDefault();
        goToStep(0);
    }

    if (event.key === "End") {
        event.preventDefault();
        goToStep(data.steps.length - 1);
    }
});

function cityName(node) {
    if (!node) return "Ninguno";
    return data.labels[node] || node;
}

function formatNodeList(nodes) {
    if (!nodes || nodes.length === 0) return "Ninguno";
    return nodes.map(cityName).join(", ");
}

function formatFrontier(frontier) {
    if (!frontier || frontier.length === 0) return "Vacía";
    return frontier.map(item => {
        const cost = item[0];
        const node = item[1];
        return `(${cost}, ${cityName(node)})`;
    }).join(", ");
}

function sortFrontier(frontier) {
    return [...frontier].sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        return String(a[1]).localeCompare(String(b[1]));
    });
}

function pathEdges(path) {
    const edges = new Set();

    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        edges.add(edgeKey(a, b));
    }

    return edges;
}

function edgeKey(a, b) {
    return [a, b].sort().join("__");
}

function clearSvg() {
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
}

function createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }

    return element;
}

function getNodeTextLines(name) {
    if (name === "Rimnicu Vilcea") {
        return ["Rimnicu", "Vilcea"];
    }

    if (name.length > 10) {
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return [parts[0], parts.slice(1).join(" ")];
        }
    }

    return [name];
}

function getEdgeLabelOffset(a, b, portrait = false) {
    const key = edgeKey(a, b);

    const offsets = {
        "arad__zerind": { dx: -18, dy: 6 },
        "oradea__zerind": { dx: -27, dy: 0 },
        "arad__timisoara": { dx: -16, dy: 0 },
        "arad__sibiu": { dx: 0, dy: -14 },
        "oradea__sibiu": { dx: -16, dy: -10 },

        "sibiu__fagaras": { dx: 0, dy: -13 },
        "rimnicu_vilcea__sibiu": { dx: 18, dy: -6 },
        "lugoj__timisoara": { dx: -2, dy: -14 },
        "lugoj__mehadia": { dx: 27, dy: 0 },
        "drobeta__mehadia": { dx: 27, dy: 0 },
        "craiova__drobeta": { dx: 0, dy: -16 },

        "craiova__rimnicu_vilcea": { dx: 22, dy: 0 },
        "pitesti__rimnicu_vilcea": { dx: 0, dy: -14 },
        "craiova__pitesti": { dx: -2, dy: 16 },
        "bucharest__pitesti": { dx: 0, dy: -14 },
        "bucharest__fagaras": { dx: 20, dy: -6 },
        "bucharest__giurgiu": { dx: 20, dy: 0 },

        "bucharest__urziceni": { dx: 0, dy: -13 },
        "hirsova__urziceni": { dx: 0, dy: -14 },
        "eforie__hirsova": { dx: 18, dy: -4 },
        "urziceni__vaslui": { dx: 18, dy: 0 },
        "iasi__vaslui": { dx: 16, dy: -4 },
        "iasi__neamt": { dx: 0, dy: -14 }
    };

    const offset = offsets[key] || { dx: 0, dy: -11 };

    if (portrait) {
        return { dx: offset.dy, dy: -offset.dx };
    }

    return offset;
}

function drawEdgeLabel(group, x, y, textValue) {
    const width = String(textValue).length * 8.5 + 14;
    const height = 22;

    const rect = createSvgElement("rect", {
        x: x - width / 2,
        y: y - height / 2,
        width: width,
        height: height,
        rx: 7,
        ry: 7,
        class: "edge-label-bg"
    });

    const text = createSvgElement("text", {
        x: x,
        y: y + 1,
        class: "edge-label"
    });

    text.textContent = textValue;

    group.appendChild(rect);
    group.appendChild(text);
}

function getDisplayPositions() {
    const panel = svg.getBoundingClientRect();
    const portrait = panel.width / Math.max(panel.height, 1) < 0.9;

    if (!portrait) {
        return { positions: data.positions, portrait: false };
    }

    const xs = Object.values(data.positions).map(point => point.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const positions = {};

    for (const [node, point] of Object.entries(data.positions)) {
        positions[node] = {
            x: point.y,
            y: maxX - point.x + minX
        };
    }

    return { positions, portrait: true };
}

function fitGraphToPanel(displayPositions = null) {
    if (!data || !data.positions) return;

    const positions = displayPositions || getDisplayPositions().positions;
    const points = Object.values(positions);
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const minX = Math.min(...xs) - GRAPH_PADDING;
    const maxX = Math.max(...xs) + GRAPH_PADDING;
    const minY = Math.min(...ys) - GRAPH_PADDING;
    const maxY = Math.max(...ys) + GRAPH_PADDING;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const panel = svg.getBoundingClientRect();
    const panelRatio = panel.width / Math.max(panel.height, 1);
    const contentRatio = contentWidth / contentHeight;

    let viewX = minX;
    let viewY = minY;
    let viewWidth = contentWidth;
    let viewHeight = contentHeight;

    if (panelRatio > contentRatio) {
        viewWidth = contentHeight * panelRatio;
        viewX -= (viewWidth - contentWidth) / 2;
    } else {
        viewHeight = contentWidth / panelRatio;
        viewY -= (viewHeight - contentHeight) / 2;
    }

    svg.setAttribute("viewBox", `${viewX} ${viewY} ${viewWidth} ${viewHeight}`);
}

function drawGraph(step) {
    clearSvg();
    const { positions, portrait } = getDisplayPositions();
    fitGraphToPanel(positions);

    const finalEdges = pathEdges(step.camino_final || []);
    const frontierNodesSet = new Set((step.frontera || []).map(item => item[1]));
    const exploredSet = new Set(step.explorados || []);
    const finalPathSet = new Set(step.camino_final || []);

    const edgeGroup = createSvgElement("g");
    const edgeLabelGroup = createSvgElement("g");
    const nodeGroup = createSvgElement("g");
    svg.appendChild(edgeGroup);
    svg.appendChild(edgeLabelGroup);
    svg.appendChild(nodeGroup);

    for (const edge of data.edges) {
        const from = positions[edge.from];
        const to = positions[edge.to];

        const isFinalEdge = finalEdges.has(edgeKey(edge.from, edge.to));

        const line = createSvgElement("line", {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            class: isFinalEdge ? "edge final-edge" : "edge"
        });

        edgeGroup.appendChild(line);

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const offset = getEdgeLabelOffset(edge.from, edge.to, portrait);

        drawEdgeLabel(edgeLabelGroup, mx + offset.dx, my + offset.dy, edge.cost);
    }

    for (const node of Object.keys(positions)) {
        const pos = positions[node];

        let circleClass = "node-circle";

        if (finalPathSet.has(node)) {
            circleClass += " final-node";
        } else if (node === step.actual) {
            circleClass += " current-node";
        } else if (exploredSet.has(node)) {
            circleClass += " explored-node";
        } else if (frontierNodesSet.has(node)) {
            circleClass += " frontier-node";
        }

        const nodeContainer = createSvgElement("g", {
            class: "graph-node"
        });

        const circle = createSvgElement("circle", {
            cx: pos.x,
            cy: pos.y,
            r: NODE_RADIUS,
            class: circleClass
        });

        const title = createSvgElement("title");
        title.textContent = cityName(node);
        nodeContainer.appendChild(title);
        nodeContainer.appendChild(circle);

        const name = cityName(node);
        const lines = getNodeTextLines(name);
        const smallClass = lines.length > 1 || name.length > 8 ? "node-label small" : "node-label";

        if (lines.length === 1) {
            const text = createSvgElement("text", {
                x: pos.x,
                y: pos.y + 1,
                class: smallClass
            });

            text.textContent = lines[0];
            nodeContainer.appendChild(text);
        } else if (lines.length === 2) {
            const text1 = createSvgElement("text", {
                x: pos.x,
                y: pos.y - 9,
                class: smallClass
            });
            text1.textContent = lines[0];

            const text2 = createSvgElement("text", {
                x: pos.x,
                y: pos.y + 11,
                class: smallClass
            });
            text2.textContent = lines[1];

            nodeContainer.appendChild(text1);
            nodeContainer.appendChild(text2);
        }

        nodeGroup.appendChild(nodeContainer);
    }
}

function updateInfo(step) {
    const totalSteps = data.steps.length - 1;

    panelStep.textContent = `Paso ${currentStep} / ${totalSteps}`;
    panelSubtitle.textContent = `${cityName(data.start)} → ${cityName(data.goal)}`;

    actionText.textContent = step.accion;
    currentNode.textContent = cityName(step.actual);
    totalCost.textContent = data.total_cost ?? "-";

    exploredNodes.textContent = formatNodeList(step.explorados);
    frontierNodes.textContent = formatFrontier(step.frontera);

    const ordered = sortFrontier(step.frontera || []);
    orderedFrontier.textContent = formatFrontier(ordered);

    if (step.camino_final && step.camino_final.length > 0) {
        finalPath.textContent = formatNodeList(step.camino_final);
    } else {
        finalPath.textContent = formatNodeList(data.path);
    }

    stepCounter.textContent = `Paso ${currentStep} / ${totalSteps}`;
    stepRange.value = currentStep;
}

function goToStep(index) {
    if (!data) return;

    if (index < 0) index = 0;
    if (index > data.steps.length - 1) index = data.steps.length - 1;

    currentStep = index;
    const step = data.steps[currentStep];

    drawGraph(step);
    updateInfo(step);
}

function fillSelects() {
    const currentStart = startSelect.value || "arad";
    const currentGoal = goalSelect.value || "bucharest";

    startSelect.innerHTML = "";
    goalSelect.innerHTML = "";

    for (const city of data.cities) {
        const optionStart = document.createElement("option");
        optionStart.value = city;
        optionStart.textContent = cityName(city);

        const optionGoal = document.createElement("option");
        optionGoal.value = city;
        optionGoal.textContent = cityName(city);

        startSelect.appendChild(optionStart);
        goalSelect.appendChild(optionGoal);
    }

    startSelect.value = data.cities.includes(currentStart) ? currentStart : "arad";
    goalSelect.value = data.cities.includes(currentGoal) ? currentGoal : "bucharest";
}

async function loadData() {
    const start = startSelect.value || "arad";
    const goal = goalSelect.value || "bucharest";

    const response = await fetch(`/api/data?start=${start}&goal=${goal}`);
    data = await response.json();

    fillSelects();

    stepRange.min = 0;
    stepRange.max = data.steps.length - 1;
    currentStep = 0;

    goToStep(0);
}

const graphResizeObserver = new ResizeObserver(() => {
    if (data) fitGraphToPanel();
});

graphResizeObserver.observe(svg);

loadData();
