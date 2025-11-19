# Node.js Application Deployment on Kubernetes

This project demonstrates a complete **Node.js + MySQL** deployment on Kubernetes using best practices, including ConfigMaps, Secrets, StatefulSets, Persistent Volumes, Probes, and Namespaces.

---

## 🚀 Project Overview

This project focuses on deploying a production‑style Node.js application on Kubernetes with a fully managed MySQL database backend. It includes container optimization, secure environment handling, persistent storage, and proper service networking.

---

## 📁 Steps Performed

### 1. **Clone and Test Node.js Application**

* Cloned the Node.js application into the local workspace.
* Verified full functionality and resolved minor issues before containerization.

---

### 2. **Docker Image Optimization**

* Created a Dockerfile and built the application image.
* Initial image size: **176 MB** → optimized to **145 MB** using:

  * Multi‑stage builds.
  * `npm ci --only=production`.
  * Creating a dedicated non‑root user to run the application.
* Successfully tested the container locally.
* Tagged and pushed the optimized image to Docker Hub.

---

## 🛠 Kubernetes Setup

All Kubernetes resources were created inside a dedicated namespace (`nodeappnamespace`) **except PV**, because PVs are cluster‑wide resources.

### 3. **ConfigMap & Secret Creation**

* Stored all environment variables securely.
* ConfigMap → non‑sensitive values.
* Secrets → MySQL username, password, database.

---

### 4. **MySQL StatefulSet**

* Created a StatefulSet for MySQL to ensure ordered and stable pod identity.
* Connected environment variables from Secrets.
* Verified:

  * Database creation.
  * User authentication.
  * Pod logs and access inside the container.

---

### 5. **Services for Database Access**

* **Headless Service** → for stable pod DNS inside StatefulSet.
* **ClusterIP Service** → main service for Node.js backend communication.

> **Note:** It’s possible to connect via `headless.mysqlstatefulset-0`, but using a normal ClusterIP service is better practice.

---

### 6. **Persistent Volume (PV) & Persistent Volume Claim (PVC)**

* Created a manual PV to persist MySQL data.
* Tested data persistence:

  * Deleted the MySQL pod.
  * Recreated it.
  * Verified that all database data was restored correctly.

---

### 7. **Node.js Deployment**

* Created Kubernetes Deployment for the Node.js application.
* Linked the app to MySQL using the ClusterIP service (`mysqlservice`).
* Added:

  * **Liveness Probe**
  * **Readiness Probe**
* Ensured automatic rollout and recovery.

---

### 8. **Node.js Service (External Access)**

* Created a service to expose the application for external access.
* Forwarded NodePort to test the application.

---

## 🧩 Issues Faced & Solutions

### ❗ Node.js Could Not Connect to MySQL

Everything appeared correct (service, env, DNS), but Node.js was still failing to connect.

**Cause:**

* MySQL 8.0 requires specifying **`DATABASE_HOST`** explicitly.

**Fix:**

* Added `DATABASE_HOST=mysqlservice` into environment variables.
* The application connected successfully.

---

## 📘 New Kubernetes Commands Learned

```bash
kubectl patch pv nodeapppv -p '{"spec":{"claimRef": null}}'
```

Used to remove a PVC binding from a PV.

```bash
kubectl exec -it <pod-name> -n nodeappnamespace -- nslookup mysqlservice
```

Used to check DNS resolution inside a pod.

---

## 🧾 Summary

This project covers real‑world Kubernetes practices:

* Multi‑stage Docker builds.
* Secure configurations using Secrets.
* MySQL StatefulSet with persistent storage.
* Proper service architecture.
* Probes for application health.
* Namespace‑based isolation.

This setup mimics production‑style Node.js + MySQL deployment and is suitable for showcasing on GitHub or adding to a DevOps portfolio.

---

## 📦 Repository Structure (Suggested)

```
k8s-nodeapp-deployment/
├── Dockerfile
├── app/                      # Node.js source code
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── mysql-pv.yaml
│   ├── mysql-pvc.yaml
│   ├── mysql-statefulset.yaml
│   ├── mysql-service.yaml
│   ├── app-deployment.yaml
│   ├── app-service.yaml
└── README.md
```

---

## 📌 Final Note

This project demonstrates an end‑to‑end deployment pipeline suitable for learning, interviews, and portfolio use.
