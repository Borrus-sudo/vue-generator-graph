import * as compiler from "@vue/compiler-sfc";
export default function(templateCode) {
    console.log(templateCode);
    const template = compiler.compileTemplate({
        id: "temp",
        source: templateCode,
        filename: "crapprac",
    });
    console.log(template);
    if (template.ast) {
        return template.ast.components;
    }
    return [];
}