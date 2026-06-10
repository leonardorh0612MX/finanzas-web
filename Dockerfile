FROM python:3.12-slim

WORKDIR /app
COPY . .

# El server solo usa la stdlib de Python — sin pip install.
EXPOSE 8765
ENV NO_BROWSER=1

CMD ["python", "server.py"]
