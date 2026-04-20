# Étape 1 — Build
FROM python:3.10-slim AS builder

WORKDIR /app

# Copier et installer les dépendances
COPY app/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Étape 2 — Image finale légère
FROM python:3.10-slim

# Créer un utilisateur non-root (sécurité)
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copier les dépendances installées
COPY --from=builder /root/.local /home/appuser/.local

# Copier le code source
COPY app/ .

# Donner les droits à l'utilisateur
RUN chown -R appuser:appuser /app

# Basculer sur l'utilisateur non-root
USER appuser

# Variable d'environnement
ENV PATH=/home/appuser/.local/bin:$PATH
ENV FLASK_ENV=production

# Port exposé
EXPOSE 5000

# Lancer avec Gunicorn (production)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
