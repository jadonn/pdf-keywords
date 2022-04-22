# PDF Keywords
This is a small web application for finding text matches in PDF files. The application uses [Astro](https://astro.build) to generate the final HTML, JavaScript, and CSS; uses [Svelte](https://svelte.dev) for templating and client app logic; uses [PDF.js](https://mozilla.github.io/pdf.js/) for reading PFDs; and uses [csv-stringify](https://csv.js.org/stringify/).

PDF Keywords is an entirely client-side web application. The application uses the browser File API to read only the files you choose for it to read. The application dispatches the selected files to one or more Web Workers running in your local web browser. Each Web Worker reads the entire PDF file using PDF.js and checks for the presence of the search term you provided. If the search term is found, the Web Worker records the page number and matching text in which the search term was found. After processing the PDF, the Web Worker is terminated, and a new Web Worker is created to process the next remaining PDF.

The web application keeps a running count of the files that have been processed. Any files with matches will have their names displayed towards the bottom of the web application page.

After processing has completed, the web application will display a button to generate a CSV file from the matches that were identified. The web application will create the CSV file entirely inside the local browser using csv-stringify and make the CSV file available using a Blob and Data URL. After the CSV file is available, a new link for downloading the CSV file will appear. The downloadable CSV file should be a properly formatted, valid CSV file with a file name formatted like `pdf-keywords_YYYY-MM-DD_HH:MM.csv`.

## Try the application out!
The application presently lives on Cloudflare Pages at https://pdf-keywords.pages.dev. The application in its current form is free to use.

## Dependencies
Node version 14 or newer (or whatever Astro depends on).

## Get the application
Clone this repo and run `npm install` to install all the packages.

## Test the application locally
To test the application locally, run `npm run dev` from the top-level of the project's directory. That will start the Astro development server on local port 3000.

## Build the application
Run `npm run build` to build the application and produce the static HTML, JavaScript, and CSS for the application. The resulting build will output into the `dist` folder in the project directory.