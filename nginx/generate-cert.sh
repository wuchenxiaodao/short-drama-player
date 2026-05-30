#!/bin/bash
# Generate self-signed SSL certificate for local development
# Output: nginx/certs/cert.pem + nginx/certs/key.pem

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

mkdir -p "$CERTS_DIR"

if [ -f "$CERTS_DIR/cert.pem" ] && [ -f "$CERTS_DIR/key.pem" ]; then
    echo "SSL certificates already exist at $CERTS_DIR/, skipping generation."
    echo "To regenerate, delete the existing certificates first:"
    echo "  rm $CERTS_DIR/cert.pem $CERTS_DIR/key.pem"
    exit 0
fi

echo "Generating self-signed SSL certificate..."

openssl req -x509 -nodes \
    -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERTS_DIR/key.pem" \
    -out "$CERTS_DIR/cert.pem" \
    -subj "/C=CN/ST=Local/L=Local/O=ShortDrama/OU=Dev/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

if [ $? -eq 0 ]; then
    echo "SSL certificate generated successfully:"
    echo "  Certificate: $CERTS_DIR/cert.pem"
    echo "  Private Key: $CERTS_DIR/key.pem"
    echo "  Valid for: 365 days"
    echo ""
    echo "Note: This is a self-signed certificate. Browsers will show a security warning."
    echo "      For production, use a certificate from a trusted CA (e.g., Let's Encrypt)."
else
    echo "Error: Failed to generate SSL certificate." >&2
    exit 1
fi
