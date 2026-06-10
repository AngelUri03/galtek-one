function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function pemToSpkiArrayBuffer(pem) {
  const header = "-----BEGIN PUBLIC KEY-----";
  const footer = "-----END PUBLIC KEY-----";
  let body = pem.trim();

  // Soporta: con o sin BEGIN/END
  if (body.includes(header)) {
    body = body.substring(body.indexOf(header) + header.length);
    if (body.includes(footer)) {
      body = body.substring(0, body.indexOf(footer));
    }
  }
  // Limpia espacios/CR/LF
  body = body.replace(/[\r\n\s]/g, "");
  return base64ToArrayBuffer(body);
}

export async function encryptRSAOAEPToBase64(pemPublic, plainText) {
  const spki = pemToSpkiArrayBuffer(pemPublic);
  const key = await crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const data = new TextEncoder().encode(plainText);
  const ct = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, data);

  const bytes = new Uint8Array(ct);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}