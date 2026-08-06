
FROM python:3.10-slim AS builder

WORKDIR /app


COPY app/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


FROM python:3.10-slim


RUN useradd -m -u 1000 appuser

WORKDIR /app


COPY --from=builder /root/.local /home/appuser/.local


COPY app/ .


RUN chown -R appuser:appuser /app


USER appuser


ENV PATH=/home/appuser/.local/bin:$PATH
ENV FLASK_ENV=production


EXPOSE 5000


CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
