#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Project, Node, SyntaxKind } from "ts-morph";
import { parse } from "@babel/parser";
import globby from "globby";
import matter from "gray-matter";
import prettier from "prettier";
import chalk from "chalk";

type Cfg = {
  roots: string[]; include: string[]; exclude: string[];
  outDir: string; indexFile: string; titlePrefix: string;
  printSignatures: boolean; detectExpressRoutes: boolean;
};

const ROOT = process.cwd();
const cfgPath = path.join(ROOT, "tools/gendocs.config.json");
const CFG: Cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

const OUT = path.join(ROOT, CFG.outDir);
const INDEX = path.join(ROOT, CFG.indexFile);

const ensureDir = (p: string) => fs.mkdirSync(p, { recursive: true });
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");

const isTS = (f: string) => /\.(ts|tsx)$/.test(f);
const isJS = (f: string) => /\.(js|jsx)$/.test(f);

async function main() {
  console.log(chalk.cyan("▶ Generating code docs…"));
  ensureDir(OUT);

  // 1) Список файлов
  const patterns = CFG.roots.flatMap(r => CFG.include.map(i => `${r}/${i}`));
  const files = await globby(patterns, { ignore: CFG.exclude });
  if (!files.length) {
    console.log(chalk.yellow("No files found. Check gendocs.config.json."));
    process.exit(0);
  }

  // 2) TS-проект (для ts/tsx)
  const tsProject = new Project({
    tsConfigFilePath: fs.existsSync(path.join(ROOT, "tsconfig.json"))
      ? path.join(ROOT, "tsconfig.json")
      : undefined,
    skipAddingFilesFromTsConfig: true
  });
  files.filter(isTS).forEach(f => tsProject.addSourceFileAtPath(f));

  const written: string[] = [];

  for (const file of files) {
    try {
      const abs = path.join(ROOT, file);
      const dst = path.join(OUT, file) + ".md";
      ensureDir(path.dirname(dst));

      let doc: string;
      if (isTS(file)) {
        doc = docFromTS(tsProject, file, abs);
      } else if (isJS(file)) {
        doc = docFromJS(file, abs);
      } else {
        // не наш формат
        continue;
      }

      // Приведём MD Prettier'ом, если конфиг есть
      const pretty = await formatMD(doc);
      fs.writeFileSync(dst, pretty, "utf8");
      written.push(dst);
      console.log(chalk.green("✓"), rel(dst));
    } catch (e: any) {
      console.log(chalk.red("✗"), file, "-", e.message);
    }
  }

  // 3) Индекс
  const indexMD = buildIndex(written);
  fs.writeFileSync(INDEX, await formatMD(indexMD), "utf8");
  console.log(chalk.cyan("▶ Done. Files:"), written.length);
  console.log(chalk.cyan("Index:"), rel(INDEX));
}

/* ---------- TS/TSX ---------- */
function docFromTS(project: Project, fileRel: string, abs: string): string {
  const sf = project.getSourceFileOrThrow(abs);
  const topDoc = sf.getLeadingCommentRanges()[0]?.getText() ?? "";

  // Экспорты
  const exports = sf.getExportedDeclarations();
  const blocks: string[] = [];

  exports.forEach((decls, name) => {
    for (const decl of decls) {
      const node = decl as Node;
      const kind = SyntaxKind[node.getKind()];
      const start = (node as any).getStartLineNumber?.() ?? 0;
      const end = (node as any).getEndLineNumber?.() ?? 0;
      const range = start && end ? `L${start}-L${end}` : "";

      const jsdoc = (node as any).getJsDocs?.()?.map((d: any) => d.getComment()).filter(Boolean).join("\n") || "";

      // Подпись
      let signature = "";
      if (CFG.printSignatures) {
        try {
          if ((node as any).getText) signature = String((node as any).getText()).slice(0, 2000);
        } catch {}
      }

      blocks.push([
        `### \`${name}\` <sub>${kind}${range ? " · " + range : ""}</sub>`,
        jsdoc ? jsdoc : "_Нет описания_",
        signature ? "```ts\n" + signature + "\n```" : ""
      ].filter(Boolean).join("\n\n"));
    }
  });

  // Поиск express-роутов (простая эвристика)
  const expressBlock = CFG.detectExpressRoutes ? findExpressRoutesTS(sf) : "";

  const body = [
    topDocBlock(topDoc),
    blocks.length ? "## Экспорты\n\n" + blocks.join("\n\n---\n\n") : "_В этом файле нет экспортируемых сущностей._",
    expressBlock
  ].filter(Boolean).join("\n\n");

  return wrapMD(fileRel, body);
}

