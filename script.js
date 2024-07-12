const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const anyRunButton = document.getElementById('anyRunButton');
const allRunButton = document.getElementById('allRunButton');
const resultsDiv = document.getElementById('results');
const anyKeywordInput = document.getElementById('anyKeywordInput');
const allKeywordInput = document.getElementById('allKeywordInput');

function handleFiles(files, mode) {
    const anyKeywords = anyKeywordInput.value.toLowerCase().split(',').map(kw => kw.trim());
    const allKeywords = allKeywordInput.value.toLowerCase().split(',').map(kw => kw.trim());
    const papers_path = new Set();

    if (files.length === 0) {
        alert('Please select a folder containing PDF files.');
        return;
    }

    const keywords = mode === 'any' ? anyKeywords : allKeywords;
    if (keywords.length === 0 || keywords[0] === '') {
        alert('Please enter at least one keyword.');
        return;
    }

    resultsDiv.innerHTML = 'Searching...';

    for (const file of files) {
        if (file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = async function() {
                const typedarray = new Uint8Array(this.result);

                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const text = textContent.items.map(item => item.str).join(' ').toLowerCase();

                    let matchFound = false;
                    if (mode === 'any') {
                        matchFound = keywords.some(keyword => text.includes(keyword));
                    } else if (mode === 'all') {
                        matchFound = keywords.every(keyword => text.includes(keyword));
                    }

                    if (matchFound) {
                        papers_path.add(file);
                        break; // Move to the next file if any/all keywords are found
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

anyRunButton.addEventListener('click', () => {
    handleFiles(fileInput.files, 'any');
});

allRunButton.addEventListener('click', () => {
    handleFiles(fileInput.files, 'all');
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
