// Start from top face, in row order then column order.
// then left, then front, then right, then bottom.
// e.g. g,gbr,rbrbg;...
const render4 = (canvas_id, color_string) => {
    const canvas = document.getElementById(canvas_id);
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    const side = 50; // Side length of each face
    const levels = 4; // Divide each face into 4 layers
    const smallSide = side / levels; // Side length of small cubies

    const centerX = canvas.width * 3 / 8;
    const centerY = canvas.height * 1 / 2;

    const colorMap = {
        'o': 'orange', // Orange
        'r': '#ff0000', // Red
        'b': '#0000ff', // Blue
        'g': '#00ff00', // Green
        'y': '#ffff00', // Yellow
        'w': '#ffffff', // White
        ' ': '#a9a9a9'  // Dark Grey
    };

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";

    function parseColorString(color_string) {
        const colors = [];
        const rows = color_string.split(';');
        for (let f = 0; f < 5; f++) {
            const face = rows[f].split(',');
            const faceColors = [];
            for (let j = 0; j < 4; j++) {
                const rowColors = face[j].split('');
                faceColors.push(rowColors);
            }
            colors.push(faceColors);
        }
        return colors;
    }

    // Utility function to draw a parallel given four points and color
    function drawParallel(p1, p2, p3, p4, color) {
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.closePath();
        ctx.fillStyle = colorMap[color];
        ctx.fill();
        ctx.stroke();
    }

    // Convert grid coordinates to canvas coordinates for small triangles
    function gridToCanvas(i, j) {
        const x = centerX + (j - i / 2) * smallSide * 3;
        const y = centerY - i * (Math.sqrt(3) / 2) * smallSide;
        return [x, y];
    }

    // Rotate points to fit the 120-degree triangle sections
    function rotatePoint([x, y], angle) {
        const dx = x - centerX;
        const dy = y - centerY;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = dx * cos - dy * sin + centerX;
        const ry = dx * sin + dy * cos + centerY;
        return [rx, ry];
    }

    function draw4(color_string) {
        const colors = parseColorString(color_string);
        const dx = [-2 * smallSide, -6 * smallSide, -2 * smallSide, 2 * smallSide, -2 * smallSide];
        const dy = [-6 * smallSide, -2 * smallSide, -2 * smallSide, -2 * smallSide, 2 * smallSide];

        for (let face = 0; face < 5; face++) {
            for (let row = 0; row < levels; row++) {
                for (let col = 0; col < levels; col++) {
                    let baseX = centerX + col * smallSide + dx[face];
                    let baseY = centerY + row * smallSide + dy[face];
                    const p1 = [baseX, baseY];
                    const p2 = [baseX + smallSide, baseY];
                    const p3 = [baseX + smallSide, baseY + smallSide];
                    const p4 = [baseX, baseY + smallSide];
                    drawParallel(p1, p2, p3, p4, colors[face][row][col]);
                }
            }
        }
    }

    draw4(color_string);
};

// https://www.cuberoot.me/5x5-yau-l2e/
// First specify the front face, then left face edge from top to bottom,
// then right face edge from top to bottom, then bottom face edge from left to right.
render5_l2e = (canvas_id, color_string) => {
    const canvas = document.getElementById(canvas_id);
    canvas.width = 220;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    const side = 120; // Side length of each face
    const levels = 5; // Divide each face into 5 layers
    const smallSide = side / levels; // Side length of small cubies

    const centerX = canvas.width * 3 / 8;
    const centerY = canvas.height * 1 / 2;

    const colorMap = {
        'o': 'orange', // Orange
        'r': '#ff0000', // Red
        'b': '#0000ff', // Blue
        'g': '#00ff00', // Green
        'y': '#ffff00', // Yellow
        'w': '#ffffff', // White
        ' ': '#a9a9a9'  // Dark Grey
    };

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";

    function parseColorString(color_string) {
        const colors = [];
        const rows = color_string.split(';');
        const face = rows[0].split(',');
        const faceColors = [];
        for (let j = 0; j < 5; j++) {
            const rowColors = face[j].split('');
            faceColors.push(rowColors);
        }
        colors.push(faceColors);
        const edges = rows[1].split(',');
        for (let i = 0; i < 3; i++) {
            const edgeColors = [];
            for (let j = 0; j < 3; j++) {
                edgeColors.push(edges[i][j]);
            }
            colors.push(edgeColors);
        }
        console.log(colors);
        return colors;
    }

    // Utility function to draw a parallel given four points and color
    function drawParallel(p1, p2, p3, p4, color) {
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.closePath();
        ctx.fillStyle = colorMap[color];
        ctx.fill();
        ctx.stroke();
    }

    function draw5_l2e(color_string) {
        const colors = parseColorString(color_string);
        const dx = [-2 * smallSide];
        const dy = [-2 * smallSide];

        for (let row = 0; row < levels; row++) {
            for (let col = 0; col < levels; col++) {
                let baseX = centerX + col * smallSide + dx[0];
                let baseY = centerY + row * smallSide + dy[0];
                const p1 = [baseX, baseY];
                const p2 = [baseX + smallSide, baseY];
                const p3 = [baseX + smallSide, baseY + smallSide];
                const p4 = [baseX, baseY + smallSide];
                drawParallel(p1, p2, p3, p4, colors[0][row][col]);
            }
        }

        const edgeDx = [-3 * smallSide, 3 * smallSide, -1 * smallSide];
        const edgeDy = [-1 * smallSide, -1 * smallSide, 3 * smallSide];
        for (let edge = 0; edge < 3; edge++) {
            for (let col = 0; col < 3; col++) {
                let baseX = centerX + edgeDx[edge] + (edge < 2 ? 0 : col) * smallSide;
                let baseY = centerY + (edge < 2 ? col : 0) * smallSide + edgeDy[edge];
                const p1 = [baseX, baseY];
                const p2 = [baseX + smallSide, baseY];
                const p3 = [baseX + smallSide, baseY + smallSide];
                const p4 = [baseX, baseY + smallSide];
                drawParallel(p1, p2, p3, p4, colors[1 + edge][col]);
            }
        }
    }

    draw5_l2e(color_string);
};

