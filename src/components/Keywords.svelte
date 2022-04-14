<script>
    let searchTerm;
    let pdfUpload;
    const workerLimit = 3;
    let matchingFiles = [];

function processFilesWithWorkers() {
    const fileList = pdfUpload.files;
    let processedCount = 0;
    const processedFiles = [];
    const fileMatches = [];
    for(let index = 0; index < workerLimit; index++){
        const newWorker = new Worker("worker.js");
        newWorker.onmessage = function(e) {
            const data = e.data;
            processedFiles.push(data);
            const matches = data.matches;
            if(matches !== undefined && matches.length !== 0) {
                fileMatches.push(data);
            }
            if(fileList.length === processedCount.length) {
                newWorker.terminate();
                console.log("Terminating worker");
            }else {
                newWorker.postMessage({currentFile: fileList[processedCount], searchTerm: searchTerm});
                console.log(fileMatches);
                processedCount += 1;
            }
            
        }
        newWorker.postMessage({currentFile: fileList[index], searchTerm: searchTerm});
        processedCount += 1;
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
<button on:click={processFilesWithWorkers}>Process Files</button>

{#each matchingFiles as match}
<p>{match.fileName}</p>
{/each}
