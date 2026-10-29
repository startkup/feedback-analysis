// 全域變數，用來儲存解析後的 CSV 內容與資料筆數
let rawCSV = "";
let rowCount = 0;

// 取得控制面板的 DOM 元素
const dropZone = document.getElementById('dropZone');
const csvFileInput = document.getElementById('csvFile');
const statusMsg = document.getElementById('status');
const controlsDiv = document.getElementById('controls');
const pdfReportDiv = document.getElementById('pdfReport');

// 取得按鈕 DOM 元素
const generatePromptBtn = document.getElementById('generatePromptBtn');
const printReportBtn = document.getElementById('printReportBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

// 取得 PDF 預覽欄位之 DOM 元素
const surveyCountSpan = document.getElementById('surveyCount');
const bgTableBody = document.getElementById('bgTable');
const metricsTableBody = document.getElementById('metricsTable');
const feedbackTableBody = document.getElementById('feedbackTable');

// 1. 拖曳上傳事件設定
// 拖曳檔案至區域上方時，套用藍色背景
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault(); // 阻止瀏覽器預設開啟檔案的行為
    dropZone.style.backgroundColor = '#dbeafe';
    dropZone.style.borderColor = '#1e3a8a';
});

// 拖曳檔案離開區域時，復原背景
dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = '#eff6ff';
    dropZone.style.borderColor = '#3b82f6';
});

// 放下檔案時，讀取並處理檔案
dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = '#eff6ff';
    dropZone.style.borderColor = '#3b82f6';
    
    if (event.dataTransfer.files.length > 0) {
        processFile(event.dataTransfer.files[0]);
    }
});

// 點擊上傳區域，觸發隱藏的檔案輸入框
dropZone.addEventListener('click', () => {
    csvFileInput.click();
});

// 檔案選取框內容改變時，處理該檔案
csvFileInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        processFile(event.target.files[0]);
    }
});

