import { Uri } from "vscode";
export default function getWebviewContent(src: Uri, scripts: string[]): string {
  let scriptsInHTML = "";
  for (let script of scripts) {
    scriptsInHTML += `<pre class="mermaid">${script}</pre> \n`;
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

<body>
  <h1>Graph 📊</h1>
  <br>
  <br>
  <button onclick="generateSvg()">Generate SVG</button>
  <br>
  <br>
  ${scriptsInHTML}
  <script src="${src}"></script>
  <script>
    const vscode = acquireVsCodeApi();
    function openFile(id) {
      vscode.postMessage({
        command: "openFile",
        text: id,
      });
    };
    function generateSvg() {
      const elems="<svg>" + Array.from(document.getElementsByClassName("mermaid")).map(elem=>"<g>"+elem.innerHTML+"</g>").join(" ") + "</svg>";
      vscode.postMessage({command:"svgContent",text:elems});
    }
  </script>
</body>

</html>
  `;
}
