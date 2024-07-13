const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const runButton = document.getElementById('runButton');
const resultsDiv = document.getElementById('results');
const keywordInput = document.getElementById('keywordInput');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progressBar');

async function handleFiles(files) {
    const keywords = keywordInput.value.toLowerCase().split(',').map(kw => kw.trim());
    const papers_path = new Set();

    if (files.length === 0) {
        alert('Please select a folder containing PDF files.');
        return;
    }

    if (files.length > 150) {
        alert('Please upload a maximum of 150 files at a time.');
        return;
    }

    if (keywords.length === 0 || keywords[0] === '') {
        alert('Please enter at least one keyword.');
        return;
    }

    resultsDiv.innerHTML = '';
    loader.classList.remove('hidden'); // Show loader
    progressBar.style.width = '0%'; // Reset progress bar

    const totalFiles = files.length;
    let processedFiles = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'application/pdf') {
            const foundAllKeywords = await processFile(file, keywords, papers_path);
            processedFiles++;
            const progress = (processedFiles / totalFiles) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`; // Update progress text

            // Force garbage collection (if supported)
            if (window.gc) {
                window.gc();
            }

            if (foundAllKeywords) {
                addResult(file); // Add result dynamically
            }
        } else {
            alert('Please ensure the folder contains only PDF files.');
            return;
        }
    }

    loader.classList.add('hidden'); // Hide loader when done

    if (papers_path.size === 0) {
        resultsDiv.innerHTML = 'No documents contain all the specified keywords.';
    }
}

async function processFile(file, keywords, papers_path) {
    return new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);

            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let foundAllKeywords = true;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ').toLowerCase();

                if (!keywords.every(keyword => text.includes(keyword))) {
                    foundAllKeywords = false;
                    break;
                }
            }

            if (foundAllKeywords) {
                papers_path.add(file);
            }
            resolve(foundAllKeywords);
        };
        fileReader.readAsArrayBuffer(file);
    });
}

function addResult(file) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.textContent = `${file.name}`;
    a.target = '_blank'; // Open in a new tab
    p.appendChild(a);
    resultsDiv.appendChild(p);
}

fileInput.addEventListener('change', (event) => {
    if (event.target.files.length > 150) {
        alert('Please upload a maximum of 150 files at a time.');
        fileInput.value = ''; // Clear input field
    } else {
        handleFiles(event.target.files);
    }
});

runButton.addEventListener('click', () => {
    if (fileInput.files.length > 150) {
        alert('Please upload a maximum of 150 files at a time.');
        fileInput.value = ''; // Clear input field
    } else {
        handleFiles(fileInput.files);
    }
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
    if (files.length > 150) {
        alert('Please upload a maximum of 150 files at a time.');
    } else {
        handleFiles(files);
    }
});

keywordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        if (fileInput.files.length > 150) {
            alert('Please upload a maximum of 150 files at a time.');
            fileInput.value = ''; // Clear input field
        } else {
            handleFiles(fileInput.files);
        }
    }
});
