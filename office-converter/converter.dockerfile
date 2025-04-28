FROM python:3.11

WORKDIR /app/

COPY ./requirements.txt .
RUN pip install -r requirements.txt

RUN apt update && apt install -y libreoffice 

COPY . .

CMD ["fastapi", "dev", "main.py"]