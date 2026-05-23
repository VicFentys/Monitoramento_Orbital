FROM python:3.11-slim

# Evitar que o Python gere arquivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1
# Evitar buffering de output para logs em tempo real
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências globalmente no container (sem venv)
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copiar o restante da aplicação
COPY . /app/

# Expor a porta que o FastAPI utilizará
EXPOSE 8000

# Comando para rodar a aplicação em desenvolvimento local (será sobrescrito no compose com reloading se necessário)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
