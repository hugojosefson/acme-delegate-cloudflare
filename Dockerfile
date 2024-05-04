FROM denoland/deno:1.43.1

EXPOSE 80/tcp

WORKDIR /app
ADD . /app
RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-read=.", "--allow-env", "main.ts"]
