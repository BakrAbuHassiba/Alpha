export function copyStyles(sourceDoc, targetDoc) {
  const nodes = [];
  // Copy <link rel="stylesheet"> tags
  sourceDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.href;
    if (href) {
      const el = targetDoc.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      nodes.push(el);
    }
  });
  // Copy inline <style> blocks
  sourceDoc.querySelectorAll("style").forEach((style) => {
    const el = targetDoc.createElement("style");
    el.textContent = style.textContent;
    nodes.push(el);
  });
  return nodes;
}

export function printElementAsPdf(selector, filename = "export.pdf") {
  const el = document.querySelector(selector);
  if (!el) {
    // fallback: print whole page
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert("Unable to open print window — please allow popups.");
    return;
  }

  const doc = printWindow.document;
  doc.open();
  doc.write(
    '<!doctype html><html><head><meta charset="utf-8"><title>' +
      filename +
      "</title>",
  );

  // copy styles
  const styleNodes = copyStyles(document, doc);
  styleNodes.forEach((n) => doc.head.appendChild(n));

  // Minimal print tweaks: ensure body margin 0
  const manualStyle = doc.createElement("style");
  manualStyle.textContent = `
  @media print { @page { size: auto; margin: 10mm; } body { margin: 0; } }
  body { -webkit-print-color-adjust: exact; }
`;
  doc.head.appendChild(manualStyle);

  doc.write("</head><body>");
  // clone the node to preserve current state
  const clone = el.cloneNode(true);
  // remove any tooltips/interactive-only attributes that shouldn't print
  clone.querySelectorAll("input, button, [data-no-print]").forEach((n) => {
    // for inputs, print their value as text
    if (n.tagName === "INPUT" || n.tagName === "TEXTAREA") {
      const span = doc.createElement("span");
      span.textContent = n.value || "";
      n.parentNode && n.parentNode.replaceChild(span, n);
    } else {
      n.remove();
    }
  });

  doc.body.appendChild(clone);
  // add a small script to invoke print after load
  doc.write(
    "<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 50); window.onafterprint = function(){ window.close(); }; }<\/script>",
  );
  doc.write("</body></html>");
  doc.close();
}

export default printElementAsPdf;
