//@ts-nocheck
import { Uri } from "vscode";
export default function getWebviewContent(src: Uri): string {
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
graph LR
A-->B
  </pre>
    <pre class="mermaid">
gantt
title A Gantt Diagram
dateFormat  YYYY-MM-DD
section Section
A task           :a1, 2014-01-01, 30d
Another task     :after a1  , 20d
section Another
Task in sec      :2014-01-12  , 12d
another task      : 24d
  </pre>
<script src=${src}></script>


</body>
</html>
  `;
}
