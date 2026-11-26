// Turns plain Markdown benchmark tables into "profiler report" tables at build time:
// numeric columns right-aligned, kernel names in mono, and a Speedup column drawn
// as an inline bar with the best row highlighted. Tables without those columns
// are left alone apart from the numeric alignment.
// No extra dependency: a small walk over the HAST tree is enough here.
const walk = (node, fn) => {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
};

const text = (node) =>
  node.type === "text" ? node.value : (node.children ?? []).map(text).join("");

const NUMERIC = /^[-+]?\d[\d,]*(\.\d+)?\s*(×|x|%|µs|ms|s)?$/i;
const SPEEDUP = /^(\d+(?:\.\d+)?)\s*[×x]$/i;

const addClass = (node, name) => {
  const props = (node.properties ??= {});
  const list = Array.isArray(props.className) ? props.className : props.className ? [props.className] : [];
  if (!list.includes(name)) list.push(name);
  props.className = list;
};

const rows = (table, tag) =>
  (table.children ?? [])
    .filter((child) => child.type === "element" && child.tagName === tag)
    .flatMap((section) => section.children.filter((row) => row.type === "element" && row.tagName === "tr"));

const cells = (row) => row.children.filter((cell) => cell.type === "element" && (cell.tagName === "td" || cell.tagName === "th"));

export default function rehypeBenchTables() {
  return (tree) => {
    walk(tree, (table) => {
      if (table.type !== "element" || table.tagName !== "table") return;
      const [head] = rows(table, "thead");
      const body = rows(table, "tbody");
      if (!head || body.length === 0) return;
      const headers = cells(head);

      headers.forEach((th, column) => {
        const label = text(th).trim();
        const values = body.map((row) => text(cells(row)[column] ?? { type: "text", value: "" }).trim());

        if (column === 0 && /^kernel$/i.test(label)) {
          body.forEach((row) => cells(row)[0] && addClass(cells(row)[0], "mono"));
        }

        if (!values.every((value) => NUMERIC.test(value))) return;
        addClass(th, "num");
        body.forEach((row) => addClass(cells(row)[column], "num"));

        if (!/speedup/i.test(label)) return;
        const speedups = values.map((value) => Number(value.match(SPEEDUP)?.[1]));
        if (speedups.some((value) => !Number.isFinite(value))) return;
        const best = Math.max(...speedups);
        addClass(th, "speedup-col");
        body.forEach((row, index) => {
          const cell = cells(row)[column];
          const width = ((speedups[index] / best) * 100).toFixed(1);
          cell.children = [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["speedup"] },
              children: [
                { type: "element", tagName: "span", properties: { className: ["speedup-value"] }, children: [{ type: "text", value: values[index] }] },
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["speedup-bar"], ariaHidden: "true" },
                  children: [{ type: "element", tagName: "span", properties: { style: `--w: ${width}%` }, children: [] }]
                }
              ]
            }
          ];
          if (speedups[index] === best) addClass(row, "is-best");
        });
      });
    });
  };
}
