{{/*
Fleet Management System — Helm Helpers
*/}}

{{/* Chart name */}}
{{- define "fleet.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Fully qualified app name */}}
{{- define "fleet.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Chart label */}}
{{- define "fleet.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels */}}
{{- define "fleet.labels" -}}
helm.sh/chart: {{ include "fleet.chart" . }}
{{ include "fleet.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: fleet-management
{{- end }}

{{/* Selector labels */}}
{{- define "fleet.selectorLabels" -}}
app.kubernetes.io/name: {{ include "fleet.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Service-specific labels helper */}}
{{- define "fleet.serviceLabels" -}}
helm.sh/chart: {{ include "fleet.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: fleet-management
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/* ServiceAccount name */}}
{{- define "fleet.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "fleet.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/* Image pull policy helper */}}
{{- define "fleet.imagePullPolicy" -}}
{{- . | default "IfNotPresent" }}
{{- end }}

{{/* Postgres secret name */}}
{{- define "fleet.postgresSecretName" -}}
{{- printf "%s-postgres-secret" (include "fleet.fullname" .) }}
{{- end }}

{{/* Keycloak secret name */}}
{{- define "fleet.keycloakSecretName" -}}
{{- printf "%s-keycloak-secret" (include "fleet.fullname" .) }}
{{- end }}

{{/* Common configmap name */}}
{{- define "fleet.configmapName" -}}
{{- printf "%s-config" (include "fleet.fullname" .) }}
{{- end }}

{{/* Standard liveness probe */}}
{{- define "fleet.livenessProbe" -}}
{{- $probe := .probe }}
{{- $port := .port }}
livenessProbe:
  httpGet:
    path: {{ $probe.path }}
    port: {{ $port }}
  initialDelaySeconds: {{ $probe.initialDelaySeconds }}
  periodSeconds: {{ $probe.periodSeconds }}
  timeoutSeconds: {{ $probe.timeoutSeconds }}
  failureThreshold: {{ $probe.failureThreshold }}
{{- end }}

{{/* Standard readiness probe */}}
{{- define "fleet.readinessProbe" -}}
{{- $probe := .probe }}
{{- $port := .port }}
readinessProbe:
  httpGet:
    path: {{ $probe.path }}
    port: {{ $port }}
  initialDelaySeconds: {{ $probe.initialDelaySeconds }}
  periodSeconds: {{ $probe.periodSeconds }}
  timeoutSeconds: {{ $probe.timeoutSeconds }}
  failureThreshold: {{ $probe.failureThreshold }}
{{- end }}

{{/* Standard security context for microservices */}}
{{- define "fleet.securityContext" -}}
securityContext:
  allowPrivilegeEscalation: {{ .Values.securityContext.allowPrivilegeEscalation }}
  readOnlyRootFilesystem: {{ .Values.securityContext.readOnlyRootFilesystem }}
  runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
  runAsUser: {{ .Values.securityContext.runAsUser }}
  capabilities:
    drop:
    {{- range .Values.securityContext.capabilities.drop }}
    - {{ . }}
    {{- end }}
{{- end }}

{{/* Standard pod security context */}}
{{- define "fleet.podSecurityContext" -}}
securityContext:
  runAsNonRoot: {{ .Values.podSecurityContext.runAsNonRoot }}
  runAsUser: {{ .Values.podSecurityContext.runAsUser }}
  fsGroup: {{ .Values.podSecurityContext.fsGroup }}
{{- end }}
