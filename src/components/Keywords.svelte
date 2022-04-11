<script>
    let pdfUpload;

function handleFiles() {
    const fileList = pdfUpload.files;
    console.log(fileList);
}

</script>
<input type="file" id="pdfUpload" on:change={handleFiles} bind:this={pdfUpload} multiple />