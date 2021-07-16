//@ts-nocheck
import { Uri } from "vscode";
export default function getWebviewContent(src: Uri, scripts: string[]): string {
  return `
 <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <h1>Hello World</h1>
    <pre class="mermaid">
${scripts[0]}
  </pre>
    
<script src=${src}></script>


</body>
</html>
  `;
}