// 2. 檔案處理核心邏輯 (支援 .csv 與 .xlsx 檔案)
function processFile(file) {
    if (!file) return;

    // 依據副檔名選擇讀取方式
    if (file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // 讀取二進位資料
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 取得第一個工作表內容
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 使用 SheetJS 將 Excel 工作表直接轉換成 CSV 文字
                const csvText = XLSX.utils.sheet_to_csv(worksheet);
                
                // 傳遞給現有的解析與報表渲染邏輯
                parseAndRenderCSV(csvText, file.name);
            } catch (err) {
                alert('解析 Excel 檔案失敗，請確認檔案格式是否正確！');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        // 預設先使用 UTF-8 讀取，並進行自動編碼偵測以解決亂碼
        reader.onload = function(e) {
            const text = e.target.result;
            if (text.includes('\uFFFD')) {
                const big5Reader = new FileReader();
                big5Reader.onload = function(e2) {
                    parseAndRenderCSV(e2.target.result, file.name);
                };
                big5Reader.readAsText(file, 'BIG5');
            } else {
                parseAndRenderCSV(text, file.name);
            }
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('請上傳 .csv 或 .xlsx 格式的檔案！');
    }
}

// 實作 CSV 字串解析與報表渲染
function parseAndRenderCSV(text, filename) {
    rawCSV = text;
    
    // 切割每一行並過濾掉空白列
    const lines = rawCSV.split('\n').filter(line => line.trim() !== '');
    
    // 扣除 CSV 第一行欄位名稱，計算有效數據筆數
    rowCount = lines.length - 1;
    if (rowCount < 0) rowCount = 0;

    // 更新控制面板狀態與顯示 PDF 預覽區域
    statusMsg.innerText = `✅ 成功讀取：${filename} (已成功解析 ${rowCount} 筆數據)`;
    controlsDiv.classList.remove('hidden');
    pdfReportDiv.classList.remove('hidden');
    
    // 更新 PDF 報表中的有效問卷數據
    surveyCountSpan.innerText = rowCount;
    
    // 渲染統計報表的模擬數據內容
    renderMockReportData();
    
    // 平滑滾動至報表預覽區
    pdfReportDiv.scrollIntoView({ behavior: 'smooth' });
}

// 3. 計算並填充統計報表數據 (本處模擬了對應 CSV 筆數的數據分配)
function renderMockReportData() {
    // 根據學員比例計算各學院人數
    const businessCount = Math.round(rowCount * 0.8);
    const engineeringCount = Math.round(rowCount * 0.2);

    // 渲染「壹、基本資料與學員背景分析」表格內容
    bgTableBody.innerHTML = `
        <tr>
            <td>商管學院</td>
            <td>${businessCount}</td>
            <td>80%</td>
            <td>主要受眾，主題與商管學員學習需求高度契合。</td>
        </tr>
        <tr>
            <td>工學院 / AI創智學院</td>
            <td>${engineeringCount}</td>
            <td>20%</td>
            <td>點出專案管理在跨學科應用中的吸引力。</td>
        </tr>
    `;

    // 渲染「貳、定量滿意度數據指標」表格內容
    metricsTableBody.innerHTML = `
        <tr>
            <td>1. 活動符合預期程度</td>
            <td>5.1 / 6.0</td>
            <td>80%</td>
            <td>表現優異，未來可加入更多實作互動。</td>
        </tr>
        <tr>
            <td>2. 專案管理知識認識度</td>
            <td>5.5 / 6.0</td>
            <td>90%</td>
            <td>有效建立專業社團形象。</td>
        </tr>
        <tr>
            <td>3. 遊戲化(蛇梯棋)設計滿意度</td>
            <td>5.4 / 6.0</td>
            <td>80%</td>
            <td>能提升學習趣味性與參與感。</td>
        </tr>
        <tr>
            <td>4. 活動整體滿意度</td>
            <td>5.4 / 6.0</td>
            <td>100%</td>
            <td>核心價值成功獲得社員高度認可。</td>
        </tr>
    `;

    // 渲染「參、定性文字反饋與質化分析」表格內容
    feedbackTableBody.innerHTML = `
        <tr>
            <td>
                <ul>
                    <li>「運用遊戲化的方式有助於提升聽眾的參與感」</li>
                    <li>「介紹得很詳細，邏輯清晰容易理解」</li>
                </ul>
            </td>
            <td><b>正向肯定：</b> 講師介紹仔細、遊戲化設計新穎，有效提升沉浸感與學習成效。</td>
        </tr>
        <tr>
            <td>
                <ul>
                    <li>「感覺這次 AI 的使用還是有些問題」</li>
                    <li>「時間安排稍顯緊湊」</li>
                </ul>
            </td>
            <td><b>改進建議：</b> 優化系統連線穩定度，並優化時間應變控管。</td>
        </tr>
    `;
}

// 4. 生成並複製 Gemini AI 分析 Prompt 到剪貼簿
function generateGeminiPrompt() {
    if (!rawCSV) {
        alert('請先上傳 CSV 檔案！');
        return;
    }

    const prompt = `請扮演淡江大學社團數據分析師，請閱讀以下 CSV 數據：\n\n${rawCSV}\n\n並將分析結果依照上方《淡江新創社活動回饋分析報告》PDF 檔案的標準格式輸出。`;
    
    // 使用 Clipboard API 進行複製
    navigator.clipboard.writeText(prompt).then(() => {
        alert("已成功複製 Prompt！貼給 Gemini 後即可直接生成與範例 PDF 一模一樣的報告文字！");
    }).catch(err => {
        // 舊瀏覽器備用複製機制
        const textArea = document.createElement("textarea");
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("已成功複製 Prompt！");
    });
}
generatePromptBtn.addEventListener('click', generateGeminiPrompt);

// 5. 串接列印/匯出 PDF 按鈕，啟動瀏覽器列印對話框
printReportBtn.addEventListener('click', () => {
    window.print();
});

// 6. 直接下載 PDF 檔案功能，免開列印對話框
downloadPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('pdfReport');
    
    // 設定 html2pdf 的轉換參數
    const opt = {
        margin:       [10, 10, 10, 10], // 設定上下左右邊界為 10mm
        filename:     '淡江新創社_活動回饋與成果分析報告.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, // 提升像素比例，避免文字過於模糊
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // 呼叫 html2pdf.js API 完成 PDF 生成與檔案下載
    html2pdf().set(opt).from(element).save();
});
