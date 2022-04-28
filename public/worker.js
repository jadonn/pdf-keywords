self.importScripts("pdf.min.js");
self.importScripts("pdf.worker.min.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";
onmessage = async function (e){
    const data = e.data;
    const currentFile = data.currentFile;
    const searchTerm = data.searchTerm;
    let result;
    let pdf;
    try{
        const reader = new FileReaderSync();
        result = reader.readAsDataURL(currentFile);
        const loadingTask = pdfjsLib.getDocument(result);
        pdf = await loadingTask.promise;
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
        postMessage({fileName: currentFile.name, matches: matches});
    } catch(error) {
        console.error(error);
        postMessage({error: error.message, fileName: currentFile.name});
    }
}