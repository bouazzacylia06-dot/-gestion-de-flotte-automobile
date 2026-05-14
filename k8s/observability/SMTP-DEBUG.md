# Débogage SMTP LaPoste pour Alertmanager

## Problème identifié

Les logs Alertmanager montrent :
```
"notify retry canceled after 1 attempts: context deadline exceeded"
```

Signification : Alertmanager ne peut pas se connecter/authentifier au serveur SMTP dans le délai imparti.

## Test manuel de l'authentification SMTP

### 1️⃣ Test local (ta machine)

```bash
# Installer telnet ou s-nail
apt install telnet  # Debian/Ubuntu
# ou
brew install telnet  # macOS

# Tester la connexion interactive
telnet smtp.laposte.net 587
# Réponse attendue : "220 ..." SMTP ready

# Commandes SMTP à tester une fois connecté :
# EHLO domain.local
# AUTH PLAIN (ou AUTH LOGIN selon support)
# Pour PLAIN : base64encode de "email@laposte.net:password"
```

### 2️⃣ Test avec Python (fiable)

```python
import smtplib

try:
    # Connexion
    server = smtplib.SMTP('smtp.laposte.net', 587, timeout=5)
    print("✅ Connexion établie")
    
    # STARTTLS
    server.starttls()
    print("✅ TLS activé")
    
    # Authentification
    server.login('loic.francois44@laposte.net', 'w@terc00linG')
    print("✅ Authentification réussie !")
    
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Auth échouée: {e}")
except smtplib.SMTPException as e:
    print(f"❌ Erreur SMTP: {e}")
except Exception as e:
    print(f"❌ Erreur: {e}")
```

Exécute ça sur ta machine locale pour valider l'auth SMTP.

### 3️⃣ Possibilités de correction

**Si l'auth échoue localement :**
- ✋ Vérifie que `w@terc00linG` est le **bon mot de passe**
- ✋ Essaye sans le caractère `@` (échappement shell possible ?)
- ✋ Cherche si LaPoste a besoin d'une "App Password" spécifique (comme Gmail)

**Si l'auth passe localement mais échoue dans le pod :**
- C'est probablement un issue de **timeout réseau K8s**
  - Solution : augmente `timeout` dans Alertmanager config
  - Ou : crée un NetworkPolicy qui autorise egress 587 vers `smtp.laposte.net`

## Debug en K8s

### Vérifier la résolution DNS dans le pod

```bash
kubectl exec -n flotte-observability alertmanager-prometheus-kube-prometheus-alertmanager-0 \
  -c alertmanager -- nslookup smtp.laposte.net
```

### Vérifier la config SMTP réelle chargée

```bash
kubectl exec -n flotte-observability alertmanager-prometheus-kube-prometheus-alertmanager-0 \
  -c alertmanager -- grep -A 10 "smarthost" /etc/alertmanager/config_out/alertmanager.env.yaml
```

### Activer logs DEBUG dans Alertmanager

```bash
kubectl set env -n flotte-observability \
  statefulset/alertmanager-prometheus-kube-prometheus-alertmanager \
  -e "ALERTMANAGER_LOG_LEVEL=debug"

kubectl rollout restart statefulset/alertmanager-prometheus-kube-prometheus-alertmanager -n flotte-observability
```

## Prochaines étapes

1. **Exécute le test Python ci-dessus localement**
2. Dis-moi si l'auth SMTP passe ✅ ou échoue ❌
3. Je peux soit :
   - Corriger les credentials `.env`
   - Modifier la config Alertmanager pour debug
   - Tester avec un server SMTP simplifié (Mailtrap, SendGrid gratuit, etc.)

