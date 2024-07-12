const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const runButton = document.getElementById('runButton');
const resultsDiv = document.getElementById('results');
const keywordInput = document.getElementById('keywordInput');

const BATCH_SIZE = 50;

function handleFiles(files) {
    const keywords = keywordInput.value.toLowerCase().split(',').map(kw => kw.trim());
    const papers_path = new Set();
    const fileArray = Array.from(files);

    if (fileArray.length === 0) {
        alert('Please select a folder containing PDF files.');
        return;
    }

    if (keywords.length === 0 || keywords[0] === '') {
        alert('Please enter at least one keyword.');
        return;
    }

    resultsDiv.innerHTML = 'Searching...';

    const processBatch = async (batch) => {
        for (const file of batch) {
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
                            papers_path.add(file.name);
                            break; // Move to the next file if any keyword is found
                        }
                    }

                    updateResults(papers_path);
                };
                fileReader.readAsArrayBuffer(file);
            } else {
                alert('Please ensure the folder contains only PDF files.');
                return;
            }
        }
    };

    const batches = [];
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        batches.push(fileArray.slice(i, i + BATCH_SIZE));
    }

    const processBatches = async () => {
        for (const batch of batches) {
            await processBatch(batch);
        }
    };

    processBatches();
}

function updateResults(papers_path) {
    resultsDiv.innerHTML = '';

    if (papers_path.size === 0) {
        resultsDiv.innerHTML = 'No documents contain the specified keywords.';
    } else {
        papers_path.forEach(file => {
            const p = document.createElement('p');
            p.textContent = file;
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
