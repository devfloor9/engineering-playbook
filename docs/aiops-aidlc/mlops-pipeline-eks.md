---
title: "EKS 기반 MLOps 파이프라인 구축"
sidebar_label: "MLOps 파이프라인"
description: "Kubeflow + MLflow + KServe 기반 엔드투엔드 ML 라이프사이클 관리"
sidebar_position: 5
category: "aiops-aidlc"
tags: [mlops, kubeflow, mlflow, kserve, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-02-11
  author: devfloor9
---

# EKS 기반 MLOps 파이프라인 구축

:::info 작성 예정
이 문서는 현재 작성 중입니다. 곧 업데이트될 예정입니다.
:::

## 개요

Kubeflow, MLflow, KServe를 EKS에 배포하여 데이터 준비부터 모델 서빙까지 엔드투엔드 ML 라이프사이클을 자동화합니다.

## 다룰 내용

- 엔드투엔드 ML 라이프사이클 아키텍처 (데이터 → 학습 → 서빙)
- 데이터 준비 및 피처 엔지니어링 (Kubeflow Pipelines)
- 실험 추적 및 모델 레지스트리 (MLflow)
- 모델 서빙 전략 (KServe vs Seldon Core)
- CI/CD for ML: Argo Workflows + Kubeflow 통합
- GPU 리소스 스케줄링 및 최적화
