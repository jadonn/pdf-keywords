<script>
    let searchTerm;
    let pdfUpload;
    const workerLimit = 3;
    let workerCount = 0;
    let dispatchedFilesCount = 0;
    let processedFilesCount = 0;
    let processedFilesData = [];
    let matchingFiles = [];

function startProcessing(){
    console.log("Starting Processing");
    startWorker();
    setTimeout(startWorker, 1000);
}

function startWorker() {
    if(pdfUpload.files !== undefined && dispatchedFilesCount !== pdfUpload.files.length && workerCount < workerLimit) {
        console.log("Creating new worker");
        const newWorker = new Worker("worker.js");
        newWorker.onmessage = function(e) {
            const data = e.data;
            if(data.fileName !== undefined){
                processedFilesData.push(data);
                const matches = data.matches;
                if(matches !== undefined && matches.length !== 0) {
                    matchingFiles.push(data);
                    matchingFiles = matchingFiles;
                }
                processedFilesCount += 1;
                newWorker.terminate();
                workerCount -= 1;
                console.log(workerCount);
            }
        }
        newWorker.onerror = function(e) {
            console.error(e);
            newWorker.terminate();
            workerCount -= 1;
        }
        newWorker.postMessage({currentFile: pdfUpload.files[dispatchedFilesCount], searchTerm: searchTerm});
        dispatchedFilesCount += 1;
        workerCount += 1;
    }

    if(pdfUpload.files !== undefined && dispatchedFilesCount !== pdfUpload.files.length) {
        setTimeout(startWorker, 1000);
    }
}

function processFiles() {
    const fileList = pdfUpload.files;
    console.log(fileList);
    for (let index = 0; index < fileList.length; index++) {
        const currentFile = fileList[index];
        const reader = new FileReader();
        reader.addEventListener("load", async function() {
            const loadingTask = pdfjsLib.getDocument(reader.result);
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            const matches = [];
            for (let pageIndex = 1; pageIndex < numPages; pageIndex++) {
                const page = await pdf.getPage(pageIndex);
                const textContent = await page.getTextContent();
                textContent.items.forEach(function(textItem) {
                    const text = textItem.str;
                    if(searchTerm !== undefined && searchTerm !== "" && text !== undefined && text.includes(searchTerm)){
                        matches.push({
                            pageNumber: pageIndex,
                            text: text
                        });
                    }
                })
            }
            if(matches.length !== 0){
                matchingFiles.push({
                    fileName: currentFile.name, 
                    matches: matches
                });
                matchingFiles = matchingFiles;
            };
        });
        reader.readAsDataURL(currentFile);
        
    }
}

</script>
<label for="searchTerm">Search Term:</label>
<input type="text" id="searchTerm" bind:value={searchTerm} />
<input type="file" id="pdfUpload" bind:this={pdfUpload} multiple />
<button on:click={startProcessing}>Process Files</button>

{#each matchingFiles as match}
<p>{match.fileName}</p>
{/each}
