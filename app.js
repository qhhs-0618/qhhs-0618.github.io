document.addEventListener('DOMContentLoaded', () => {
    // 初始化状态
    let currentApp = null;
    let isDrawing = false;
    let isDraggingToolbar = false;
    let currentColor = '#000000';
    let currentTool = 'drag';
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    
    // 手动维护的GGB文件列表
    const ggbFiles = [
        '花朵.ggb',
        '蝴蝶.ggb',
        '回环.ggb'
    ];

    // 初始化文件列表
    const fileList = document.getElementById('file-list');
    ggbFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.textContent = file.replace('.ggb', '');
        item.onclick = () => loadGGB(file);
        fileList.appendChild(item);
    });

    // 加载GGB文件
    window.loadGGB = (filename) => {
        document.getElementById('file-selector').classList.add('hidden');
        document.getElementById('ggb-container').classList.remove('hidden');
        document.getElementById('toolbar').classList.remove('hidden');

        currentApp = new GGBApplet({
            "filename": `ggb/${filename}`,
            "width": window.innerWidth,
            "height": window.innerHeight,
            "showMenuBar": false,
            "showToolBar": false,
            "enableShiftDragZoom": false
        }, true);
        currentApp.inject('ggb-container');
        initCanvas();
    };

    // 初始化画布
    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    // 工具栏拖动逻辑
    const toolbar = document.getElementById('toolbar');
    let startX, startY, initialX, initialY;

    toolbar.querySelector('.drag-handle').addEventListener('mousedown', (e) => {
        isDraggingToolbar = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = toolbar.offsetLeft;
        initialY = toolbar.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingToolbar) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newX = initialX + dx;
        let newY = initialY + dy;
        
        // 限制在窗口范围内
        newX = Math.max(0, Math.min(window.innerWidth - toolbar.offsetWidth, newX));
        newY = Math.max(0, Math.min(window.innerHeight - toolbar.offsetHeight, newY));
        
        toolbar.style.left = `${newX}px`;
        toolbar.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDraggingToolbar = false;
    });

    document.querySelector('[data-tool="geogebra"]').addEventListener('click', () => {
        window.location.href = 'GeoGebra/HTML5/5.0/GeoGebra.html';
    });

    // 绘图功能
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseout', endDrawing);

    function startDrawing(e) {
        if (currentTool !== 'draw' && currentTool !== 'erase') return;
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!isDrawing) return;
        ctx.strokeStyle = currentTool === 'draw' ? currentColor : '#ffffff';
        ctx.lineWidth = currentTool === 'draw' ? 4 : 20;
        ctx.globalCompositeOperation = currentTool === 'draw' ? 'source-over' : 'destination-out';

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function endDrawing() {
        ctx.closePath();
        isDrawing = false;
    }

    // 颜色选择
    const colorPalette = document.querySelector('.color-palette');
    document.querySelector('[data-tool="draw"]').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        colorPalette.style.display = 'flex';
        colorPalette.style.left = `${e.pageX}px`;
        colorPalette.style.top = `${e.pageY}px`;
    });

    document.querySelectorAll('.color-item').forEach(color => {
        color.addEventListener('click', (e) => {
            currentColor = e.target.style.backgroundColor;
            colorPalette.style.display = 'none';
        });
    });

    // 工具切换
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTool = this.dataset.tool;
            
            // 更新光标样式
            document.body.style.cursor = 
                currentTool === 'draw' ? 'crosshair' :
                currentTool === 'erase' ? 'cell' : 'default';
        });
    });

    // 全屏功能
    document.querySelector('[data-tool="fullscreen"]').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // 窗口调整
    window.addEventListener('resize', () => {
        initCanvas();
        if (currentApp) {
            currentApp.setSize(window.innerWidth, window.innerHeight);
        }
    });

    // 关闭颜色选择器
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-palette') && !e.target.closest('[data-tool="draw"]')) {
            colorPalette.style.display = 'none';
        }
    });
});