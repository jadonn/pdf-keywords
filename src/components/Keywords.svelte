<script>
    let pdfUpload;

function processFiles() {
    const fileList = pdfUpload.files;
    console.log(fileList);
}

</script>
<input type="file" id="pdfUpload" bind:this={pdfUpload} multiple />
<button on:click={processFiles}>Process Files</button>