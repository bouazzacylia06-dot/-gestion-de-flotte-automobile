# CI/CD Gestion de Flotte de Véhicules

## Fichier de configuration généré
Le pipeline CI/CD complet est dans `.github/workflows/ci-cd.yml`.


## Démo locale
```bash
cd "C:\Users\VMI\Desktop\gestion-flotte-cicd"
code .
git init
# Pousser vers votre repo GitHub pour tester
```

## Secrets requis (GitHub Settings > Secrets and variables > Actions)
- `GITHUB_TOKEN` (automatique)
- `KUBE_CONFIG` : Contenu du fichier `~/.kube/config` de votre cluster dev

**Pipeline prêt à l'emploi !** Clonez ce dossier dans votre repo principal.

