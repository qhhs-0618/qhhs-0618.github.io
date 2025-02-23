document.addEventListener('DOMContentLoaded', () => {
    // 初始化状态
    let currentApp = null;
    let isDrawing = false;
    let isDraggingToolbar = false;
    let currentColor = '#000000';
    let currentTool = 'default';
    const cursorPreview = document.getElementById('cursor-preview');
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
            "showMenuBar": true,
            "showToolBar": true,
            "enableShiftDragZoom": true
        }, true);
        currentApp.inject('ggb-container');
        initCanvas();
    };

    // 初始化画布
    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.touchAction = 'none';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function setActiveTool(tool) {
        currentTool = tool === currentTool ? null : tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === currentTool);
        });
        
        // 更新光标预览
        cursorPreview.style.display = currentTool ? 'block' : 'none';
        if (currentTool === 'draw') {
            cursorPreview.style.backgroundColor = currentColor;
            cursorPreview.style.borderRadius = '50%';
            cursorPreview.style.width = '4px';
            cursorPreview.style.height = '4px';
        } else if (currentTool === 'erase') {
            cursorPreview.style.backgroundColor = '#fff';
            cursorPreview.style.borderRadius = '4px';
            cursorPreview.style.width = '20px';
            cursorPreview.style.height = '20px';
        }
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
    toolbar.querySelector('.drag-handle').addEventListener('touchstart', (e) => {
        isDraggingToolbar = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
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
    document.addEventListener('touchmove', (e) => {
        if (!isDraggingToolbar) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
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
    document.addEventListener('touchend', () => {
        isDraggingToolbar = false;
    });

    document.querySelector('[data-tool="geogebra"]').addEventListener('click', () => {
        window.location.href = 'GeoGebra/HTML5/5.0/GeoGebra.html';
    });

    // 绘图功能
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        startDrawing({
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
    });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        draw({
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
    });
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('touchend', endDrawing);
    // canvas.addEventListener('mouseout', endDrawing);
    document.addEventListener('mousemove', updateCursorPreview);

    function getCanvasPosition(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function startDrawing(e) {
        if (currentTool !== 'draw' && currentTool !== 'erase') return;
        isDrawing = true;
        const pos = getCanvasPosition(e);
        [lastX, lastY] = [e.offsetX, e.offsetY];
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        // 设置绘图参数
        if (currentTool === 'draw') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 4;
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = 20;
        }
    }

    function draw(e) {
        if (!isDrawing || !currentTool) return;
        // 获取精确坐标（兼容触摸事件）
        let x, y;
        if (e.touches) {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        ctx.strokeStyle = currentTool === 'draw' ? currentColor : '#ffffff';
        ctx.lineWidth = currentTool === 'draw' ? 4 : 20;
        ctx.globalCompositeOperation = currentTool === 'draw' ? 'source-over' : 'destination-out';

        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    function endDrawing() {
        if (isDrawing) {
            ctx.closePath();
            isDrawing = false;
        }
    }

    function updateCursorPreview(e) {
        if (!currentTool) return;
        cursorPreview.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }

    // 颜色选择
    const colorPalette = document.querySelector('.color-palette');
    let longPressTimer;
    document.querySelector('[data-tool="draw"]').addEventListener('touchstart', (e) => {
        e.preventDefault();
        longPressTimer = setTimeout(() => {
            const touch = e.touches[0];
            colorPalette.style.display = 'flex';
            colorPalette.style.left = `${touch.pageX}px`;
            colorPalette.style.top = `${touch.pageY}px`;
        }, 500);
    });
    document.querySelector('[data-tool="draw"]').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        colorPalette.style.display = 'flex';
        colorPalette.style.left = `${e.offsetX}px`;
        colorPalette.style.top = `${e.offsetY}px`;
    });
    document.querySelector('[data-tool="draw"]').addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    document.querySelectorAll('.color-item').forEach(color => {
        color.addEventListener('click', (e) => {
            currentColor = e.target.style.backgroundColor;
            cursorPreview.style.backgroundColor = currentColor;
            colorPalette.style.display = 'none';
        });
    });

    // 工具切换
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTool = this.dataset.tool;
            if (currentTool == 'default') {
                canvas.style.pointerEvents = 'none';
            } else {
                canvas.style.pointerEvents = 'auto';
            }
            
            // 更新光标样式
            document.body.style.cursor = 
                currentTool === 'draw' ? 'crosshair' :
                currentTool === 'erase' ? 'cell' : 'default';
        });
    });

    // 全屏功能
    document.querySelector('[data-tool="fullscreen"]').addEventListener('click', () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        ctx.putImageData(imageData, canvas.width, canvas.height);
    });

    // 关闭颜色选择器
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-palette') && !e.target.closest('[data-tool="draw"]')) {
            colorPalette.style.display = 'none';
        }
    });
    initCanvas();
    canvas.style.pointerEvents = 'none';
});