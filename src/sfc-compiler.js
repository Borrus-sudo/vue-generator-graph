import * as compiler from "@vue/compiler-sfc";
export default function(templateCode) {
    const parsed = compiler.parse(templateCode).descriptor;
    console.log(parsed);
    const template = compiler.compileTemplate({
        id: "tmp",
        source: parsed.template ? parsed.template.content : "<template></template>",
        filename: "crap",
    });
    if (template.ast) {
        return template.ast.components;
    }
    return [];
}