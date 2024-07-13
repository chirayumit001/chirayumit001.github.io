const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const runButton = document.getElementById('runButton');
const resultsDiv = document.getElementById('results');
const keywordInput = document.getElementById('keywordInput');
const progressBar = document.getElementById('progressBar');

const BATCH_SIZE = 100; // Number of files to process in each batch

function handleFiles(files) {
    const keywords = keywordInput.value.toLowerCase().split(',').map(kw => kw.trim());
    const papers_path = new Set();
    const totalFiles = files.length;
    let currentIndex = 0;
    let processedFiles = 0;

    if (totalFiles === 0) {
        alert('Please select a folder containing PDF files.');
        return;
    }

    if (keywords.length === 0 || keywords[0] === '') {
        alert('Please enter at least one keyword.');
        return;
    }

    resultsDiv.innerHTML = 'Searching...';
    progressBar.value = 0;
    progressBar.max = totalFiles;

    function processBatch() {
        const batchFiles = Array.from(files).slice(currentIndex, currentIndex + BATCH_SIZE);
        let processedCount = 0;

        for (const file of batchFiles) {
            if (file.type === 'application/pdf') {
                const fileReader = new FileReader();
                fileReader.onload = async function() {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const text = textContent.items.map(item => item.str).join(' ').toLowerCase();

                        if (keywords.some(keyword => text.includes(keyword))) {
                            papers_path.add(file);
                            break; // Move to the next file if any keyword is found
                        }
                    }

                    processedCount++;
                    processedFiles++;
                    progressBar.value = processedFiles;

                    if (processedCount === batchFiles.length) {
                        currentIndex += BATCH_SIZE;
                        updateResults(papers_path);
                        if (currentIndex < totalFiles) {
                            processBatch(); // Process next batch
                        } else {
                            resultsDiv.innerHTML = 'Search complete.';
                        }
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } else {
                alert('Please ensure the folder contains only PDF files.');
                return;
            }
        }
    }

    processBatch();
}

function updateResults(papers_path) {
    resultsDiv.innerHTML = '';

    if (papers_path.size === 0) {
        resultsDiv.innerHTML = 'No documents contain the specified keywords.';
    } else {
        papers_path.forEach(file => {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.textContent = file.name;
            a.target = '_blank'; // Open in a new tab
            p.appendChild(a);
            resultsDiv.appendChild(p);
        });
    }
}

fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});

runButton.addEventListener('click', () => {
    handleFiles(fileInput.files);
});

dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('hover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('hover');
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('hover');
    const files = event.dataTransfer.files;
    handleFiles(files);
});

keywordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleFiles(fileInput.files);
    }
});
