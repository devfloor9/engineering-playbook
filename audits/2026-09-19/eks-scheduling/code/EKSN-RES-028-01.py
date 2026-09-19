"""Pure offline transformation of already supplied Kubernetes List JSON."""

def report(pod_list, node_list):
    nodes = {n["metadata"]["name"]: n for n in node_list.get("items", [])}
    result = []
    for pod in pod_list.get("items", []):
        meta = pod.get("metadata", {})
        node_name = pod.get("spec", {}).get("nodeName")
        node = nodes.get(node_name)
        conditions = (node or {}).get("status", {}).get("conditions", [])
        ready = next((c.get("status", "Unknown")
                      for c in conditions if c.get("type") == "Ready"), "Unknown")
        result.append({
            "namespace": meta.get("namespace", "default"),
            "pod": meta.get("name"),
            "phase": pod.get("status", {}).get("phase", "Unknown"),
            "node": node_name,
            "node_snapshot_present": node is not None,
            "zone": (node or {}).get("metadata", {}).get("labels", {}).get(
                "topology.kubernetes.io/zone"),
            "node_ready": ready,
            "node_unschedulable": (node or {}).get("spec", {}).get("unschedulable", False) if node is not None else None,
            "node_taints": (node or {}).get("spec", {}).get("taints", []) if node is not None else None,
            "controller": next(({"kind": o.get("kind"), "name": o.get("name")}
                                for o in meta.get("ownerReferences", []) if o.get("controller")), None),
        })
    return sorted(result, key=lambda r: (r["namespace"], r["pod"] or ""))
