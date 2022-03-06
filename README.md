# Upload Server

Multi-user upload service, including backend and frontend components.
Requires Nginx or another reverse proxy.

## Features

* Upload, view, and delete files
* Administrative and vanilla user types
* Non-admin users can only index their own uploaded files
* Secret URL generation
* Dark and light themes

## Backend Setup

Upon running the app for the first time, you will be prompted to create an
admin account.

```
$ npm install
...
$ node app.js
Username> admin
Password> ********
$ node app.js [port] # or use `forever node app.js [port]`
Launching on port [port]
```

Frontend setup instructions are located in the frontend directory

## Nginx Example Setup

Assuming port 1234

```
server{
        server_name <subdomain>.<domain>.<TLD>;

        listen 443;
        listen [::]:443;

        include some_misc_configuration.conf;
        client_max_body_size 128M;
        root /absolute/path/to/dist;
        # Serve upload API
        location /api{
                proxy_pass http://localhost:1234/;
        }
        # Serve uploaded files
        location /file{
                proxy_pass http://localhost:1234;
        }
}
```

## License

MIT
