import { Uri } from "vscode";
export default function getWebviewContent(src: Uri, scripts: string[]): string {
  let scriptsInHTML = "";
  for (let script of scripts) {
    scriptsInHTML += "\n";
    scriptsInHTML += `<pre class="mermaid">${script}</pre>`;
  }
  return `
 <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body >
    <h1 style="text-align:center;">Graph 📊</h1>
   
${scriptsInHTML}
 
    
<script src=${src}></script>


</body>
</html>
  `;
}
