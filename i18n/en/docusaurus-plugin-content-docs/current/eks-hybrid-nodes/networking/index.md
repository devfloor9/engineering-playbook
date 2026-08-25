---
title: Networking
description: EKS Hybrid Nodes networking best practices — covers CIDR design and address-range minimization, CNI configuration and Pod CIDR routing, building and operating the Hybrid Nodes Gateway, load balancing and service exposure, firewall pre-registration, and TGW topology.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - networking
  - scope:nav
sidebar_label: Networking
sidebar_position: 2
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers networking, the biggest hurdle in hybrid cluster adoption. It is organized in practical order, from IP address range design to building and operating the Hybrid Nodes Gateway, and writing pre-registration requests to submit to firewall and network teams.

---

<DocCardGrid columns={3}>
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/cidr-network-design"
    icon="🗺️"
    title="CIDR Design and Address-Range Minimization"
    description="Determining routing requirements, rationale for minimal VPC sizing, dedicated subnets for control plane ENIs, proactively reserving Pod CIDRs, dev/stg/prd address planning"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/cni-selection-routing"
    icon="🔀"
    title="CNI Configuration and Pod CIDR Routing"
    description="Cilium (AWS-supported CNI) selection criteria, hybrid affinity and cluster-pool IPAM, BGP Control Plane vs static routing configuration"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/hybrid-nodes-gateway"
    icon="🚇"
    title="Building and Operating the Hybrid Nodes Gateway"
    description="Cilium VTEP configuration, Helm installation, instance sizing (vertical scaling), 3–5 second failover HA model, monitoring, removal caveats"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/load-balancing"
    icon="⚖️"
    title="Load Balancing and Service Exposure"
    description="Traffic-origin-based NLB vs Cilium built-in LB decision principle, AWS Load Balancer Controller IP targets, LB IPAM and BGP advertisement, MetalLB"
    color="#f4a261"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/firewall-connectivity"
    icon="🧱"
    title="Firewall Pre-Registration & TGW Topology"
    description="5-zone firewall rule table (request-form level), handling lack of FQDN wildcard support, TGW route design, on-premises LB → cloud Pod path"
    color="#e63946"
  />
</DocCardGrid>
