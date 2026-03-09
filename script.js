let chartClsInstance = null;
let chartDetInstance = null;

const paperData = {
    'small': {
        classification: {
            labels: ['VMamba-S', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [83.7, 23.3, 80.0, 18.5, 78.7],
            stats: { acc: '80.0%', gain: '+56.7%', fps: '1.4x' }
        },
        detection: {
            labels: ['VMamba-S', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [48.7, 2.8, 44.2, 3.6, 44.7]
        }
    },
    'base': {
        classification: {
            labels: ['VMamba-B', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [83.9, 19.7, 80.9, 19.2, 79.7],
            stats: { acc: '80.9%', gain: '+61.2%', fps: '1.6x' }
        },
        detection: {
            labels: ['VMamba-B', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [49.2, 2.8, 45.7, 3.7, 46.2]
        }
    },
    'l2': {
        classification: {
            labels: ['PlainMamba-L2', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [81.6, 76.7, 80.6, 76.6, 80.5],
            stats: { acc: '80.6%', gain: '+3.9%', fps: '1.3x' }
        },
        detection: {
            labels: ['PlainMamba-L2', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [46.0, 33.7, 40.7, 34.9, 39.1]
        }
    },
    'l3': {
        classification: {
            labels: ['PlainMamba-L3', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [82.2, 76.1, 80.9, 75.2, 80.1],
            stats: { acc: '80.9%', gain: '+4.8%', fps: '1.5x' }
        },
        detection: {
            labels: ['PlainMamba-L3', 'ToMe', 'STORM (ToMe)', 'EViT', 'STORM (EViT)'],
            data: [46.8, 35.4, 40.8, 36.4, 39.4]
        }
    }
};

/**
 * 核心修正：封装一个通用的图表创建函数，支持多色图例
 */
function createBarChart(ctx, labels, data, title) {
    // 将数据拆分为三个系列，以便显示红/蓝/灰三个图例
    // 索引说明: 0(Base-Gray), 1(Baseline-Red), 2(STORM-Blue), 3(Baseline-Red), 4(STORM-Blue)
    const baseData = [data[0], null, null, null, null];
    const baselineData = [null, data[1], null, data[3], null];
    const stormData = [null, null, data[2], null, data[4]];

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Original Model',
                    data: baseData,
                    backgroundColor: '#94a3b8',
                    borderRadius: 6
                },
                {
                    label: 'Baseline (ToMe/EViT)',
                    data: baselineData,
                    backgroundColor: '#f87171',
                    borderRadius: 6
                },
                {
                    label: 'STORM (Ours)',
                    data: stormData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true }, // 堆叠模式确保空位不占用宽度
                y: { beginAtZero: true }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function initCharts(modelType) {
    const ctxCls = document.getElementById('chartClassification').getContext('2d');
    const ctxDet = document.getElementById('chartDetection').getContext('2d');
    const dataObj = paperData[modelType];

    if (chartClsInstance) chartClsInstance.destroy();
    if (chartDetInstance) chartDetInstance.destroy();

    chartClsInstance = createBarChart(ctxCls, dataObj.classification.labels, dataObj.classification.data, 'Top-1 Accuracy (%)');
    chartDetInstance = createBarChart(ctxDet, dataObj.detection.labels, dataObj.detection.data, 'Box AP');

    document.getElementById('stat-acc').innerText = dataObj.classification.stats.acc;
    document.getElementById('stat-gain').innerText = dataObj.classification.stats.gain;
    document.getElementById('stat-fps').innerText = dataObj.classification.stats.fps;
}

// 修正后的 switchTab，合并了所有逻辑，避免重复定义
function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('block');
    });

    buttons.forEach(btn => {
        btn.classList.remove('text-blue-700', 'bg-blue-50', 'active');
        btn.classList.add('text-gray-500');
    });

    const selectedContent = document.getElementById(`${tabId}-content`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('block');
    }

    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${tabId}'`)) {
            btn.classList.remove('text-gray-500');
            btn.classList.add('text-blue-700', 'bg-blue-50', 'active');
        }
    });

    if (tabId === 'robustness') {
        setTimeout(initParetoChart, 50);
    }
}

// 修正后的 switchResults，添加了对 e (event) 的兼容处理
function switchResults(modelType, e) {
    const btns = document.querySelectorAll('.result-btn');
    btns.forEach(btn => {
        btn.classList.remove('active', 'text-blue-700', 'bg-white', 'shadow-sm');
        btn.classList.add('text-gray-500');
    });
    
    // 兼容写法：如果传入了 event 则使用 event.currentTarget，否则通过 modelType 匹配
    let target = e ? e.currentTarget : null;
    if (!target) {
        btns.forEach(btn => {
            if (btn.getAttribute('onclick').includes(`'${modelType}'`)) target = btn;
        });
    }

    if (target) {
        target.classList.add('active', 'text-blue-700', 'bg-white', 'shadow-sm');
        target.classList.remove('text-gray-500');
    }
    
    initCharts(modelType);
}

window.onload = () => initCharts('small');

let chartParetoInstance = null;

const vMambaBData = {
    ratios: ['0.0%', '12.0%', '17.9%', '23.1%', '28.9%', '36.3%'],
    tomeAcc: [83.9, 55.3, 35.7, 25.1, 19.7, 14.3],
    stormAcc: [83.9, 83.3, 82.6, 82.0, 80.9, 78.1],
    tomeThroughput: [542, 602, 680, 755, 807, 935],
    stormThroughput: [542, 593, 673, 761, 839, 961]
};

function initParetoChart() {
    const ctx = document.getElementById('chartPareto').getContext('2d');
    if (chartParetoInstance) chartParetoInstance.destroy();

    chartParetoInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: vMambaBData.ratios,
            datasets: [
                {
                    label: 'STORM (ToMe)',
                    data: vMambaBData.stormAcc,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb',
                    tension: 0.2,
                    fill: true
                },
                {
                    label: 'Standard ToMe',
                    data: vMambaBData.tomeAcc,
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444',
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { title: { display: true, text: 'Top-1 Accuracy (%)' }, min: 0, max: 90 },
                x: { title: { display: true, text: 'Reduction Ratio (%)' } }
            }
        }
    });
}