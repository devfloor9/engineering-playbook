---
title: "Building MLOps Pipeline on EKS"
sidebar_label: "MLOps Pipeline"
description: "End-to-end ML lifecycle management based on Kubeflow + MLflow + KServe"
sidebar_position: 5
category: "aiops-aidlc"
tags: [mlops, kubeflow, mlflow, kserve, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-02-11
  author: devfloor9
---

# Building MLOps Pipeline on EKS

:::info Coming Soon
This document is currently being written. It will be updated soon.
:::

## Overview

Deploying Kubeflow, MLflow, and KServe on EKS to automate end-to-end ML lifecycle from data preparation to model serving.

## Topics to be Covered

- End-to-end ML lifecycle architecture (data → training → serving)
- Data preparation and feature engineering (Kubeflow Pipelines)
- Experiment tracking and model registry (MLflow)
- Model serving strategies (KServe vs Seldon Core)
- CI/CD for ML: Argo Workflows + Kubeflow integration
- GPU resource scheduling and optimization