// 6x6 Last Two Centers: two 4x4 center blocks side by side.
// Input: "U row1,U row2,U row3,U row4;F row1,F row2,F row3,F row4"
// Each row is 4 chars, e.g. "wwww,wwwg,wwwg,wwwg;gggw,gggw,gggw,gggg".
// Layout: left = U center (top row = back, bottom row = front edge that
// touches F), right = F center (top row = up edge that touches U).
// Same flat style + colorMap as render5_l2e, so it reads as one family.
render6_l2c = (canvas_id, color_string) => {
    const canvas = document.getElementById(canvas_id);
    canvas.width = 300;
    canvas.height = 170;
    const ctx = canvas.getContext("2d");
    const cell = 28;
    const gap = 28;
    const x0 = 16;
    const y0 = 28;
    const colorMap = {
        'o': 'orange',
        'r': '#ff0000',
        'b': '#0000ff',
        'g': '#00cc44',
        'y': '#ffff00',
        'w': '#ffffff',
        ' ': '#a9a9a9'
    };
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";
    ctx.fillStyle = "#222";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    const parts = color_string.split(';');
    const parseFace = (s) => s.split(',').map((row) => row.split(''));
    const faces = [parseFace(parts[0]), parseFace(parts[1])];
    const labels = ['U', 'F'];
    for (let f = 0; f < 2; f++) {
        const ox = x0 + f * (4 * cell + gap);
        ctx.fillText(labels[f], ox + 2 * cell, 18);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const ch = (faces[f][row] && faces[f][row][col]) || ' ';
                ctx.beginPath();
                ctx.rect(ox + col * cell, y0 + row * cell, cell, cell);
                ctx.fillStyle = colorMap[ch] || '#a9a9a9';
                ctx.fill();
                ctx.stroke();
            }
        }
    }
    // Interface hint: U bottom edge touches F top edge.
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText("U 底边 = F 顶边", x0 + (4 * cell + gap / 2), y0 + 4 * cell + 18);
};

// 6x6 center orbits: one 4x4 grid labelled by piece type.
// C = corner-center (4), E = edge-center (8), I = inner 2x2 (4).
// Same geometry as render6_l2c so the two diagrams line up visually.
render6_orbit = (canvas_id) => {
    const canvas = document.getElementById(canvas_id);
    canvas.width = 170;
    canvas.height = 165;
    const ctx = canvas.getContext("2d");
    const cell = 30;
    const x0 = 20;
    const y0 = 20;
    const grid = [
        ['C', 'E', 'E', 'C'],
        ['E', 'I', 'I', 'E'],
        ['E', 'I', 'I', 'E'],
        ['C', 'E', 'E', 'C'],
    ];
    const bg = { 'C': '#ffe08a', 'E': '#a8d8ff', 'I': '#b8f0b8' };
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const t = grid[row][col];
            ctx.beginPath();
            ctx.rect(x0 + col * cell, y0 + row * cell, cell, cell);
            ctx.fillStyle = bg[t];
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#222";
            ctx.fillText(t, x0 + col * cell + cell / 2, y0 + row * cell + cell / 2 + 1);
        }
    }
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText("C 角 ×4  E 边 ×8  I 内 ×4", x0 + 2 * cell, y0 + 4 * cell + 14);
};