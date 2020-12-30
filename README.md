# Upload Server
Upload service backend (Node + Express) and frontend (Vue)  
Requires Nginx or another reverse proxy  

## Backend Setup
`npm install`  
`node dbif.js --add-admin <admin_username>`  
`<enter desired password>`  
`node app.js [port]` or `forever app.js [port]`  

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
