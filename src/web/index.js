import mermaid from "mermaid";

mermaid.initialize({
    theme: "default",
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
    },
    mermaid: {
        callback: function(id) {
            console.log(id);
        }
    }
});