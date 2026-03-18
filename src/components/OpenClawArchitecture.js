import React, { useRef, useEffect } from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const NS = 'http://www.w3.org/2000/svg';
const FONT = "'Open Sans',Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

function draw(svgEl, isDark) {
  svgEl.innerHTML = '';
  const fg = isDark ? '#ddd' : '#1e1e1e';

  // ── defs: arrowhead + animation ──
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="${fg}"/>
    </marker>
    <marker id="ah-orange" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#e8590c"/>
    </marker>
    <marker id="ah-blue" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#1971c2"/>
    </marker>
    <marker id="ah-purple" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#7048e8"/>
    </marker>
    <marker id="ah-teal" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#099268"/>
    </marker>
    <marker id="ah-violet" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#9c36b5"/>
    </marker>
    <marker id="ah-green" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#2f9e44"/>
    </marker>
    <marker id="ah-red" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#e03131"/>
    </marker>
    <style>@keyframes dash{to{stroke-dashoffset:-12}}</style>`;
  svgEl.appendChild(defs);

  // ── helpers ──
  let rc;
  import('roughjs').then(mod => {
    rc = mod.default.svg(svgEl);
    drawAll();
  });

  function rRect(x, y, w, h, opts) {
    svgEl.appendChild(rc.rectangle(x, y, w, h, {
      roughness: 1.2, strokeWidth: 2, fillStyle: 'solid', ...opts,
    }));
  }

  function addText(x, y, text, opts = {}) {
    const el = document.createElementNS(NS, 'text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('text-anchor', opts.anchor || 'middle');
    el.setAttribute('dominant-baseline', opts.baseline || 'middle');
    el.setAttribute('font-size', opts.fs || 14);
    el.setAttribute('font-family', FONT);
    el.setAttribute('fill', opts.color || fg);
    if (opts.bold) el.setAttribute('font-weight', '700');
    const lines = text.split('\n');
    if (lines.length === 1) {
      el.textContent = text;
    } else {
      const startDy = -(lines.length - 1) * 0.6;
      lines.forEach((line, i) => {
        const ts = document.createElementNS(NS, 'tspan');
        ts.setAttribute('x', x);
        ts.setAttribute('dy', i === 0 ? `${startDy}em` : '1.2em');
        ts.textContent = line;
        el.appendChild(ts);
      });
    }
    svgEl.appendChild(el);
  }

  const markerMap = {
    '#e8590c': 'ah-orange', '#1971c2': 'ah-blue', '#1c7ed6': 'ah-blue',
    '#7048e8': 'ah-purple', '#099268': 'ah-teal', '#9c36b5': 'ah-violet',
    '#2f9e44': 'ah-green', '#f08c00': 'ah-orange', '#e03131': 'ah-red',
  };

  function addArrow(points, opts = {}) {
    const p = document.createElementNS(NS, 'path');
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) d += ` L${points[i][0]} ${points[i][1]}`;
    p.setAttribute('d', d);
    p.setAttribute('stroke', opts.color || fg);
    p.setAttribute('stroke-width', opts.sw || 2);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    const mid = markerMap[opts.color] || 'ah';
    p.setAttribute('marker-end', `url(#${mid})`);
    if (opts.animated) {
      p.setAttribute('stroke-dasharray', '8 4');
      p.style.animation = 'dash 1s linear infinite';
    }
    svgEl.appendChild(p);
  }

  function drawAll() {
    // ═══ GROUPS ═══

    // EKS Cluster
    rRect(145, 8, 680, 555, { fill: isDark ? '#1a2a3a' : '#e7f5ff', stroke: '#339af0' });
    addText(160, 24, 'EKS Cluster — Graviton 4+ (ARM64) + Spot', { fs: 13, color: '#339af0', anchor: 'start', bold: true });

    // Gateway Pod
    rRect(165, 38, 395, 88, { fill: isDark ? '#1c2d40' : '#d0ebff', stroke: '#74c0fc', strokeWidth: 1.5 });
    addText(177, 52, 'Gateway Pod', { fs: 11, color: '#74c0fc', anchor: 'start', bold: true });

    // Observability Stack
    rRect(165, 218, 590, 148, { fill: isDark ? '#2a1a3a' : '#e5dbff', stroke: '#b197fc', strokeWidth: 1.5 });
    addText(177, 233, 'Observability Stack', { fs: 11, color: '#9775fa', anchor: 'start', bold: true });

    // Worker Node
    rRect(165, 400, 590, 140, { fill: isDark ? '#1a2e1a' : '#d3f9d8', stroke: '#69db7c', strokeWidth: 1.5 });
    addText(177, 415, 'Worker Node (DaemonSet / eBPF)', { fs: 11, color: '#40c057', anchor: 'start', bold: true });

    // AWS Cloud
    rRect(870, 8, 520, 305, { fill: isDark ? '#2e2410' : '#fff3bf', stroke: '#fab005', strokeWidth: 2.5 });
    addText(885, 24, 'AWS Cloud', { fs: 13, color: '#e67700', anchor: 'start', bold: true });

    // ═══ NODES ═══

    // Client (left side)
    rRect(15, 57, 108, 55, { fill: '#b2f2bb', stroke: '#2f9e44' });
    addText(69, 84, 'Client', { fs: 16, bold: true, color: '#1e1e1e' });

    // Gateway Pod nodes
    rRect(180, 58, 155, 55, { fill: '#a5d8ff', stroke: '#1c7ed6' });
    addText(257, 80, 'OpenClaw\n:18789', { fs: 11, color: '#1e1e1e' });

    rRect(355, 58, 190, 55, { fill: '#d0bfff', stroke: '#7048e8' });
    addText(450, 80, 'Bifrost Proxy\n:4000 (Auto-Router)', { fs: 9, color: '#1e1e1e' });

    // Redis (below Gateway Pod, to the right)
    rRect(575, 150, 135, 48, { fill: '#ffc9c9', stroke: '#e03131' });
    addText(642, 174, 'Redis\nSemantic Cache', { fs: 9, color: '#1e1e1e' });

    // Observability nodes
    rRect(180, 250, 115, 48, { fill: '#96f2d7', stroke: '#099268' });
    addText(237, 274, 'OTEL Collector\n:4317', { fs: 9, color: '#1e1e1e' });

    rRect(330, 250, 115, 48, { fill: '#ffd8a8', stroke: '#e8590c' });
    addText(387, 274, 'Prometheus', { fs: 11, color: '#1e1e1e' });

    rRect(480, 250, 115, 48, { fill: '#ffec99', stroke: '#f08c00' });
    addText(537, 274, 'Grafana', { fs: 11, color: '#1e1e1e' });

    rRect(630, 250, 110, 48, { fill: '#ffd8a8', stroke: '#e8590c' });
    addText(685, 274, 'Langfuse\nLLM Traces', { fs: 9, color: '#1e1e1e' });

    rRect(480, 312, 135, 38, { fill: '#eebefa', stroke: '#9c36b5' });
    addText(547, 331, 'Hubble UI\nL7 Service Map', { fs: 8, color: '#1e1e1e' });

    // Worker Node nodes
    rRect(180, 435, 150, 48, { fill: '#b2f2bb', stroke: '#2f9e44' });
    addText(255, 459, 'Cilium CNI\nENI + eBPF', { fs: 9, color: '#1e1e1e' });

    rRect(355, 435, 165, 48, { fill: '#dee2e6', stroke: '#495057' });
    addText(437, 459, 'Node Monitoring\nAgent', { fs: 9, color: '#1e1e1e' });

    // AWS Bedrock models
    rRect(890, 42, 158, 68, { fill: '#ffd8a8', stroke: '#e8590c' });
    addText(969, 72, 'Bedrock\nClaude Sonnet 4.6\n(Default)', { fs: 9, color: '#1e1e1e' });

    rRect(890, 128, 158, 68, { fill: '#ffd8a8', stroke: '#e8590c' });
    addText(969, 158, 'Bedrock\nGLM-4.7\n(Coding)', { fs: 9, color: '#1e1e1e' });

    rRect(890, 214, 158, 68, { fill: '#ffd8a8', stroke: '#e8590c' });
    addText(969, 244, 'Bedrock\nSolar Pro 3\n(Korean)', { fs: 9, color: '#1e1e1e' });

    // AWS infra services
    rRect(1068, 42, 148, 68, { fill: '#ffec99', stroke: '#f08c00' });
    addText(1142, 72, 'VPC Endpoint\nBedrock Runtime', { fs: 9, color: '#1e1e1e' });

    rRect(1068, 128, 148, 68, { fill: '#ffec99', stroke: '#f08c00' });
    addText(1142, 158, 'CloudTrail\nAudit Log', { fs: 9, color: '#1e1e1e' });

    rRect(1068, 214, 148, 68, { fill: '#ffec99', stroke: '#f08c00' });
    addText(1142, 244, 'IAM\nPod Identity', { fs: 9, color: '#1e1e1e' });

    // ═══ ARROWS (left-to-right flow, no crossings) ═══

    // Main data flow: Client → OpenClaw → Bifrost
    addArrow([[123, 84], [180, 85]], { color: '#2f9e44', sw: 2, animated: true });
    addArrow([[335, 85], [355, 85]], { color: '#1c7ed6', sw: 2, animated: true });

    // Bifrost → Redis (elbow: right then down)
    addArrow([[530, 113], [642, 113], [642, 150]], { color: '#e03131', sw: 1.5, animated: true });

    // Bifrost → Bedrock models (elbow: right through gap, then to each model)
    addArrow([[545, 72], [850, 72], [850, 76], [890, 76]], { color: '#e8590c', sw: 2, animated: true });
    addArrow([[545, 80], [850, 80], [850, 162], [890, 162]], { color: '#e8590c', sw: 2, animated: true });
    addArrow([[545, 88], [850, 88], [850, 248], [890, 248]], { color: '#e8590c', sw: 2, animated: true });

    // Observability: OpenClaw → OTEL (near-vertical down)
    addArrow([[257, 113], [237, 250]], { color: '#099268', sw: 1.5, animated: true });

    // Observability: Bifrost → Langfuse (elbow: down, right, down)
    addArrow([[450, 113], [450, 208], [685, 208], [685, 250]], { color: '#7048e8', sw: 1.5, animated: true });

    // OTEL → Prometheus
    addArrow([[295, 274], [330, 274]], { color: '#e8590c', sw: 1.5 });

    // Prometheus → Grafana
    addArrow([[445, 274], [480, 274]], { color: '#f08c00', sw: 1.5 });

    // Cilium → Hubble (elbow: up through gap, right, up into Hubble)
    addArrow([[255, 435], [255, 385], [547, 385], [547, 350]], { color: '#9c36b5', sw: 1.5, animated: true });

    // ═══ ARROW LABELS ═══
    addText(152, 72, 'request', { fs: 10, color: '#2f9e44' });
    addText(590, 105, 'cache', { fs: 9, color: '#e03131' });
    addText(700, 58, 'Auto-Route', { fs: 10, color: '#e8590c' });
    addText(228, 180, 'OTLP', { fs: 9, color: '#099268' });
    addText(570, 200, 'callback', { fs: 9, color: '#7048e8' });
    addText(400, 378, 'L7 flow', { fs: 9, color: '#9c36b5' });
  }
}

export default function OpenClawArchitecture() {
  const svgRef = useRef(null);
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    if (svgRef.current) draw(svgRef.current, isDark);
  }, [isDark]);

  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
      borderRadius: 12,
      marginBottom: 24,
      background: isDark ? '#1a1a1a' : '#ffffff',
    }}>
      <svg
        ref={svgRef}
        width="1400"
        height="580"
        viewBox="0 0 1400 580"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