function findExpressRoutesTS(sf: any): string {
  const rows: string[] = [];
  sf.forEachDescendant((node: Node) => {
    const kind = node.getKind();
    if (kind === SyntaxKind.CallExpression) {
      const ce: any = node;
      const expr = ce.getExpression();
      const callee = expr?.getText?.();
      const httpMethod = /router\.(get|post|put|patch|delete)/i.exec(callee || "")?.[1];
      if (httpMethod) {
        const args = ce.getArguments();
        const pathArg = args?.[0]?.getText?.()?.replace(/['"`]/g, "") || "";
        const ln = (node as any).getStartLineNumber?.() ?? 0;
        rows.push(`- \`${httpMethod.toUpperCase()} ${pathArg}\`  _(L${ln})_`);
      }
    }
  });
  if (!rows.length) return "";
  return "## Express-роуты\n\n" + rows.join("\n");
}

/* ---------- JS/JSX ---------- */
function docFromJS(fileRel: string, abs: string): string {
  const code = fs.readFileSync(abs, "utf8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "classProperties", "objectRestSpread", "typescript"]
  });

  const topDoc = getTopBlockComment(code);

  const exports: string[] = [];
  const routes: string[] = [];

  // Примитивный обход AST для export и router.METHOD
  (ast.program.body as any[]).forEach(node => {
    if (node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration") {
      const decl = (node as any).declaration;
      if (!decl) return;
      let name = "default";
      if (decl.id?.name) name = decl.id.name;
      if (decl.declarations?.[0]?.id?.name) name = decl.declarations[0].id.name;
      exports.push(`- \`${name}\` (${decl.type})`);
    }
  });

  const routerRegex = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/gi;
  let m: RegExpExecArray | null;
  while ((m = routerRegex.exec(code))) {
    routes.push(`- \`${m[1].toUpperCase()} ${m[3]}\``);
  }

  const body = [
    topDocBlock(topDoc),
    exports.length ? "## Экспорты\n\n" + exports.join("\n") : "_В этом файле нет экспортов._",
    routes.length ? "## Express-роуты\n\n" + routes.join("\n") : ""
  ].filter(Boolean).join("\n\n");

  return wrapMD(fileRel, body);
}

/* ---------- helpers ---------- */
function topDocBlock(s: string): string {
  const clean = s.replace(/^\/\*+|\*+\/$/g, "").replace(/^\s*\*\s?/gm, "").trim();
  return clean ? (clean.includes("\n") ? clean : `> ${clean}`) : "";
}

function wrapMD(fileRel: string, body: string): string {
  const fm = matter.stringify(body, {
    file: fileRel,
    updated: new Date().toISOString()
  });
  const title = `${CFG.titlePrefix} ${fileRel}`;
  return `# ${title}\n\n${fm}\n`;
}

async function formatMD(md: string): Promise<string> {
  try {
    const cfg = await prettier.resolveConfig(process.cwd());
    return prettier.format(md, { ...(cfg || {}), parser: "markdown" });
  } catch { return md; }
}

function getTopBlockComment(code: string): string {
  const m = code.match(/^\/\*![\s\S]*?\*\/|^\/\*[\s\S]*?\*\//);
  return m?.[0] || "";
}

function buildIndex(files: string[]): string {
  const groups: Record<string, string[]> = {};
  
  files.forEach(file => {
    const relPath = path.relative(OUT, file).replace(/\.md$/, "");
    const dir = path.dirname(relPath);
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(relPath);
  });

  const sections = Object.keys(groups).sort().map(dir => {
    const files = groups[dir].sort();
    const title = dir === "." ? "Root" : dir;
    const links = files.map(f => {
      const name = path.basename(f);
      return `- [${name}](./code/${f}.md)`;
    });
    return `## ${title}\n\n${links.join("\n")}`;
  });

  return `# ResumeMint • Code Documentation Map

> Автогенерированная карта документации кода проекта.
> 
> Обновлено: ${new Date().toISOString()}
> Файлов: ${files.length}

${sections.join("\n\n")}

---

> Сгенерировано инструментом \`tools/gendocs.ts\`
`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
