<script>
    let pdfUpload;

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
            for (let pageIndex = 1; pageIndex < numPages; pageIndex++) {
                const page = await pdf.getPage(pageIndex);
                const textContent = await page.getTextContent();
                console.log(textContent);
                textContent.items.forEach(function(textItem) {
                    console.log(textItem.str);
                })
            }
        });

        reader.readAsDataURL(currentFile);
        
    }
}

</script>
<input type="file" id="pdfUpload" bind:this={pdfUpload} multiple />
<button on:click={processFiles}>Process Files</button>