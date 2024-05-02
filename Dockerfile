FROM denoland/deno:1.43.1

WORKDIR /app
EXPOSE 10101

ADD . /app
RUN deno cache main.ts
CMD ["run", "--allow-net", "--allow-read=.", "--allow-env", "--allow-write=.", "main.ts"]
