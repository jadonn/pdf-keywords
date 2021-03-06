<script>
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
    import { stringify } from 'csv-stringify/browser/esm/sync';
    let searchTerm;
    let pdfUpload;
    let workerLimit = 1;
    let workerCount = 0;
    let dispatchedFilesCount = 0;
    let processedFilesCount = 0;
    let processedFilesData = [];
    let matchingFiles = [];
    let csvURL;
    let csvFilename;
    let processingErrors = [];
    let errorsCount = 0;
    let disableForm = false;

function generateCSV(){
    const textMatches = [];
    matchingFiles.forEach(file => {
        file.matches.forEach(match => {
            textMatches.push([file.fileName, match.pageNumber, match.text]);
        });
    });
    let CSVstring = "filename,pageNumber,text\r\n";
    CSVstring += stringify(textMatches);
    const csvBlob = new Blob([CSVstring], {type: "text/csv"});
    csvURL = URL.createObjectURL(csvBlob);
    const now = new Date();
    csvFilename = `pdf-keywords_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${now.getHours()}:${now.getMinutes()}.csv`
}

function startProcessing(){
    console.log("Starting Processing");
    disableForm = true;
    startWorker();
    setTimeout(startWorker, 1000);
}

function startWorker() {
    if(pdfUpload.files !== undefined && dispatchedFilesCount !== pdfUpload.files.length && workerCount < workerLimit) {
        console.log("Creating new worker");
        const newWorker = new Worker("worker.js");
        newWorker.onmessage = function(e) {
            const data = e.data;
            if(data.error !== undefined){
                processingErrors.push(data);
                processingErrors = processingErrors;
                errorsCount += 1;
                return;
            }
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
<div class="mt-5 container max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto">
    <div class="grid grid-cols-1 justify-items-center gap-6 w-auto">
        <p>
            <a class="p-2 outline mr-2" href="https://github.com/jadonn/pdf-keywords">GitHub</a>
            <a class="p-2 outline ml-2" href="https://twitter.com/JadonNaas">Twitter</a>
        </p>
        <h2 class="text-4xl text-center tracking-wide">How to Use</h2>
        <ol class="list-decimal list-inside">
            <li>Select PDF files from your computer.</li>
            <li>Enter the phrase or term for which you want to search.</li>
            <li>Set the number of workers (that is, CPU threads) to use to process more PDFs at the same time. <strong>Do not use more workers than you have CPU threads.</strong>
            </li>
            <li>Click the blue "Process Files" button to start processing. All processing happens in your browser on your local computer. No data is sent anywhere.</li>
            <li>When processing is done, click the blue "Generate CSV" button to generate a CSV.</li>
            <li>When the CSV is generated, click the blue "Download CSV" button to download the CSV file of results to your computer.</li>
        </ol>
        <label class="inline-flex flex-col w-60" for="pdfUpload">
            <span class="text-gray-700">Select Files</span>
            <input class="form-input mt-1 block" disabled={disableForm} type="file" id="pdfUpload" bind:this={pdfUpload} multiple />
        </label>
        <label class="inline-flex flex-col w-60" for="searchTerm">
            <span class="text-gray-700">Search Term</span>
            <input class="mt-1 block" disabled={disableForm} type="text" id="searchTerm" bind:value={searchTerm} />
        </label>
        <label class="inline-flex flex-col w-60" for="workerLimit">
            <span class="text-gray-700">Worker Limit (1-6)</span>
            <input class="mt-1 block" disabled={disableForm} type="number" id="workerLimit" min="1" max="6" bind:value={workerLimit} />
        </label>
        {#if dispatchedFilesCount === 0}
            <button class="p-2 outline bg-blue-800 text-white disabled:opacity-50" disabled={pdfUpload?.files === undefined || searchTerm.length === 0 || searchTerm === ""} transition:slide="{{delay: 50, duration: 300, easing: quintOut }}" on:click={startProcessing}>Process Files</button>
        {/if}
        {#if dispatchedFilesCount !== 0}
            <div transition:slide="{{delay: 250, duration: 300, easing: quintOut }}">
                <label for="fileProgress">
                    File Progress:
                </label>
                <progress id="fileProgress" max="{pdfUpload?.files?.length}" value={processedFilesCount}></progress>
                <p>
                    Processed Files: {processedFilesCount}
                </p>
                <p>
                    Errors: {errorsCount}
                </p>
            </div>
        {/if}
        {#if processedFilesCount !== 0 && processedFilesCount === pdfUpload?.files?.length && csvURL === undefined}
        <button class="p-2 outline bg-blue-800 text-white disabled:hidden" transition:slide="{{delay: 250, duration: 300, easing: quintOut }}" on:click={generateCSV}>Generate CSV</button>
        {/if}
        {#if csvURL !== undefined}
            <a class="p-2 outline bg-blue-800 text-white" download={csvFilename} transition:slide="{{delay: 250, duration: 300, easing: quintOut }}" href={csvURL}>Download CSV</a>
        {/if}
        <a href="/" class="p-2 outline bg-gray-500 text-white">Reset</a>
    </div>

    <div class="py-4">
        <div class="w-full h-1 bg-black"></div>
    </div>
    <h2 class="text-4xl text-center tracking-wide">Matching Files</h2>
    {#each matchingFiles as match}
    <div class="outline mt-4 mb-4">
    <p class="pl-2">{match.fileName}</p>
    </div>
    {/each}
    <div class="py-4">
        <div class="w-full h-1 bg-black"></div>
    </div>
    <h2 class="text-4xl text-center tracking-wide">Error Files</h2>
    {#each processingErrors as error}
        <div class="outline outline-dashed outline-pink-500 mt-4 mb-4">
            <p class="pl-2">{error.fileName}</p>
        </div>
    {/each}
</div>