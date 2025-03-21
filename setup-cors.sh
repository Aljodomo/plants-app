#!/bin/bash

BUCKET_NAME="gs://plants-app-c271d.appspot.com"
PUBLIC_IP=$(curl -s ifconfig.me)

if [ -z "$PUBLIC_IP" ]; then
    echo "Failed to get public IP"
    exit 1
fi

echo "Current Public IP: $PUBLIC_IP"

# Create temporary CORS configuration
cat > cors.json << EOF
[
    {
        "origin": [
            "https://plants-app-c271d.web.app",
            "http://${PUBLIC_IP}",
            "https://${PUBLIC_IP}"
        ],
        "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
        "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Content-Encoding", "Range"],
        "maxAgeSeconds": 3600
    }
]
EOF

# Apply CORS configuration
echo "Setting CORS for bucket: $BUCKET_NAME"
gsutil cors set cors.json $BUCKET_NAME

if [ $? -eq 0 ]; then
    echo "CORS configuration updated successfully"
    # Verify the configuration
    echo -e "\nCurrent CORS configuration:"
    gsutil cors get $BUCKET_NAME
else
    echo "Failed to update CORS configuration"
fi

# Clean up
rm cors.json