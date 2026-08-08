# Kubernetes Projects

Kubernetes manifests and notes from learning the platform properly. Everything
here was applied to a real cluster, either kind locally or a managed cluster,
rather than copied out of the docs.

Portfolio: [committodeploy.dev](https://committodeploy.dev)

## Layout

```
01_References/          notes written up after working through each topic
02_project_concepts/    manifests grouped by what they show
03_ingress_practice/    routing two services through one ingress
```

## Reference notes

| File | Topic |
|---|---|
| 01_Basics.md | Cluster layout, control plane and worker nodes |
| 02 to 04_general.md | Core objects and day to day operations |
| 05_stateful_sets.md | StatefulSets, stable identity, ordered rollout |
| 06_k8s_service.md | ClusterIP, NodePort, LoadBalancer |
| 07_probs.md | Liveness, readiness and startup probes |
| 08_HPA_VPA.md | Horizontal and vertical autoscaling |
| 09_ingress_in_k8s.md | Ingress controllers and routing rules |
| 10_volumes_in_k8s.md | Volumes, PV and PVC, storage classes |
| COMMANDS.md | kubectl reference |

## Manifests

`02_project_concepts/kind_cluster/01_nginx/` has one object per file: Pod,
ReplicaSet, Deployment, Service, Namespace, Job, CronJob, DaemonSet, PV and PVC.
Splitting them up like this makes the relationship between Pod, ReplicaSet and
Deployment easier to follow than one bundled manifest would.

`02_first_project/` is a namespaced Deployment with a Service.

`03_mysql_project/` is a stateful MySQL setup with a ConfigMap and a Secret.

`03_ingress_practice/` runs a frontend and backend Deployment behind one Ingress
with path based routing to each Service. This is the setup most real apps need.

## Running these

Start a local cluster:

```bash
kind create cluster --config 02_project_concepts/kind_cluster/config.yml
```

Apply things in order:

```bash
kubectl apply -f 02_project_concepts/kind_cluster/01_nginx/namespace.yml
kubectl apply -f 02_project_concepts/kind_cluster/01_nginx/deployment.yml
kubectl apply -f 02_project_concepts/kind_cluster/01_nginx/service.yml

kubectl get pods -n <namespace> -w
```

For the ingress examples, install an ingress controller first:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller --timeout=90s

kubectl apply -f 03_ingress_practice/
```

## About the Secret file

`03_mysql_project/secret.yml` has a base64 value that decodes to `rootpassword`.
That is demo data on purpose, and it makes the point of the exercise: base64 is
encoding, not encryption. Anything in a committed Secret manifest can be read by
anyone with the file. Real clusters need sealed secrets, External Secrets
Operator, or a proper secret store.

## Tech stack

Kubernetes, kind, kubectl, NGINX Ingress Controller, MySQL, YAML
